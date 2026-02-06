import { Action, ActionPanel, Detail, getApplications, getSelectedFinderItems, Icon } from "@raycast/api";
import { useEffect, useState } from "react";

const apps = async function () {
 const apps = await getApplications()
 return apps.map(app => { return app.name === "Visual Studio Code" ? app : null })
  .filter(app => app !== null);
}

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
    const fs = require("fs");
    const path = require("path");
    const filePath = items[0].path
    setDetail(fs.readFileSync(path.resolve(filePath), "utf8"));
    setPath(filePath);
    setType(filePath.substring(filePath.lastIndexOf(".") + 1, filePath.length))
    setNavigation(filePath.substring(filePath.lastIndexOf("/") + 1, filePath.length));
    setIsLoading(false);
   })
   .catch((error) => {
    setDetail("# Read failed... \n ```plaintext\n" + error);
    setNavigation("");
    setIsLoading(false);
   })
 }, []);

 function content() {
  return type === "md" ? markdown : "```" + type + "\n" + markdown
 }

 return (
  <Detail markdown={content()} isLoading={isLoading} navigationTitle={navigation}
   actions={
    < ActionPanel >
     <Action.Open icon={Icon.Code} target={`vscode://file${filePath}`} title="Open With VSCode" />
     <Action.Open icon={Icon.Code} target={`vscode://file${filePath.substring(0, filePath.lastIndexOf("/"))}`} title="Open File Directory With VScode" />
     <Action.CopyToClipboard content={markdown} shortcut={{ modifiers: ["cmd"], key: "c" }} />
     <Action.OpenWith path={filePath} shortcut={{ modifiers: ["cmd"], key: "y" }} />
    </ActionPanel >
   }
  />
 )
}
