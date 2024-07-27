import { Action, ActionPanel, Detail, LaunchProps, getSelectedText } from "@raycast/api";
import { camelCase } from "change-case";
import { useEffect, useState } from "react";
import { EasydictArguments } from "./Arguments";

export default function (props: LaunchProps<{ arguments: EasydictArguments }>) {
  const className: string = props.arguments.queryText || "";
  const [data, setData] = useState(["", ""]),
    [loading, setLoading] = useState(true),
    [formated, setFormated] = useState(false);

  useEffect(() => {
    convert(className)
      .then((h) => {
        setData(h);
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
      markdown={
        (formated &&
          "#### Define Property\n```java\n" + data[0] + " ```" + "\n#### Mock Class\n```java\n" + data[1] + "") ||
        `## ${data}`
      }
      actions={
        !loading &&
        formated && (
          <ActionPanel>
            <Action.CopyToClipboard content={data[0]} title="Copy Define Property" />
            <Action.CopyToClipboard content={data[1]} title="Copy Define Class" />
          </ActionPanel>
        )
      }
    />
  );
}

async function convert(className: string): Promise<string[]> {
  let selected = await getSelectedText();

  return new Promise((resolve, reject) => {
    try {
      let de = javaClassDefinition(JSON.parse(selected), className);
      de = [de[0], "/**\n* @author likeai\n*/\n" + de[1]];
      resolve(de);
    } catch (err) {
      reject(err);
    }
  });
}

function javaClassDefinition(json: {}, className = "Mock", isStatic = false): string[] {
  let classDefinition = `@Getter\n@Setter\npublic ${isStatic ? "static " : ""}class ${className || "Mock"} {\n`;

  let properties = generateJavaClassDefinition(json);

  classDefinition += properties + "}\n";

  return [properties, classDefinition];
}

function generateJavaClassDefinition(json: any): string {
  let properties = "";
  let l = [];
  let o = [];

  for (let key in json) {
    if (json.hasOwnProperty(key)) {
      let dataType = typeof json[key];
      let javaType = "";

      switch (dataType) {
        case "boolean":
          javaType = "Boolean";
          break;
        case "number":
          javaType = Number.isInteger(json[key]) ? "Integer" : "Double";
          break;
        case "string":
          javaType = "String";
          break;
        case "object":
          if (Array.isArray(json[key])) {
            let p = key.charAt(0).toUpperCase() + key.slice(1);
            javaType = `List<${p}>`; // Assuming JSON array representation as List
            l.push(key);
          } else {
            javaType = key.charAt(0).toUpperCase() + key.slice(1) + ""; // Recursive call for inner classes
            o.push(key);
          }
          break;
      }
      properties += `private ${javaType} ${camelCase(key)};\n`;
    }
  }

  for (let i = 0; i < l.length; i++) {
    // 检查是否存在至少一个对象
    if (Array.isArray(json[l[i]]) && json[l[i]].length > 0) {
      let key = l[i].charAt(0).toUpperCase() + l[i].slice(1);
      let inner = `${javaClassDefinition(json[l[i]][0], key, true)[1]}`;
      properties += inner;
    }
  }

  for (let i = 0; i < o.length; i++) {
    let key = o[i].charAt(0).toUpperCase() + o[i].slice(1);
    let inner = `${javaClassDefinition(json[o[i]], key, true)[1]}`;
    properties += inner;
  }
  return properties;
}
