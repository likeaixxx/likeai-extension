import { Action, ActionPanel, Detail, LaunchProps } from "@raycast/api";
import { Args } from "./Args";

export default function (props: LaunchProps<{ arguments: Args }>) {
  const t1 = decodeURIComponent(props.arguments.queryText || "");
  const t2 = decodeURIComponent(props.arguments.sub || "");
  const navidation = decodeURIComponent(props.arguments.navidation || "View");

  return (
    <Detail
      markdown={`## ${t1}\n #### ${t2 || ""}`}
      navigationTitle={`${navidation}`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={t1 || ""} title="Copy Query Text" />
          <Action.CopyToClipboard content={t2 || ""} title="Copy Sub Text" />
        </ActionPanel>
      }
    />
  );
}
