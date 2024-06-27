import { streamRunnableUI, exposeEndpoints } from "@/utils/server";
import { Order } from "./ai/schema";
import { graphAgentExecutor } from "./ai/graph";

async function filterGraph(inputs: { input: string; orders: Order[] }) {
  "use server";
  return streamRunnableUI(graphAgentExecutor(), inputs);
}

export const EndpointsContext = exposeEndpoints({ filterGraph });
