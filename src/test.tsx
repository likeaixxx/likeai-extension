import { Clipboard, updateCommandMetadata } from "@raycast/api";

export default async function () {
  // 前提：当前 Tinycast 版本实现了 Clipboard.readText()
  const value = (await Clipboard.readText()) ?? "read from Clipboard error";
  // const value =(await getSelectedText()) ?? "read from Clipboard error";
  console.log(value);
  await updateCommandMetadata({ subtitle: `${value}` });
}
