import { Action, ActionPanel, getSelectedText, Icon, LaunchProps, List } from "@raycast/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";

// 引入 utc 插件
dayjs.extend(utc);

// 时间字符串转 -- utc 时区时间戳
function dateToTimestamp(dateString: string): number {
  // 分割日期和时间
  const [datePart, timePart] = dateString.split(" ");
  const [year, month, day] = datePart.split("-");
  const [time, fraction] = timePart.split(".");

  const [hours, minutes, seconds] = time.split(":");

  // 创建基础时间戳（秒级）
  const baseTimestamp = Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds),
  );

  // 处理毫秒及更精确的部分
  let fractionInMilliseconds = 0;
  if (fraction) {
    // 将小数部分转换为毫秒
    fractionInMilliseconds = parseFloat(`0.${fraction}`) * 1000;
  }

  // 合并基础时间戳和毫秒部分
  return baseTimestamp + fractionInMilliseconds;
}

function timestampToDate(timestamp: number, timezoneOffset: string) {
  const offset = parseInt(timezoneOffset);
  const offsetHrs = Math.abs(Math.floor(offset));
  const offsetMins = Math.abs((offset - offsetHrs) * 60);

  // 创建 Date 对象，保留毫秒
  const date = new Date(timestamp);

  // 格式化年月日时分秒
  const formattedDate = date.toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // 获取毫秒
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");
  const [datePart, timePart] = formattedDate.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hours, minutes, seconds] = timePart.split(":");

  // 应用时区偏移
  const shiftedTime = new Date(
    Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours) + offsetHrs,
      parseInt(minutes) + offsetMins,
      parseInt(seconds),
      parseInt(milliseconds),
    ),
  );

  // 格式化最终结果
  return `${shiftedTime.getUTCFullYear()}-${String(shiftedTime.getUTCMonth() + 1).padStart(2, "0")}-${String(shiftedTime.getUTCDate()).padStart(2, "0")} ${String(shiftedTime.getUTCHours()).padStart(2, "0")}:${String(shiftedTime.getUTCMinutes()).padStart(2, "0")}:${String(shiftedTime.getUTCSeconds()).padStart(2, "0")}.${milliseconds}`;
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
  const utc = timestampToDate(time, "+0");
  const uto8 = timestampToDate(time, "+8");
  const uto7 = timestampToDate(time, "+7");
  const uto6 = timestampToDate(time, "+6");
  const uto5 = timestampToDate(time, "+5");
  const uto4 = timestampToDate(time, "+4");
  const uto3 = timestampToDate(time, "+3");
  const uto2 = timestampToDate(time, "+2");
  const uto1 = timestampToDate(time, "+1");
  const res = [LinklistItem({ title: "timestamp", link: String(time) })];
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
