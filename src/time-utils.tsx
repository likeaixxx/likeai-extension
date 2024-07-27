import { Action, ActionPanel, getSelectedText, Icon, LaunchProps, List } from "@raycast/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";

// 引入 utc 插件
dayjs.extend(utc);

// 时间字符串转 -- utc 时区时间戳
function dateToTimestamp(dateString: string) {
  const [year, month, day, hours, minutes, seconds] = dateString.split(/[- :]/);
  return new Date(
    Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds)),
  ).getTime();
}

function timestampToDate(timestamp: number, timezoneOffset: string) {
  const offset = parseInt(timezoneOffset);
  const offsetHrs = Math.abs(Math.floor(offset));
  const offsetMins = Math.abs((offset - offsetHrs) * 60);

  const localTime = new Date(timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const localTimeParts = localTime.split(", ");
  const dateParts = localTimeParts[0].split("/");
  const timeParts = localTimeParts[1].split(":");

  const shiftedTime = new Date(
    Date.UTC(
      parseInt(dateParts[2]),
      parseInt(dateParts[0]) - 1,
      parseInt(dateParts[1]),
      parseInt(timeParts[0]) + offsetHrs,
      parseInt(timeParts[1]) + offsetMins,
      parseInt(timeParts[2]),
    ),
  );

  const shiftedDate = `${shiftedTime.getUTCFullYear()}-${String(shiftedTime.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(shiftedTime.getUTCDate()).padStart(2, "0")}`;
  const shiftedTimeStr = `${String(shiftedTime.getUTCHours()).padStart(2, "0")}:${String(
    shiftedTime.getUTCMinutes(),
  ).padStart(2, "0")}:${String(shiftedTime.getUTCSeconds()).padStart(2, "0")}`;

  // let offsetSte = `GMT${offsetSign}${String(offsetHrs).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`

  return `${shiftedDate} ${shiftedTimeStr} `;
}

function Parse(props: { time: string }) {
  if (props.time === "now") {
    return utcTime();
  }
  try {
    const regex = /^\d{10,}$/; // 时间戳正则表达式
    if (regex.test(props.time)) {
      return convertTimestamp(Number(props.time));
    } else {
      const date = new Date(props.time);
      if (date.toString() === "Invalid Date") {
        return Exp(`${props.time} is not a valid date or timestamp`);
      } else {
        return convert(props.time);
      }
    }
  } catch (error) {
    return Exp(`${props.time} is not a valid date or timestamp`);
  }
}

function Exp(title: string): JSX.Element {
  return (
    <List.Item
      title={title}
      key={title}
      icon={Icon.Circle}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={title} title="Copy to Clipboard" />
        </ActionPanel>
      }
    ></List.Item>
  );
}

function convert(time: string): JSX.Element[] {
  return convertTimestamp(dateToTimestamp(time));
}

function convertTimestamp(time: number): JSX.Element[] {
  console.log(`timestamp ${time} `);

  // 转换成时间戳
  let utc = timestampToDate(time, "+0");
  let uto8 = timestampToDate(time, "+8");
  let uto7 = timestampToDate(time, "+7");
  let uto6 = timestampToDate(time, "+6");
  let uto5 = timestampToDate(time, "+5");
  let uto4 = timestampToDate(time, "+4");
  let uto3 = timestampToDate(time, "+3");
  let uto2 = timestampToDate(time, "+2");
  let uto1 = timestampToDate(time, "+1");
  let res = [LinklistItem({ title: "timestamp", link: String(time) })];
  res.push(LinklistItem({ title: "UTC", link: utc }));
  res.push(LinklistItem({ title: "+8", link: uto8 }));
  res.push(LinklistItem({ title: "+7", link: uto7 }));
  res.push(LinklistItem({ title: "+6", link: uto6 }));
  res.push(LinklistItem({ title: "+5", link: uto5 }));
  res.push(LinklistItem({ title: "+4", link: uto4 }));
  res.push(LinklistItem({ title: "+3", link: uto3 }));
  res.push(LinklistItem({ title: "+2", link: uto2 }));
  res.push(LinklistItem({ title: "+1", link: uto1 }));
  return res;
}

function LinklistItem(props: { title: string; link: string }): JSX.Element {
  return (
    <List.Item
      title={props.title}
      subtitle={props.link}
      key={props.title}
      icon={Icon.Circle}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy to Clipboard" content={props.link} />{" "}
        </ActionPanel>
      }
    />
  );
}

function utcTime(): JSX.Element[] {
  // 获取当前的 UTC 时间
  const formattedDate = dayjs().utc().format("YYYY-MM-DD HH:mm:ss");
  return convertTimestamp(dateToTimestamp(formattedDate));
}

interface EasydictArguments {
  queryText?: string;
}

export default function (props: LaunchProps<{ arguments: EasydictArguments }>) {
  const [text, setText] = useState(props.arguments.queryText || "");

  useEffect(() => {
    async function loadSelectedText() {
      if (!props.arguments.queryText) {
        setText(await getSelectedText());
      }
    }
    loadSelectedText();
  }, [props.arguments.queryText]);

  function onInputChange(text: string) {
    console.log(`update input!! ${text}`);
    setText(text);
  }

  return (
    <List searchText={text} onSearchTextChange={onInputChange} searchBarPlaceholder={"convert time text..."}>
      <Parse time={text.trim()}></Parse>
    </List>
  );
}
