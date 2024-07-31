import { WebLoading, Web } from "@/components/prebuilt/web";
import { tool } from "@langchain/core/tools";
import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";
import { z } from "zod";
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch/web";
import { CUSTOM_UI_YIELD_NAME } from "@/utils/server";

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

export const websiteDataTool = tool(
  async (input, config) => {
    await dispatchCustomEvent(
      CUSTOM_UI_YIELD_NAME,
      {
        output: {
          value: <WebLoading />,
          type: "append",
        },
      },
      config,
    );
    const data = await webData(input);
    await dispatchCustomEvent(
      CUSTOM_UI_YIELD_NAME,
      {
        output: {
          value: <Web {...data} />,
          type: "update",
        },
      },
      config,
    );
    return JSON.stringify(data, null);
  },
  {
    name: "get_web_data",
    description: "A tool to fetch the current website data, given a url.",
    schema: webSchema,
  },
);
