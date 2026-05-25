import { GeminiSchema } from "../types/gemini";
import { SummaryResult, TMeeting } from "../types";
import { fetchGeminiGenerateContent } from "../utils/fetchGeminiGenerateContent";
import { generateSummaryPrompt } from "../utils/generateSummaryPrompt";

const SUMMARY_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    keyPoints: { type: "ARRAY", items: { type: "STRING" } },
    commonConcerns: { type: "ARRAY", items: { type: "STRING" } },
    issues: { type: "ARRAY", items: { type: "STRING" } },
    implicitIssues: { type: "ARRAY", items: { type: "STRING" } },
    followUps: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["keyPoints", "commonConcerns", "issues", "implicitIssues", "followUps"],
};

export async function generateSummary(meeting: TMeeting): Promise<SummaryResult> {
  const prompt = generateSummaryPrompt(meeting);
  const raw = await fetchGeminiGenerateContent(prompt, { responseSchema: SUMMARY_SCHEMA });
  return JSON.parse(raw) as SummaryResult;
}
