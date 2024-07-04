import { BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateGraph, START, END } from "@langchain/langgraph";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { githubTool, invoiceTool, weatherTool, websiteDataTool, dalleTool } from "./tools";
import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import axios from 'axios';

interface AgentExecutorState {
  input: string;
  chat_history: BaseMessage[];
  result?: string;
  toolCall?: {
    name: string;
    parameters: Record<string, any>;
  };
  toolResult?: Record<string, any>;
}

const invokeModel = async (
  state: AgentExecutorState,
  config?: RunnableConfig,
): Promise<Partial<AgentExecutorState>> => {
  try {
    // Prepare the payload for the Flask backend
    const payload = {
      input: state.input,
      chat_history: state.chat_history
    };

    // Call the Flask endpoint
    const response = await axios.post('http://localhost:5500/api/invoke-model', payload, config);

    // Extract the content of the assistant's message
    const assistantMessage = response.data.choices[0].message.content;

    console.log('Assistant message:', assistantMessage);

    // Update the state with the assistant's response
    return {
      result: assistantMessage,
    };
  } catch (error) {
    console.error('Error invoking model:', error);
    throw new Error('Failed to invoke model.');
  }
};



const invokeToolsOrReturn = (state: AgentExecutorState) => {
  if (state.toolCall) {
    return "invokeTools";
  }
  if (state.result) {
    return END;
  }
  throw new Error("No tool call or result found.");
};

const invokeTools = async (
  state: AgentExecutorState,
  config?: RunnableConfig,
): Promise<Partial<AgentExecutorState>> => {
  if (!state.toolCall) {
    throw new Error("No tool call found.");
  }
  const toolMap = {
    [githubTool.name]: githubTool,
    [invoiceTool.name]: invoiceTool,
    [weatherTool.name]: weatherTool,
    [websiteDataTool.name]: websiteDataTool,
    [dalleTool.name]: dalleTool,
  };

  const selectedTool = toolMap[state.toolCall.name];
  if (!selectedTool) {
    throw new Error("No tool found in tool map.");
  }
  const toolResult = await selectedTool.invoke(
    state.toolCall.parameters,
    config,
  );
  return {
    toolResult: JSON.parse(toolResult),
  };
};

export function agentExecutor() {
  const workflow = new StateGraph<AgentExecutorState>({
    channels: {
      input: null,
      chat_history: null,
      result: null,
      toolCall: null,
      toolResult: null,
    },
  })
    .addNode("invokeModel", invokeModel)
    .addNode("invokeTools", invokeTools)
    .addConditionalEdges("invokeModel", invokeToolsOrReturn)
    .addEdge(START, "invokeModel")
    .addEdge("invokeTools", END);

  const graph = workflow.compile();
  return graph;
}
