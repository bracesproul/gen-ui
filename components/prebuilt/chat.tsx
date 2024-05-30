"use client";

import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EndpointsContext } from "@/app/agent";
import { useActions } from "@/utils/client";
import { LocalContext } from "@/app/shared";
import { AIMessageText, HumanMessageText } from "./message";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./auth";

export interface ChatProps {}

export default function Chat() {
  const actions = useActions<typeof EndpointsContext>();
  const authMessage = "You must authenticate first.";
  const authSuccessMessage = "Successfully authenticated!";
  const searchParams = useSearchParams();

  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const nameParam = searchParams.get("name");
    if (!nameParam) return;
    async function postAuthRequest() {
      const customAuthSuccessMessage = `${authSuccessMessage} Welcome, ${nameParam}!`;
      const newElements = [...elements];
      const newHistory: [role: string, content: string][] = [
        ...history,
        ["assistant", customAuthSuccessMessage],
      ];
      const lastUserQuestion = history[history.length - 2]?.[1];

      const element = await actions.agent({
        input: lastUserQuestion,
        chat_history: newHistory,
      });

      newElements.push(
        <div
          className="flex flex-col w-full gap-1 mt-auto"
          key={newHistory.length}
        >
          <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
            <AIMessageText content={customAuthSuccessMessage} />
            {element.ui}
          </div>
        </div>,
      );

      // consume the value stream to obtain the final string value
      // after which we can append to our chat history state
      (async () => {
        let lastEvent = await element.lastEvent;
        if (typeof lastEvent === "string") {
          setHistory([...newHistory, ["assistant", lastEvent]]);
        }
      })();

      setElements(newElements);
      setInput("");
    }
    if (nameParam && history[history.length - 1]?.[1] === authMessage) {
      postAuthRequest().then(() => {
        // no-op
      });
    }
  }, [searchParams]);

  async function onSubmit(input: string) {
    const newElements = [...elements];
    const nameParam = searchParams.get("name");

    if (!nameParam) {
      newElements.push(
        <div
          className="flex flex-col w-full gap-1 mt-auto"
          key={history.length}
        >
          <HumanMessageText content={input} />
          <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
            <LoginForm />
            <AIMessageText content={authMessage} />
          </div>
        </div>,
      );

      setHistory((prev) => [
        ...prev,
        ["user", input],
        ["assistant", authMessage],
      ]);

      setElements(newElements);
      setInput("");
      return;
    }

    // execute the agent with user input and chat history
    const element = await actions.agent({ input, chat_history: history });

    newElements.push(
      <div className="flex flex-col w-full gap-1 mt-auto" key={history.length}>
        <HumanMessageText content={input} />
        <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
          {element.ui}
        </div>
      </div>,
    );

    // consume the value stream to obtain the final string value
    // after which we can append to our chat history state
    (async () => {
      let lastEvent = await element.lastEvent;
      if (typeof lastEvent === "string") {
        setHistory((prev) => [
          ...prev,
          ["user", input],
          ["assistant", lastEvent],
        ]);
      }
    })();

    setElements(newElements);
    setInput("");
  }

  return (
    <div className="w-[70vw] overflow-y-scroll h-[80vh] flex flex-col gap-4 mx-auto border-[1px] border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50/25">
      <LocalContext.Provider value={onSubmit}>
        <div className="flex flex-col w-full gap-1 mt-auto">{elements}</div>
      </LocalContext.Provider>
      <form
        onSubmit={async (e) => {
          e.stopPropagation();
          e.preventDefault();
          onSubmit(input);
        }}
        className="w-full flex flex-row gap-2"
      >
        <Input
          placeholder="What's the weather like in San Francisco?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
