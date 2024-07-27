import { ActionPanel, Action, Detail, LaunchProps, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";

export default function () {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(true);
  const [formated, setFormated] = useState(false);

  useEffect(() => {
    getSelectedText()
      .then((h) => {
        setData(JSON.stringify(keysToSnakeCase(JSON.parse(h)), null, "\t"));
        setLoading(false);
        setFormated(true);
      })
      .catch((error) => {
        setData(error.stack);
        setLoading(false);
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
            <Action.CopyToClipboard content={data} title="Copy Formated Json" />
          </ActionPanel>
        )
      }
    />
  );
}

type ValueTypes = string | number | boolean | undefined | Record<string, unknown> | Array<unknown>;

interface RecursiveObject extends Record<string, ValueTypes> {}

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

  return Object.keys(recordObj).reduce((result: any, key: any) => {
    result[toSnakeCase(key)] = keysToSnakeCase(recordObj[key]);
    return result;
  }, {} as RecursiveObject);
}
