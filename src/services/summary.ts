import { TMeeting } from "../types";
import { fetchGeminiGenerateContent } from "../utils/fetchGeminiGenerateContent";
import { generateSummaryPrompt } from "../utils/generateSummaryPrompt";

export async function generateSummary(meeting: TMeeting): Promise<string> {
  const prompt = generateSummaryPrompt(meeting);
  const data = await fetchGeminiGenerateContent(prompt);
  return data;
}
