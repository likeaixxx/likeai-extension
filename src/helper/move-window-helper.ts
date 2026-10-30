import { closeMainWindow, getPreferenceValues, showHUD, environment, LocalStorage } from "@raycast/api";
import { execa } from "execa";
import { join } from "path";
import { chmod } from "fs/promises";

interface MovePreferences {
  move_distance?: string;
}

export async function moveWindow(direction: "left" | "right" | "up" | "down") {
  // Close Raycast window first without blocking, letting the focus return transition run in parallel
  closeMainWindow();

  try {
    const preferences = getPreferenceValues<MovePreferences>();
    const distanceStr = preferences.move_distance?.trim() || "10";
    const distance = parseInt(distanceStr, 10);
    const chmodDone = LocalStorage.getItem("chmodDone");

    if (isNaN(distance) || distance <= 0) {
      await showHUD("⚠️ 请在插件首选项中设置一个大于 0 的 pt 值");
      return;
    }

    const binaryPath = join(environment.assetsPath, "moveWindow");
    if (!chmodDone) {
      try {
        await chmod(binaryPath, "755");
        localStorage.setItem("chmodDone", "1");
      } catch (e) {
        console.error("Failed to chmod:", e);
      }
    }

    // Execute the compiled Swift binary
    const { stdout } = await execa(binaryPath, [direction, distance.toString()]);

    if (stdout.trim() === "SUCCESS") {
      // const directionNames: Record<string, string> = {
      // left: "左",
      // right: "右",
      // up: "上",
      // down: "下",
      // };
      // await showHUD(`✅ 已向${directionNames[direction]}移动 ${distance} pt`);
    } else {
      // await showHUD(`❌ 移动失败: ${stdout}`);
    }
  } catch (error: unknown) {
    console.error(error);
    const err = error as { stdout?: string; message?: string };
    const msg = err.stdout || err.message || "";
    if (msg.includes("Accessibility permission")) {
      await showHUD("⚠️ 请授予 Raycast 辅助功能权限 (System Settings -> Accessibility)");
    } else {
      await showHUD(`❌ 移动窗口出错: ${err.message || "未知错误"}`);
    }
  }
}
