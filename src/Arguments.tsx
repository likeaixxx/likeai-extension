import * as changeCase from 'change-case';

export interface EasydictArguments {
  queryText?: string;
  sub?: string
  ext?: string
  r18?:boolean
}


export function toTitleCase(input: string): string {
  input = changeCase.camelCase(input)
  return input.charAt(0).toUpperCase() + input.slice(1);
}