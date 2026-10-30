import { Action, ActionPanel, Clipboard, closeMainWindow, Detail, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";

export default function () {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(true);
  const [formated, setFormated] = useState(false);

  useEffect(() => {
    Clipboard.readText()
      .then((h) => {
        if (h === undefined) {
          throw Error("undefined")
        }
        setData(JSON.stringify(keysToSnakeCase(JSON.parse(h)), null, "\t"));
        setLoading(false);
        setFormated(true);
      })
      .catch(async (error) => {
        console.error(`Failed! ${error.message}❗`);
        await showHUD(`Failed! ${error.message}❗`);
        await closeMainWindow();
      });
  }, []);

  return (
    <Detail
      isLoading={loading}
      markdown={(formated && "```json\n" + data) || `## ${data}`}
      actions={
        !loading &&
        formated && (
          <ActionPanel>
            <Action.Paste content={data} />
            <Action.CopyToClipboard content={data} title="Copy Formated JSON" />
          </ActionPanel>
        )
      }
    />
  );
}

type ValueTypes = string | number | boolean | undefined | Record<string, unknown> | Array<unknown>;

function toSnakeCase(str: string): string {
  return str.replace(/\.?([A-Z]+)/g, (_, y) => "_" + y.toLowerCase()).replace(/^_/, "");
}

function keysToSnakeCase(obj: unknown): ValueTypes {
  if (typeof obj !== "object" || obj === null) {
    return obj as ValueTypes;
  }

  if (Array.isArray(obj)) {
    return obj.map(keysToSnakeCase);
  }

  const recordObj = obj as Record<string, unknown>;

  return Object.keys(recordObj).reduce(
    (result, key) => {
      result[toSnakeCase(key)] = keysToSnakeCase(recordObj[key]);
      return result;
    },
    {} as Record<string, ValueTypes>,
  );
}
