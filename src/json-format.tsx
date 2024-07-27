import { Action, ActionPanel, Detail, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";

export default function () {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(true);
  const [formated, setFormated] = useState(false);

  useEffect(() => {
    formatAsync()
      .then((h) => {
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
      markdown={(formated && "```json\n" + JSON.stringify(data, null, "\t")) || `## ${data}`}
      actions={
        !loading &&
        formated && (
          <ActionPanel>
            <Action.CopyToClipboard content={JSON.stringify(data, null, "\t")} title="Copy Formated Json" />
            <Action.CopyToClipboard content={JSON.stringify(data, null, 0)} title="Copy Json" />
          </ActionPanel>
        )
      }
    />
  );
}

async function formatAsync(): Promise<string> {
  const json: string = await getSelectedText();
  return new Promise((resolve, reject) => {
    try {
      resolve(JSON.parse(json));
    } catch (error) {
      reject(error);
    }
  });
}
