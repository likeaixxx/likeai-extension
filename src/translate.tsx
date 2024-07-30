import { getSelectedText, open } from "@raycast/api";

export default async function () {
  let text: string = "";
  try {
    text = await getSelectedText();
  } catch (e) {
    // pass
  }
  open(`raycast://extensions/raycast/translator/translate?fallbackText=${encodeURIComponent(text)}`);
}
