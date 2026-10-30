import { environment, LaunchType, showHUD, updateCommandMetadata, getPreferenceValues, open } from "@raycast/api";
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

const locationMap: Record<string, string> = {
  BeiJing: "北京",
  ShangHai: "上海",
  AnKang: "安康",
  YuXi: "玉溪",
  XiAn: "西安",
};

export default async function Command() {
  try {
    if (LaunchType.Background == environment.launchType) {
      const preferences = getPreferenceValues<Preferences.Weather>();
      const location = preferences.weather_location || "BeiJing"; // Default fallback
      // 1. Geocoding
      const geoData = await fetchGeocoding(location);
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location not found: ${location}`);
      }
      const { latitude, longitude } = geoData.results[0];
      // 2. Weather
      const weatherData = await fetchWeather(latitude, longitude);
      const text = formatWeather(location, weatherData);
      await updateCommandMetadata({ subtitle: text });
    } else {
      // Open macOS Weather app by path
      await open("/System/Applications/Weather.app");
    }
  } catch (error) {
    console.log(error)
    if (environment.launchType === LaunchType.UserInitiated) {
      await showHUD("Failed to fetch weather");
    }
  }
}

async function fetchGeocoding(city: string): Promise<GeocodingData> {
  return await fetchWithTimeout<GeocodingData>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
  );
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
  return `${locationMap[city] || city}: ${emoji} ${temperature_2m}°C (${condition}, 体感 ${feelsLike}°C) · 湿度 ${relative_humidity_2m}% · 风速 ${wind} m/s`;
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
  if (code === 0) return "晴朗";
  if (code === 1) return "大部分晴朗";
  if (code === 2) return "局部多云";
  if (code === 3) return "阴天";
  if (code === 45 || code === 48) return "雾";
  if (code >= 51 && code <= 55) return "毛毛雨";
  if (code >= 56 && code <= 57) return "冻毛毛雨";
  if (code >= 61 && code <= 65) return "雨";
  if (code >= 66 && code <= 67) return "冻雨";
  if (code >= 71 && code <= 75) return "雪";
  if (code === 77) return "雪粒";
  if (code >= 80 && code <= 82) return "阵雨";
  if (code >= 85 && code <= 86) return "阵雪";
  if (code >= 95 && code <= 99) return "雷雨";
  return "Unknown";
}
