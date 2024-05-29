import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Octokit } from "octokit";

export class GithubRepoTool extends StructuredTool {
  schema = z.object({
    owner: z.string().describe("The name of the repository owner."),
    repo: z.string().describe("The name of the repository."),
  });

  name = "github_repo";

  description = "A tool to fetch details of a Github repository. Given owner and repo names, this tool will return the repo description, stars, and primary language.";

  githubClient: Octokit;

  constructor() {
    super();
    if (!process.env.GITHUB_TOKEN) {
      throw new Error("Missing GITHUB_TOKEN secret.")
    }
    this.githubClient = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })
  }

  /**
   * Returns a JSON stringified object with the following schema:
   * owner: string;
   * repo: string;
   * description: string;
   * stars: number;
   * language: string;
   * 
   * Or, returns an error message if the repository is not found.
   */
  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const repoData = await this.githubClient.request('GET /repos/{owner}/{repo}', {
        owner: input.owner,
        repo: input.repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      return JSON.stringify({
        ...input,
        description: repoData.data.description,
        stars: repoData.data.stargazers_count,
        language: repoData.data.language,
      })
    } catch (err) {
      console.error(err);
      return "There was an error fetching the repository. Please check the owner and repo names."
    }
  }
}