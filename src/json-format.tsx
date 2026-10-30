import { Action, ActionPanel, Clipboard, closeMainWindow, Detail, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";

export default function () {
  const [data, setData] = useState("");
  const [formatedData, setFormatedData] = useState("");
  const [flatData, setFlatData] = useState("");
  const [loading, setLoading] = useState(true);
  const [formated, setFormated] = useState(false);

  useEffect(() => {
    Clipboard.readText()
      .then((json: string | undefined) => {
        if (json === undefined) {
          throw Error()
        }
        const data = JSON.parse(json);
        setData(data);
        setFormatedData(JSON.stringify(data, null, "  "));
        setFlatData(JSON.stringify(data, null, 0));
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
      markdown={(formated && "```json\n" + formatedData) || `## ${data}`}
      actions={
        !loading &&
        formated && (
          <ActionPanel>
            <Action.Paste content={formatedData} />
            <Action.CopyToClipboard content={formatedData} title="Copy Formated JSON" />
            <Action.CopyToClipboard content={flatData} title="Copy JSON" />
          </ActionPanel>
        )
      }
    />
  );
}
