import { environment, LaunchType, showHUD, updateCommandMetadata, getPreferenceValues } from "@raycast/api";
import { fetchWithTimeout } from "./helper/fetch";

interface WeatherData {
 current: {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  weather_code: number;
 };
}

interface GeocodingData {
 results?: {
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
 }[];
}

export default async function Command() {
 try {
  const preferences = getPreferenceValues<Preferences.Weather>();
  const location = preferences.weather_location || "BeiJing"; // Default fallback

  // 1. Geocoding
  const geoData = await fetchGeocoding(location);
  if (!geoData.results || geoData.results.length === 0) {
   throw new Error(`Location not found: ${location}`);
  }
  const { name, latitude, longitude } = geoData.results[0];

  // 2. Weather
  const weatherData = await fetchWeather(latitude, longitude);

  const text = formatWeather(location, weatherData);

  if (environment.launchType === LaunchType.UserInitiated) {
   await showHUD(text);
  }

  await updateCommandMetadata({ subtitle: text });
 } catch (error) {
  if (environment.launchType === LaunchType.UserInitiated) {
   await showHUD("Failed to fetch weather");
  }
  console.error(error);
 }
}

async function fetchGeocoding(city: string): Promise<GeocodingData> {
 return await fetchWithTimeout<GeocodingData>(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
 return await fetchWithTimeout<WeatherData>(
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code`,
 );
}

function formatWeather(city: string, data: WeatherData): string {
 const { temperature_2m, apparent_temperature, relative_humidity_2m, wind_speed_10m, weather_code } = data.current;
 const emoji = getWeatherEmoji(weather_code);
 const condition = getWeatherLabel(weather_code);
 const feelsLike = Math.round(apparent_temperature);
 const wind = Math.round(wind_speed_10m * 10) / 10;
 return `${city}: ${emoji} ${temperature_2m}°C (${condition}, feels ${feelsLike}°C) · Humidity ${relative_humidity_2m}% · Wind ${wind} m/s`;
}

function getWeatherEmoji(code: number): string {
 // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
 if (code === 0) return "☀️";
 if (code === 1 || code === 2 || code === 3) return "☁️";
 if (code === 45 || code === 48) return "🌫️";
 if (code >= 51 && code <= 67) return "🌧️";
 if (code >= 71 && code <= 77) return "❄️";
 if (code >= 80 && code <= 82) return "🌧️";
 if (code >= 85 && code <= 86) return "❄️";
 if (code >= 95) return "⚡";
 return "🌡️";
}

function getWeatherLabel(code: number): string {
 if (code === 0) return "Clear";
 if (code === 1) return "Mostly clear";
 if (code === 2) return "Partly cloudy";
 if (code === 3) return "Overcast";
 if (code === 45 || code === 48) return "Fog";
 if (code >= 51 && code <= 55) return "Drizzle";
 if (code >= 56 && code <= 57) return "Freezing drizzle";
 if (code >= 61 && code <= 65) return "Rain";
 if (code >= 66 && code <= 67) return "Freezing rain";
 if (code >= 71 && code <= 75) return "Snow";
 if (code === 77) return "Snow grains";
 if (code >= 80 && code <= 82) return "Rain showers";
 if (code >= 85 && code <= 86) return "Snow showers";
 if (code >= 95 && code <= 99) return "Thunderstorm";
 return "Unknown";
}
