import { CurrentWebLoading, CurrentWeb } from "@/components/prebuilt/web";
import { createRunnableUI } from "@/utils/server";
import { DynamicStructuredTool } from "@langchain/core/tools";
import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

export const webSchema = z.object({
  url: z.string().describe("The url to scrape"),
});

export async function webData(input: z.infer<typeof webSchema>) {
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlApiKey) {
    throw new Error("Missing FIRECRAWL_API_KEY secret.");
  }
  // Initialize the FirecrawlApp with your API key
  const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

  // Scrape a single URL
  const url = input.url;

  const params = {
    pageOptions: {
      screenshot: true,
    },
  };

  const scrapedData = await app.scrapeUrl(url, params);

  const title = await scrapedData.data.metadata.title;
  const description = await scrapedData.data.metadata.description;
  const screenshot = await scrapedData.data.metadata.screenshot;

  return {
    ...input,
    title,
    description,
    screenshot,
  };
}

export const websiteDataTool = new DynamicStructuredTool({
  name: "get_web_data",
  description: "A tool to fetch the current website data, given a url.",
  schema: webSchema,
  func: async (input, config) => {
    const stream = await createRunnableUI(config, <CurrentWebLoading />);
    const data = await webData(input);
    stream.done(<CurrentWeb {...data} />);
    return JSON.stringify(data, null);
  },
});
