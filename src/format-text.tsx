import { Action, ActionPanel, LaunchProps, List, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";
import { EasydictArguments } from "./Arguments";

export default function (props: LaunchProps<{ arguments: EasydictArguments }>) {
  const [text, setText] = useState(props.arguments.queryText);
  const [searchText, setSearchText] = useState(text);
  const [data, setData] = useState<string[]>([""]);

  useEffect(() => {
    async function loadSelectedText() {
      if (!props.arguments.queryText) {
        const selectedText = await getSelectedText();
        setText(selectedText);
        setSearchText(selectedText);
        fetchData(selectedText)
          .then((h) => {
            setData(h);
          })
          .catch((error) => {
            setData([error.stack]);
          });
      }
    }
    loadSelectedText();
  }, [props.arguments.queryText]);

  function onInputChange(text: string) {
    setSearchText(text);
    setText(text);

    fetchData(text)
      .then((h) => {
        setData(h);
      })
      .catch((error) => {
        setData([error.stack]);
      });
  }

  async function getSelected() {
    return await getSelectedText();
  }

  return (
    <List searchText={searchText} onSearchTextChange={onInputChange} searchBarPlaceholder={"text source..."}>
      {data.map((d) => {
        return (
          <List.Item
            title={d}
            key={d}
            detail={<List.Item.Detail markdown={d} />}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy" content={d} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );

  function fetchData(source: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        resolve(format(source));
      } catch (error) {
        reject(error);
      }
    });
  }

  function format(source: string): string[] {
    return [withCommaSingleQuotes(source), withComma(source)];
  }

  function withComma(source: string) {
    let res = "";
    console.log(source.split(/\s+/));
    for (let t of source.split(/\s+/)) {
      res += `${t.trim()},`;
    }
    res = res.replaceAll("''", "").replaceAll(",,", "");
    return res.substring(0, res.length - 1);
  }

  function withCommaSingleQuotes(source: string): string {
    let res = "";
    for (let t of source.split(/\s+/)) {
      res += `'${t.trim()}',`;
    }
    return res.substring(0, res.length - 1);
  }
}
