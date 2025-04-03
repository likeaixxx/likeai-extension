import { closeMainWindow, getSelectedText, open, showHUD } from "@raycast/api";

export default async function command() {
  await closeMainWindow();
  try {
    const recognizedText = await getSelectedText();
    if (!recognizedText) {
      return await showHUD("❌ No text selected!");
    }
    try {
      open(`raycast://extensions/raycast/translator/translate?fallbackText=${encodeURIComponent(recognizedText)}`);
    } catch (e) {
      console.log(e);
      return await showHUD("⚠️ Failed to open translate");
    }
  } catch (e) {
    console.log(e);
    return await showHUD("❌ No text selected!");
  }
}
