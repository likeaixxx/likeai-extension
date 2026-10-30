import { Action, ActionPanel, Detail, LaunchProps } from "@raycast/api";
import { Args } from "./Args";

export default function (props: LaunchProps<{ arguments: Args }>) {
  const { queryText, sub, ext } = props.arguments;
  return (
    <Detail
      markdown={`![${queryText}](${sub})\n\n\n[page](${ext})`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={props.arguments.sub || ""} title="Copy URL" />
        </ActionPanel>
      }
    />
  );
}
