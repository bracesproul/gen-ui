import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createRunnableUI } from "../utils/server";
import { githubRepoTool, githubRepoToolSchema } from "./tools/github_repo";
import { Github, GithubLoading } from "@/components/prebuilt/github";
import { z } from "zod";
import { AIMessageLoading, AIMessageText } from "@/components/prebuilt/message";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

// write an async sleep function
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const githubTool = new DynamicStructuredTool({
  name: "github_repo",
  description: "A tool to fetch details of a Github repository. Given owner and repo names, this tool will return the repo description, stars, and primary language.",
  schema: githubRepoToolSchema,
  func: async (input, config) => {
    const stream = createRunnableUI(config);
    stream.update(<GithubLoading />);

    const result = await githubRepoTool(input);
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (_) {
      // Failed to parse, return error message
      stream.done(
        <p>{result}</p>,
      )
    }
    // Artificial delay to show off the loading state.
    // SMH! GPT-4o is too fast!
    await sleep(3000);
    console.log("PARSED RESULTS", parsedResult);
    stream.done(
      <Github {...parsedResult} />,
    );

    return result;
  },
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are an assistant tasked with either using tools to complete the users request, or engaging in conversation."],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const tools = [githubTool];

const llm = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o",
  streaming: true
});

export const agentExecutor = new AgentExecutor({
  agent: createToolCallingAgent({ llm, tools, prompt }),
  tools,
});