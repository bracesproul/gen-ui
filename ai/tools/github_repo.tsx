import { z } from "zod";
import { Octokit } from "octokit";
import { tool } from "@langchain/core/tools";
import { createRunnableUI } from "@/utils/server";
import { Github, GithubLoading } from "@/components/prebuilt/github";

export const dynamic = 'force-dynamic';

const githubRepoToolSchema = z.object({
  owner: z.string().describe("The name of the repository owner."),
  repo: z.string().describe("The name of the repository."),
});

async function githubRepoTool(input: z.infer<typeof githubRepoToolSchema>) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("Missing GITHUB_TOKEN secret.");
  }
  const githubClient = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
  try {
    const repoData = await githubClient.request("GET /repos/{owner}/{repo}", {
      owner: input.owner,
      repo: input.repo,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return {
      ...input,
      description: repoData.data.description ?? "",
      stars: repoData.data.stargazers_count,
      language: repoData.data.language ?? "",
    };
  } catch (err) {
    console.error(err);
    return "There was an error fetching the repository. Please check the owner and repo names.";
  }
}

export const githubTool = tool(
  async (input, config) => {
    const stream = await createRunnableUI(config, <GithubLoading />);
    const result = await githubRepoTool(input);
    if (typeof result === "string") {
      // Failed to parse, return error message
      stream.update(<p>{result}</p>);
      stream.done();
      return result;
    }
    stream.update(<Github {...result} />);
    stream.done();
    return JSON.stringify(result, null);
  },
  {
    name: "github_repo",
    description:
      "A tool to fetch details of a Github repository. Given owner and repo names, this tool will return the repo description, stars, and primary language.",
    schema: githubRepoToolSchema,
  },
);
