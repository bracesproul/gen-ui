import { WebLoading, Web } from "@/components/prebuilt/web";
import { createRunnableUI } from "@/utils/server";
import { tool } from "@langchain/core/tools";
import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";
import { z } from "zod";

export const webSchema = z.object({
  url: z.string().describe("The url to scrape"),
});

export async function webData(input: z.infer<typeof webSchema>) {
  // Initialize the FireCrawlLoader
  const firecrawl = new FireCrawlLoader({
    url: input.url,
    mode: "scrape",
    params: {
      pageOptions: {
        screenshot: true,
      },
    },
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  const [scrapedData] = await firecrawl.load();

  return {
    ...input,
    title: scrapedData.metadata.title,
    description: scrapedData.metadata.description,
    screenshot: scrapedData.metadata.screenshot,
  };
}

export const websiteDataTool = tool(async (input, config) => {
  const stream = await createRunnableUI(config, <WebLoading />);
    const data = await webData(input);
    stream.done(<Web {...data} />);
    return JSON.stringify(data, null);
}, {
  name: "get_web_data",
  description: "A tool to fetch the current website data, given a url.",
  schema: webSchema,
});
