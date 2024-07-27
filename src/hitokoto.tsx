import { LaunchType, LocalStorage, environment, updateCommandMetadata, open } from "@raycast/api";
import fetch from "node-fetch";

export default async function () {
  if (LaunchType.Background === environment.launchType) {
    const h = await hitokoto();
    await LocalStorage.setItem("hitokoto", h);
    await updateCommandMetadata({ subtitle: `${h}` });
  } else {
    const storeage: string | undefined = await LocalStorage.getItem<string>("hitokoto");
    if (!storeage) {
      const h = await hitokoto();
      await LocalStorage.setItem("hitokoto", h);
      await updateCommandMetadata({ subtitle: `${h}` });
      return;
    }
    open(
      encodeURI(
        `raycast://extensions/like-ai/likeai-extension/show-markdown?arguments={"queryText":"${storeage}", "sub":""}`,
      ),
    );
  }
}

async function hitokoto(): Promise<string> {
  return fetch("https://v1.hitokoto.cn/?c=a&c=b&c=c&c=e&c=f&c=g&c=d&c=h&c=i&c=j&c=k&c=l&encode=json")
    .catch((e) => e)
    .then((r) => r.json())
    .then((r) => r.hitokoto);
}
