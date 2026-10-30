import { moveWindow } from "./helper/move-window-helper";

export default async function Command() {
  await moveWindow("right");
}
