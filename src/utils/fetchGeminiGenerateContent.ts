export async function fetchGeminiGenerateContent(
  prompt: string,
  instruction?: string
): Promise<string> {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}/:generateContent?key=${process.env.GEMINI_API_KEY}`;

  let body: Record<string, any> = {
    "contents": [
      {
        "parts": [
          {
            "text": prompt,
          },
        ],
      },
    ],
  };

  if (instruction) {
    body = {
      ...body,
      "system_instruction": {
        "parts": [
          {
            "text": instruction,
          },
        ],
      },
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.error) {
    const error = data.error;
    throw new Error(`${error.status}(${error.code}): ${error.message}`);
  }
  return data.candidates[0].content.parts[0].text;
}
