import { Action, ActionPanel, Icon, LaunchProps, List, getSelectedText } from "@raycast/api";
import * as changeCase from "change-case";
import { useEffect, useState } from "react";
import { EasydictArguments, toTitleCase } from "./Arguments";

export default function (props: LaunchProps<{ arguments: EasydictArguments }>) {
  const [text, setText] = useState(props.arguments.queryText || "");

  useEffect(() => {
    async function loadSelectedText() {
      if (!props.arguments.queryText) {
        let selectedText = "";
        try {
          selectedText = await getSelectedText();
        } catch (ignore) {
          // pass
        }
        setText(selectedText);
      }
    }
    loadSelectedText();
  }, [props.arguments.queryText]); // 更新依赖项

  function onInputChange(text: string) {
    console.log(`update input!! ${text}`);
    setText(text);
  }

  return (
    <List searchText={text} onSearchTextChange={onInputChange} searchBarPlaceholder={"convert time text..."}>
      {Array.from(caseTo(text)).map((to, index) => {
        return (
          <List.Item
            key={index}
            title={to[1]}
            subtitle={to[0]}
            icon={Icon.Circle}
            actions={
              <ActionPanel>
                <Action.Paste content={to[1]} />
                <Action.CopyToClipboard title="Copy" content={to[1]} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function caseTo(text: string): Map<string, string> {
  let map = new Map();
  map.set(
    "config constant",
    `private static final String ${changeCase.constantCase(text)} = "${changeCase.dotCase(text)}";`,
  );
  map.set("camel", changeCase.camelCase(text));
  map.set("snake", changeCase.snakeCase(text));
  map.set("dot", changeCase.dotCase(text));
  map.set("title", toTitleCase(text));
  map.set("constant", changeCase.constantCase(text));
  map.set("upper case", text.toUpperCase());
  map.set("lower case", text.toLowerCase());
  map.set("sentence", changeCase.sentenceCase(text));
  map.set("capital", changeCase.capitalCase(text));
  map.set("header", changeCase.headerCase(text));
  map.set("no", changeCase.noCase(text));
  map.set("param", changeCase.paramCase(text));
  map.set("path", changeCase.pathCase(text));
  return map;
}
