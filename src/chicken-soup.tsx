import { updateCommandMetadata, open, LocalStorage, LaunchType, environment, Clipboard } from "@raycast/api";
import fetch from "node-fetch";

export default async function Command() {
  if (LaunchType.Background === environment.launchType) {
    const data = await getData();
    await LocalStorage.setItem("chicken-soup", JSON.stringify(data));
    await updateCommandMetadata({ subtitle: `${data.content}` });
  } else {
    const storeage = await LocalStorage.getItem<string>("chicken-soup");
    if (!storeage) {
      const data = await getData();
      await LocalStorage.setItem("chicken-soup", JSON.stringify(data));
      await updateCommandMetadata({ subtitle: `${data.content}` });
      return;
    }
    const data = JSON.parse(storeage);
    open(
      encodeURI(
        `raycast://extensions/like-ai/likeai-extension/show-markdown?arguments={"queryText":"${data.content}", "sub":"${data.note}"}`,
      ),
    );
    // open(encodeURI(`raycast://extensions/isfeng/easydict/easydict?arguments={"queryText":"${data.content}-${data.note}"}`));
  }
}

function getData(): any {
  return fetch(`http://open.iciba.com/dsapi/?date=${formatDate(getRandomDay())}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json", // 根据需要设置合适的内容类型
    },
  })
    .then((response) => response.json())
    .then((data: unknown) => {
      return data;
    })
    .catch(() => {
      return getData();
    });
}

function getRandomDay(): Date {
  // 获取当前日期
  const currentDate = new Date();
  // 生成随机年份（2000年至今）
  const randomYear = Math.floor(Math.random() * (currentDate.getFullYear() - 2014 + 1)) + 2014;
  // 生成随机月份（0至11，所以需要加1）
  const randomMonth = Math.floor(Math.random() * 12) + 1;
  // 生成随机日期（1至月底）
  const lastDayOfMonth = new Date(randomYear, randomMonth, 0).getDate();
  const randomDay = Math.floor(Math.random() * lastDayOfMonth) + 1;
  // 构建随机日期对象
  const randomDate = new Date(randomYear, randomMonth - 1, randomDay);
  return randomDate;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
