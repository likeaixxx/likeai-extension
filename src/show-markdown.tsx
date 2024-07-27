import { Action, ActionPanel, Detail, LaunchProps } from "@raycast/api";
import { EasydictArguments } from "./Arguments";

export default function (props: LaunchProps<{ arguments: EasydictArguments }>) {
  return (
    <Detail
      markdown={`## ${props.arguments.queryText}\n #### ${props.arguments.sub || ""}`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={props.arguments.queryText || ""} title="Copy Query Text" />
          <Action.CopyToClipboard content={props.arguments.sub || ""} title="Copy Sub Text" />
        </ActionPanel>
      }
    />
  );
}
