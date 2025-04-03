import { Action, ActionPanel, Detail, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";

export default function () {
  const [data, setData] = useState("");
  const [formatedData, setFormatedData] = useState("");
  const [flatData, setFlatData] = useState("");
  const [loading, setLoading] = useState(true);
  const [formated, setFormated] = useState(false);

  useEffect(() => {
    getSelectedText()
      .then((json) => {
        const data = JSON.parse(json);
        setData(data);
        setFormatedData(JSON.stringify(data, null, "  "));
        setFlatData(JSON.stringify(data, null, 0));
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
      markdown={(formated && "```json\n" + formatedData) || `## ${data}`}
      actions={
        !loading &&
        formated && (
          <ActionPanel>
            <Action.Paste content={formatedData} />
            <Action.CopyToClipboard content={formatedData} title="Copy Formated Json" />
            <Action.CopyToClipboard content={flatData} title="Copy Json" />
          </ActionPanel>
        )
      }
    />
  );
}
