import fetch from "node-fetch";
import { RequestInit } from "node-fetch";
import { NET_WORK_ERROR } from "./constant";

// ------------------------------
// 工具函数：带超时可添加代理的 fetch
// ------------------------------
export const fetchWithTimeout = async <T>(url: string, options: RequestInit = {}, timeoutMs = 10_000): Promise<T> => {
 const controller = new AbortController();
 const id = setTimeout(() => controller.abort(), timeoutMs);
 try {
  const res = await fetch(url, { ...options, signal: controller.signal });
  if (res.status !== 200) {
   throw new Error(NET_WORK_ERROR);
  }
  return (await res.json()) as T;
 } catch (err) {
  if (err instanceof Error && err.name === "AbortError") {
   throw new Error(`${NET_WORK_ERROR} (timeout)`);
  }
  throw err;
 } finally {
  clearTimeout(id);
 }
};
