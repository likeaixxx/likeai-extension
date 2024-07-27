import { Action, ActionPanel, Detail, LaunchProps } from "@raycast/api";
import { EasydictArguments } from "./Arguments";

export default function (props: LaunchProps<{ arguments: EasydictArguments }>) {
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
