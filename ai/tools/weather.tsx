import {
  CurrentWeatherLoading,
  CurrentWeather,
} from "@/components/prebuilt/weather";
import { CUSTOM_UI_YIELD_NAME } from "@/utils/server";
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch/web";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const weatherSchema = z.object({
  city: z.string().describe("The city name to get weather for"),
  state: z
    .string()
    .describe("The two letter state abbreviation to get weather for"),
  country: z
    .string()
    .optional()
    .default("usa")
    .describe("The two letter country abbreviation to get weather for"),
});

export type WeatherToolSchema = z.infer<typeof weatherSchema>;

export async function weatherData(input: WeatherToolSchema) {
  const geoCodeApiKey = process.env.GEOCODE_API_KEY;
  if (!geoCodeApiKey) {
    throw new Error("Missing GEOCODE_API_KEY secret.");
  }

  const geoCodeResponse = await fetch(
    `https://geocode.xyz/${input.city.toLowerCase()},${input.state.toLowerCase()},${input.country.toLowerCase()}?json=1&auth=${geoCodeApiKey}`,
  );
  if (!geoCodeResponse.ok) {
    console.error("No geocode data found.");
    throw new Error("Failed to get geocode data.");
  }
  const geoCodeData = await geoCodeResponse.json();
  const { latt, longt } = geoCodeData;

  const weatherGovResponse = await fetch(
    `https://api.weather.gov/points/${latt},${longt}`,
  );
  if (!weatherGovResponse.ok) {
    console.error("No weather data found.");
    throw new Error("Failed to get weather data.");
  }
  const weatherGovData = await weatherGovResponse.json();
  const { properties } = weatherGovData;

  const forecastResponse = await fetch(properties.forecast);
  if (!forecastResponse.ok) {
    console.error("No forecast data found.");
    throw new Error("Failed to get forecast data.");
  }
  const forecastData = await forecastResponse.json();
  const { periods } = forecastData.properties;
  const todayForecast = periods[0];

  return {
    ...input,
    temperature: todayForecast.temperature,
  };
}

export const weatherTool = tool(
  async (input, config) => {
    await dispatchCustomEvent(
      CUSTOM_UI_YIELD_NAME,
      {
        output: {
          value: <CurrentWeatherLoading />,
          type: "append",
        },
      },
      config,
    );
    const data = await weatherData(input);
    await dispatchCustomEvent(
      CUSTOM_UI_YIELD_NAME,
      {
        output: {
          value: <CurrentWeather {...data} />,
          type: "update",
        },
      },
      config,
    );
    return JSON.stringify(data, null);
  },
  {
    name: "get_weather",
    description:
      "A tool to fetch the current weather, given a city and state. If the city/state is not provided, ask the user for both the city and state.",
    schema: weatherSchema,
  },
);
