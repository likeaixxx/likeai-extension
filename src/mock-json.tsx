import { Action, ActionPanel, Detail, getSelectedText } from "@raycast/api";
import { useEffect, useState } from "react";

/**
 * Converts a Java class definition string to a mock JSON object with type and comment information
 * @param javaClassString - The Java class definition as a string
 * @returns A formatted JSON string representing the class fields
 */
function javaClassToMockJson(javaClassString: string): string {
  try {
    // Extract the main class name and body
    const classMatch = javaClassString.match(
      /(?:public|private|protected)?\s+(?:final\s+)?class\s+(\w+)(?:<[^>]+>)?(?:\s+extends\s+[\w<>.]+)?(?:\s+implements\s+[\w<>.,\s]+)?\s*\{([\s\S]*)/,
    );

    if (!classMatch) {
      return JSON.stringify({ error: "No class definition found" });
    }

    const className = classMatch[1];
    const classBody = classMatch[2];

    // Extract fields directly from the class body
    const fields = extractClassFields(classBody);

    // Format the result
    const result = {};

    for (const field of fields) {
      // Remove modifiers from type
      const cleanType = field.type.replace(/(?:private|public|protected|final|static)\s+/g, "");
      result[field.name] = cleanType + (field.comment ? `, ${field.comment}` : "");
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error("Error in javaClassToMockJson:", error);
    return JSON.stringify({ error: "Failed to parse Java class" }, null, 2);
  }
}

/**
 * Extracts class fields from the class body, ignoring method local variables
 * @param classBody - The class body string
 * @returns Array of field objects with name, type, and comment
 */
function extractClassFields(classBody: string): Array<{ name: string; type: string; comment: string }> {
  const fields: Array<{ name: string; type: string; comment: string }> = [];

  // Track brace levels to identify method bodies
  let braceLevel = 1; // Start at 1 because we're already inside the class braces
  let inMethod = false;
  let currentPos = 0;

  // First pass: mark method boundaries
  const methodBoundaries: Array<{ start: number; end: number }> = [];
  const methodRegex =
    /(?:public|private|protected)?\s+(?:static\s+)?(?:final\s+)?(?:<[^>]+>\s+)?[\w<>[\],\s.]+\s+\w+\s*\([^)]*\)\s*(?:throws\s+[\w,\s.]+)?\s*\{/g;

  let methodMatch;
  while ((methodMatch = methodRegex.exec(classBody)) !== null) {
    const methodStart = methodMatch.index;

    // Find the matching closing brace for this method
    let openBraces = 1;
    let closeBraces = 0;
    let pos = methodStart + methodMatch[0].length;

    while (pos < classBody.length && openBraces > closeBraces) {
      if (classBody[pos] === "{") openBraces++;
      if (classBody[pos] === "}") closeBraces++;
      pos++;
    }

    if (openBraces === closeBraces) {
      methodBoundaries.push({
        start: methodStart,
        end: pos,
      });
    }
  }

  // Second pass: extract fields, skipping method bodies
  const fieldRegex =
    /(?:\/\*\*([\s\S]*?)\*\/\s*)?(?:@\w+(?:\([^)]*\))?\s*)*(?:private|public|protected)?\s+(?:final\s+)?(?:static\s+)?([\w<>[\],\s.]+)\s+(\w+)(?:\s*=\s*[^;]+)?;/g;

  let fieldMatch;
  while ((fieldMatch = fieldRegex.exec(classBody)) !== null) {
    const matchPos = fieldMatch.index;

    // Check if this match is inside any method
    const isInMethod = methodBoundaries.some((boundary) => matchPos > boundary.start && matchPos < boundary.end);

    if (!isInMethod) {
      const comment = fieldMatch[1]
        ? fieldMatch[1]
            .split("\n")
            .map((line) =>
              line
                .trim()
                .replace(/^\*\s*/, "")
                .trim(),
            )
            .filter((line) => line && !line.startsWith("@"))
            .join(" ")
            .trim()
        : "";

      const type = fieldMatch[2].trim();
      const name = fieldMatch[3].trim();

      fields.push({
        name,
        type,
        comment,
      });
    }
  }

  return fields;
}

/**
 * Main function to process a Java class string
 * @param input - Java class string
 * @returns JSON string representation
 */
function processJavaClass(input: string): string {
  try {
    if (!input || !input.includes("class")) {
      return JSON.stringify({ error: "Input does not appear to be a valid Java class" });
    }

    return javaClassToMockJson(input);
  } catch (error) {
    console.error("Error processing Java class:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return JSON.stringify(
      {
        error: "Failed to process Java class",
        message: errorMessage,
      },
      null,
      2,
    );
  }
}

async function model2Json(): Promise<string> {
  const classMata = await getSelectedText();
  return new Promise((resolve, reject) => {
    try {
      resolve(processJavaClass(classMata));
    } catch (error) {
      reject(error);
    }
  });
}

export default function () {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(true);
  const [formated, setFormated] = useState(false);

  useEffect(() => {
    model2Json()
      .then((h: string) => {
        console.log(h);
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
      markdown={(formated && "```json\n" + data) || `## ${data}`}
      actions={
        !loading &&
        formated && (
          <ActionPanel>
            <Action.CopyToClipboard content={data} title="Copy" />
          </ActionPanel>
        )
      }
    />
  );
}
