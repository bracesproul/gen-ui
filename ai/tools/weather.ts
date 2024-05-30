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

export async function weatherData(input: z.infer<typeof weatherSchema>) {
  const geoCodeApiKey = process.env.GEOCODE_API_KEY;
  if (!geoCodeApiKey) {
    throw new Error("Missing GEOCODE_API_KEY secret.");
  }

  const geoCodeResponse = await fetch(
    `https://geocode.xyz/${input.city.toLowerCase()},${input.state.toLowerCase()},${input.country.toLowerCase()}?json=1&auth=${geoCodeApiKey}`,
  );
  if (!geoCodeResponse.ok) {
    throw new Error("Failed to get geocode data.");
  }
  const geoCodeData = await geoCodeResponse.json();
  const { latt, longt } = geoCodeData;

  const weatherGovResponse = await fetch(
    `https://api.weather.gov/points/${latt},${longt}`,
  );
  if (!weatherGovResponse.ok) {
    throw new Error("Failed to get weather data.");
  }
  const weatherGovData = await weatherGovResponse.json();
  const { properties } = weatherGovData;

  const forecastResponse = await fetch(properties.forecast);
  if (!forecastResponse.ok) {
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
