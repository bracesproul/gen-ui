import "server-only";

import { ReactNode, isValidElement } from "react";
import { AIProvider } from "./client";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import {
  Runnable,
  RunnableConfig,
  RunnableLambda,
} from "@langchain/core/runnables";
import { CompiledStateGraph } from "@langchain/langgraph";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { AIMessage } from "@/ai/message";

const STREAM_UI_RUN_NAME = "stream_runnable_ui";

const removeUiFromObject = (obj: Record<string, any>) => {
  const newObj = { ...obj };

  if ("ui" in newObj) {
    delete newObj.ui;
  }

  const keys = Object.keys(newObj);
  for (const key of keys) {
    if (key === "ui") {
      delete newObj.ui;
    } else if (typeof newObj[key] === "object") {
      newObj[key] = removeUiFromObject(newObj[key]);
    }
  }

  return newObj;
};

/**
 * Executes `streamEvents` method on a runnable
 * and converts the generator to a RSC friendly stream
 *
 * @param runnable
 * @returns React node which can be sent to the client
 */
export function streamRunnableUI<RunInput, RunOutput>(
  runnable:
    | Runnable<RunInput, RunOutput>
    | CompiledStateGraph<RunInput, Partial<RunInput>>,
  inputs: RunInput,
) {
  const ui = createStreamableUI();
  const [lastEvent, resolve] = withResolvers<string | Record<string, any>>();

  (async () => {
    let lastEventValue: StreamEvent | null = null;

    const callbacks: Record<
      string,
      ReturnType<typeof createStreamableUI | typeof createStreamableValue>
    > = {};

    for await (const streamEvent of (
      runnable as Runnable<RunInput, RunOutput>
    ).streamEvents(inputs, {
      version: "v1",
    })) {
      if (
        streamEvent.name === STREAM_UI_RUN_NAME &&
        streamEvent.event === "on_chain_end"
      ) {
        if (isValidElement(streamEvent.data.output.value)) {
          ui.append(streamEvent.data.output.value);
        }
      }

      const [kind, type] = streamEvent.event.split("_").slice(1);
      if (type === "stream" && kind !== "chain") {
        const chunk = streamEvent.data.chunk;
        if ("text" in chunk && typeof chunk.text === "string") {
          if (!callbacks[streamEvent.run_id]) {
            // the createStreamableValue / useStreamableValue is preferred
            // as the stream events are updated immediately in the UI
            // rather than being batched by React via createStreamableUI
            const textStream = createStreamableValue();
            ui.append(<AIMessage value={textStream.value} />);
            callbacks[streamEvent.run_id] = textStream;
          }

          callbacks[streamEvent.run_id].append(chunk.text);
        }
      }

      lastEventValue = streamEvent;
    }

    // If UI is being passed around as state anywhere, we must remove it before sending it to the client
    // TODO: Can I do this before resolving the langgraph graph?
    lastEventValue = removeUiFromObject(lastEventValue ?? {}) as StreamEvent;
    // resolve the promise, which will be sent
    // to the client thanks to RSC
    resolve(lastEventValue?.data.output);

    Object.values(callbacks).forEach((cb) => cb.done());
    ui.done();
  })();

  return { ui: ui.value, lastEvent };
}

/**
 * Yields an UI element within a runnable,
 * which can be streamed to the client via `streamRunnableUI`
 *
 * @param callbackManager callback
 * @param initialValue Initial React node to be sent to the client
 * @returns Vercel AI RSC compatible streamable UI
 */
export const createRunnableUI = async (
  config?: RunnableConfig,
  initialValue?: React.ReactNode,
): Promise<ReturnType<typeof createStreamableUI>> => {
  if (!config) {
    throw new Error("Callback manager is not defined");
  }

  const lambda = RunnableLambda.from((init?: React.ReactNode) => {
    const ui = createStreamableUI(init);
    return ui;
  }).withConfig({ runName: STREAM_UI_RUN_NAME });

  return lambda.invoke(initialValue, config);
};

/**
 * Expose these endpoints outside for the client
 * We wrap the functions in order to properly resolve importing
 * client components.
 *
 * TODO: replace with createAI instead, even though that
 * implicitly handles state management
 *
 * See https://github.com/vercel/next.js/pull/59615
 * @param actions
 */
export function exposeEndpoints<T extends Record<string, unknown>>(
  actions: T,
): {
  (props: { children: ReactNode }): Promise<JSX.Element>;
  $$types?: T;
} {
  return async function AI(props: { children: ReactNode }) {
    return <AIProvider actions={actions}>{props.children}</AIProvider>;
  };
}

/**
 * Polyfill to emulate the upcoming Promise.withResolvers
 */
export function withResolvers<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;

  const innerPromise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // @ts-expect-error
  return [innerPromise, resolve, reject] as const;
}
