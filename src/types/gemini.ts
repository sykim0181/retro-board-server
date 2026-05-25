export type GeminiSchemaType =
  | "TYPE_UNSPECIFIED"
  | "STRING"
  | "NUMBER"
  | "INTEGER"
  | "BOOLEAN"
  | "ARRAY"
  | "OBJECT"
  | "NULL";

export type GeminiSchema = {
  type: GeminiSchemaType;
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: string[];
};

export interface FetchGeminiOptions {
  instruction?: string;
  responseSchema?: GeminiSchema;
}
