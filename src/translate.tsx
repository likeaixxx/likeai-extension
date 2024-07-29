import { getSelectedText, open } from "@raycast/api";

export default async function () {
  open(`raycast://extensions/raycast/translator/translate?fallbackText=${(await getSelectedText()) || ""}`);
}
