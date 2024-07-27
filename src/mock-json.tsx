import { Action, ActionPanel, Detail, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";

async function model2Json(): Promise<string> {
  const classDefinition = await getSelectedText();
  return new Promise((resolve, reject) => {
    try {
      const fieldRegex = /\b(private|public|protected)\s+(\S+(\s*<\s*\w+\s*>)?)\s+(\w+)\s*(?:=.*?)?;/g;
      let match: RegExpExecArray | null;
      const fields: Map<string, string> = new Map();
      while ((match = fieldRegex.exec(classDefinition)) !== null) {
        console.log("match + " + match);
        const type = match[match.length - 3];
        const fieldName = match[match.length - 1];
        fields.set(fieldName, type);
      }
      let json = JSON.stringify(Object.fromEntries(fields));
      json = JSON.parse(json);
      resolve(json);
    } catch (error) {
      reject(error);
    }
  });
}

export default function () {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(true);
  const [formated, setFormated] = useState(false);

  useEffect(() => {
    model2Json()
      .then((h: string) => {
        setData(h);
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
      markdown={(formated && "```json\n" + JSON.stringify(data, null, 2)) || `## ${data}`}
      actions={
        !loading &&
        formated && (
          <ActionPanel>
            <Action.CopyToClipboard content={JSON.stringify(data, null, 2)} title="Copy Formated Json" />
            <Action.CopyToClipboard content={JSON.stringify(data, null, 0)} title="Copy Json" />
          </ActionPanel>
        )
      }
    />
  );
}
