import { Action, ActionPanel, Detail, Icon, List, getSelectedText } from "@raycast/api";
import * as changeCase from "change-case";
import { useEffect, useState } from "react";
import { Parser } from "sql-ddl-to-json-schema";
import { toTitleCase } from "./Arguments";
const parser = new Parser("mysql");

export default function () {
  const [schema, setSchema] = useState("");
  const [model, setModel] = useState("");

  useEffect(() => {
    async function loadSelectedText() {
      let selectedText = "";
      try {
        selectedText = await getSelectedText();
      } catch (error) {}
      console.log(selectedText);
      if (selectedText == "") {
        setSchema("# Must Select DDL Context");
        setModel("# Must Select DDL Context");
      } else {
        const schema = main(selectedText);
        setSchema(schema);
        setModel(read(schema));
      }
    }
    loadSelectedText();
  }, []);

  return (
    <List isShowingDetail={true}>
      <List.Item
        title={"model info"}
        icon={Icon.Circle}
        key={"model"}
        detail={<List.Item.Detail markdown={"```java\n" + model}></List.Item.Detail>}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy" content={model} />
            <Action.Push
              title="Show Model Info"
              target={<Detail markdown={"```java\n" + model}></Detail>}
            ></Action.Push>
          </ActionPanel>
        }
      />
      <List.Item
        title={"json schema info"}
        icon={Icon.Circle}
        key={"ddl"}
        detail={<List.Item.Detail markdown={"```json\n" + schema}></List.Item.Detail>}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy" content={schema} />
          </ActionPanel>
        }
      />
    </List>
  );
}

function main(ddl: string): string {
  // 解析DDL字符串
  const ast = parser.feed(ddl).toJsonSchemaArray();

  // 输出实体类的字符串
  return JSON.stringify(ast, null, "\t");
}

function read(json: string): string {
  console.log(json);
  const schema = JSON.parse(json)[0];
  console.log(schema);
  let code = `/**\n*${schema.description}\n*@author likeai\n**/\npublic class ${toTitleCase(schema.title)}{\n`;
  const map = new Map();
  for (const [k, v] of Object.entries(schema.definitions)) {
    map.set(k, v);
  }

  Array.from(map.entries()).forEach((p) => {
    code += readProperty(p[0], p[1]);
  });
  code += "}";
  return code;
}

function readProperty(property: string, option: any) {
  console.log(property, option);

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
    code += `/**\n*${description}\n*/\n`;
  }
  return code + `private ${mapType(type, maximum, format, toDefault)} ${changeCase.camelCase(property)};\n`;
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
  console.log(type);
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
