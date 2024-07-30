/*
 * @author: tisfeng
 * @createTime: 2023-05-15 23:31
 * @lastEditor: tisfeng
 * @lastEditTime: 2023-05-17 18:42
 * @fileName: ocr.tsx
 *
 * Copyright (c) 2023 by ${git_name}, All Rights Reserved.
 * @see https://github.com/raycast/extensions/blob/1eb9ef9d103488453a7bfa4bae630d8adaa1e3da/extensions/easydict/src/ocr.tsx
 */

import { closeMainWindow, open, showHUD, environment } from "@raycast/api";
import { execa, ExecaError } from "execa";
import { join } from "path";
import { chmod } from "fs/promises";

export default async function command() {
  await closeMainWindow();

  try {
    const recognizedText = await recognizeText();
    if (!recognizedText) {
      return await showHUD("❌ No text detected!");
    }
    console.log(`Recognized text: ${recognizedText}`);
    try {
      open(`raycast://extensions/raycast/translator/translate?fallbackText=${encodeURIComponent(recognizedText)}`);
    } catch (error) {
      console.error(error);
      await showHUD("⚠️ Failed to open translate");
    }
  } catch (e) {
    console.error(e);
    await showHUD("❌ Failed detecting text");
  }
}

const recognizeText = async () => {
  const command = join(environment.assetsPath, "recognizeText");
  await chmod(command, "755");
  try {
    // Maybe user has not installed Xcode(swift), https://github.com/raycast/extensions/pull/6613#issuecomment-1560785710
    // const filePath = join(environment.assetsPath, "recognizeText.swift");
    // const { stdout } = await execa("swift", [filePath]);
    const { stdout } = await execa(command);
    return stdout;
  } catch (error) {
    if ((error as ExecaError).stdout === "No text selected") {
      return undefined;
    } else {
      throw error;
    }
  }
};
