import { DallEAPIWrapper } from "@langchain/openai";
import { z } from "zod";
import { DallE, DallELoading } from "@/components/prebuilt/dalle";
import { createRunnableUI } from "@/utils/server";
import { DynamicStructuredTool } from "@langchain/core/tools";
import OpenAI from "openai";

const openai = new OpenAI();

export const dalleSchema = z.object({
  prompt: z.string().describe("A text description for the image user wish to generate"),
});

export async function dalleData(input: z.infer<typeof dalleSchema>) {

  const image = await openai.images.generate({ 
    model: "dall-e-3", 
    prompt: input.prompt,
    quality: 'hd',
  });

  const imageURL = String(image.data[0].url)

  return {
    imageURL
  };
}

export const dalleTool = new DynamicStructuredTool({
  name: "dalle_image",
  description: "create image using OpenAI's Dall-E image generation tool.",
  schema: dalleSchema,
  func: async (input, config) => {
    const stream = await createRunnableUI(config, 
      <DallELoading />
    );
    const data = await dalleData(input);
    stream.done(
      <DallE {...data} />
    );
    return JSON.stringify(data, null);
  },
});