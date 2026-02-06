import { LaunchType, LocalStorage, environment, updateCommandMetadata, open } from "@raycast/api";
import fetch from "node-fetch";

interface Hitokoto {
 hitokoto?: string;
 from?: string;
 from_who?: string;
}

export default async function () {
 if (LaunchType.Background === environment.launchType) {
  const h = await hitokoto();
  await LocalStorage.setItem("hitokoto", JSON.stringify(h));
  await updateCommandMetadata({ subtitle: `${h.hitokoto}` });
 } else {
  const storeage: string | undefined = await LocalStorage.getItem<string>("hitokoto");
  if (!storeage) {
   const h = await hitokoto();
   await LocalStorage.setItem("hitokoto", JSON.stringify(h));
   await updateCommandMetadata({ subtitle: `${h.hitokoto}` });
   return;
  }
  const h = JSON.parse(storeage);
  let sub = '';
  if (h.from) {
   sub = `《${h.from}》`;
  }
  if (h.from_who) {
   sub += `—————— ${h.from_who}`;
  }
  open(
   `raycast://extensions/like-ai/likeai-extension/show-markdown?arguments={"queryText":"${encodeURIComponent(h.hitokoto)}", "sub":"${sub}"}`,
  );
 }
}

async function hitokoto(): Promise<Hitokoto> {
 return fetch("https://v1.hitokoto.cn/?c=a&c=b&c=c&c=e&c=f&c=g&c=d&c=h&c=i&c=j&c=k&c=l&encode=json")
  .catch((e) => e)
  .then((res) => res.json());
}
