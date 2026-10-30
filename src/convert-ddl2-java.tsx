import { Action, ActionPanel, Clipboard, Detail, closeMainWindow, showHUD } from "@raycast/api";
import * as changeCase from "change-case";
import { useEffect, useState } from "react";
import { Parser } from "sql-ddl-to-json-schema";
import { toTitleCase } from "./change-case";
import { JSONSchema7 } from "json-schema";
const parser = new Parser("mysql");

export default function () {
  const [isLoading, setIsLoading] = useState(true);
  const [model, setModel] = useState("");

  useEffect(() => {
    main()
      .then((model: string) => {
        setModel(model);
        setIsLoading(false);
      })
      .catch(async (error) => {
        console.error("❗Failed!", error.message);
        await showHUD(`❗Failed! Try select valid DDL.`);
        await closeMainWindow();
      });
  }, []);

  return (
    <Detail
      markdown={"```java\n" + model}
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy" content={model} />
          <Action.Push title="Show Model Info" target={<Detail markdown={"```java\n" + model}></Detail>}></Action.Push>
        </ActionPanel>
      }
    />
  );
}

async function main(): Promise<string> {
  const selectedText = await Clipboard.readText() || "";
  console.log(selectedText);
  if (selectedText == "") {
    new Promise((reject) => {
      reject("Try Select DDL.");
    });
  }
  return new Promise((resolve, reject) => {
    try {
      resolve(read(parser.feed(selectedText).toJsonSchemaArray()[0]));
    } catch (error) {
      reject(error);
    }
  });
}

function read(schema: JSONSchema7): string {
  // console.log(json)
  console.log(schema);
  let code = `/**\n*${schema.description}\n*@author likeai\n**/\npublic class ${toTitleCase(schema.title || "")}{\n`;
  const map = new Map();
  for (const [k, v] of Object.entries(schema.definitions || "")) {
    map.set(k, v);
  }

  Array.from(map.entries()).forEach((p) => {
    code += readProperty(p[0], p[1]);
  });
  code += "}";
  return code;
}

function readProperty(property: string, option: string) {
  const map = new Map();
  for (const [k, v] of Object.entries(option)) {
    map.set(k, v);
  }
  const description = map.get("description");
  const type = map.get("type");
  const maximum = map.get("maximum");
  const format = map.get("format");
  const toDefault = map.get("default");

  let code = "";
  if (description !== undefined) {
    // 注释
    code += `   /**\n   *${description}\n   */\n`;
  }
  return code + `   private ${mapType(type, maximum, format, toDefault)} ${changeCase.camelCase(property)};\n`;
}

function mapType(type: string, maximum: number, format: string, toDefault: string) {
  if (toDefault === "CURRENT_TIMESTAMP" || format === "date-time") {
    return dataTypeMap["DATETIME"];
  }
  if (format === "date") {
    return dataTypeMap["DATE"];
  }
  if (format === "time") {
    return dataTypeMap["TIME"];
  }
  if (type === "integer") {
    if (maximum > 1208925819614629174706176n) {
      return dataTypeMap["BIGINT"];
    }
    return dataTypeMap["INT"];
  }
  if (type === "string") {
    return dataTypeMap["VARCHAR"];
  }
  if (type === "number") {
    return dataTypeMap["DECIMAL"];
  }
  return dataTypeMap["VARCHAR"];
}

const dataTypeMap: { [key: string]: string } = {
  VARCHAR: "String",
  TINYINT: "Integer",
  SMALLINT: "Integer",
  MEDIUMINT: "Integer",
  INT: "Integer",
  BIGINT: "Long",
  FLOAT: "Float",
  DOUBLE: "Double",
  DECIMAL: "BigDecimal",
  DATE: "LocalDate",
  TIME: "LocalTime",
  TIMESTAMP: "Instant",
  DATETIME: "Instant",
};
