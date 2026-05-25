import { FetchGeminiOptions } from "../types/gemini";

export async function fetchGeminiGenerateContent(
  prompt: string,
  options?: FetchGeminiOptions,
): Promise<string> {
  const model = "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (options?.instruction) {
    body.system_instruction = { parts: [{ text: options.instruction }] };
  }

  if (options?.responseSchema) {
    body.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: options.responseSchema,
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.error) {
    const error = data.error;
    throw new Error(`${error.status}(${error.code}): ${error.message}`);
  }

  return data.candidates[0].content.parts[0].text;
}
