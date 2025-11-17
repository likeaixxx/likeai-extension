// api.ts
//--------------------------------------------------
// Node.js + TypeScript implementation (ESM)
//--------------------------------------------------

import fetch from "node-fetch";
import { RequestInit } from "node-fetch";

// ------------------------------
// 常量
// ------------------------------
export const LYRICS = "/api/v1/lyrics";
export const CONFIRM = "/api/v1/lyrics/confirm";
export const OFFSET = "/api/v1/lyrics/offset";

export const NET_WORK_ERROR = "☹️Network Error";
export const NOTHING_FOUND = "☹️Nothing Found";
export const INVALID = "☹️Invalid Track Name";

// ------------------------------
// 数据模型
// ------------------------------
export interface LyricAPI {
  name?: string;
  singer?: string;
  id?: string;
  refresh?: boolean;
}

export interface ConfirmAPI {
  item: LyricResponseItem;
}

export interface OffsetAPI {
  sid: string;
  lid: string;
  offset?: number; // Int64 -> JS number
}

// ------------------------------
// 工具函数：带超时的 fetch
// ------------------------------
const fetchWithTimeout = async <T>(url: string, options: RequestInit = {}, timeoutMs = 10_000): Promise<T> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (res.status !== 200) {
      throw new Error(NET_WORK_ERROR);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`${NET_WORK_ERROR} (timeout)`);
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
};

// ------------------------------
// 业务接口
// ------------------------------

// 1. 获取歌词
export const lyrics = async (host: string, payload: LyricAPI): Promise<LyricResponseItem[]> => {
  console.log("lyrics", payload);
  console.log("lyrics", host);
  if (!payload.name) throw new Error(INVALID);
  const body = await fetchWithTimeout<LyricResponseBody>(host + LYRICS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (body.data && body.data.length) return body.data;
  throw new Error(NOTHING_FOUND);
};

// 2. 人工确认
export const confirm = async (host: string, payload: ConfirmAPI): Promise<void> => {
  await fetchWithTimeout<void>(host + CONFIRM, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload.item),
  });
};

// 3. 调整 offset
export const offset = async (host: string, payload: OffsetAPI): Promise<void> => {
  await fetchWithTimeout<void>(host + OFFSET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

//--------------------------------------------------
// 数据模型 & 工具函数
//--------------------------------------------------

/* --------------------------------- 常量 --------------------------------- */
export const QQ = "QQ Music";
export const KuGou = "KuGou Music";
export const NetEase = "NetEase Music";

/* --------------------------------- 类型 --------------------------------- */

// 前端播放用的时间轴行
export interface LyricLine {
  id: string; // 使用 UUID 字符串
  beg: number; // 秒
  text: string; // 原文
  tran: string; // 翻译
  end: number; // 秒
}

// 后端返回体
export interface LyricResponseBody {
  code: number;
  message?: string;
  data?: LyricResponseItem[];
}

// 后端返回的单条歌词元数据
export interface LyricResponseItem {
  singer: string;
  name: string;
  sid: string;
  lid: string;
  lyrics: string; // base64
  trans: string; // base64
  type: string;
  offset: number; // Int64 -> JS number
}

/* ------------------------------------------------------------------------
 * HTML 字符实体转义
 * --------------------------------------------------------------------- */
export const decodeHTML = (str: string): string =>
  str
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\\[nrt]/g, "") // 去掉 \n \r \t
    .replace(/\/\//g, "")
    .replace(/\\\\/g, "");

/* ------------------------------------------------------------------------
 * 这里本应有 Swift 中的 Lyrics() 解析逻辑，
 * 但按你的说明 **暂不转换**，你可在需要时另行实现。
 * --------------------------------------------------------------------- */
