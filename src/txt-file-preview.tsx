import { Action, ActionPanel, closeMainWindow, Detail, getSelectedFinderItems, Icon, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs";
import path from "path";

const unsupport = ['xlsx', 'csv', "png", "jpeg", "mov", "sqlite"];

export default function () {
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState("md");
  const [markdown, setDetail] = useState("");
  const [navigation, setNavigation] = useState("Loading...");
  const [filePath, setPath] = useState("Loading...");

  useEffect(() => {
    setIsLoading(true);
    getSelectedFinderItems()
      .then((items) => {
        // tsx read file content
        const filePath = items[0].path;
        const type = filePath.substring(filePath.lastIndexOf(".") + 1, filePath.length)
        unsupport.forEach((e) => {
          if (type.includes(e)) {
            throw new Error("unsupport file type.");  
          }
        })
        setType(type);
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInKB = fileSizeInBytes / 1024;
        if (fileSizeInKB > 200) {
          throw new Error(`文件大小: ${fileSizeInKB.toFixed(2)}KB, 超过限制`);
        } else {
          const content = fs.readFileSync(path.resolve(filePath), "utf8");
          setDetail(content);
        }
        setPath(filePath);
        setNavigation(filePath.substring(filePath.lastIndexOf("/") + 1, filePath.length));
        setIsLoading(false);
      })
      .catch(async (error) => {
        console.error(`Failed! ${error.message}❗`);
        await showHUD(`Failed! ${error.message}❗`);
        await closeMainWindow();
      });
  }, []);

  function content() {
    return type === "md" ? markdown : "```" + type + "\n" + markdown;
  }

  return (
    <Detail
      markdown={content()}
      isLoading={isLoading}
      navigationTitle={navigation}
      actions={
        <ActionPanel>
          <Action.Open icon={Icon.Code} target={`zed://file${filePath}`} title="Open with Zed" />
          <Action.Open
            icon={Icon.Code}
            target={`zed://file${filePath.substring(0, filePath.lastIndexOf("/"))}`}
            title="Open File Directory with Zed"
          />
          <Action.CopyToClipboard content={markdown} shortcut={{ modifiers: ["cmd"], key: "c" }} />
          <Action.OpenWith path={filePath} shortcut={{ modifiers: ["cmd"], key: "y" }} />
        </ActionPanel>
      }
    />
  );
}
