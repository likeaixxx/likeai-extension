import { LocalStorage, updateCommandMetadata } from "@raycast/api";
import fetch from "node-fetch";

interface Hitokoto {
  hitokoto?: string;
  from?: string;
  from_who?: string;
}

export default async function () {
  const h = await hitokoto();
  await LocalStorage.setItem("hitokoto", JSON.stringify(h));
  await updateCommandMetadata({ subtitle: `${h.hitokoto}` });
}

async function hitokoto(): Promise<Hitokoto> {
  return fetch("https://v1.hitokoto.cn/?c=a&c=b&c=c&c=e&c=f&c=g&c=d&c=h&c=i&c=j&c=k&c=l&encode=json")
    .catch((e) => e)
    .then((res) => res.json());
}
