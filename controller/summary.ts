import { Request, Response } from "express";
import { generateSummary } from "../services/summary";

export async function handleSummaryRequest(req: Request, res: Response) {
  const { meeting } = req.body;

  try {
    const summary = await generateSummary(meeting);
    res.json({ summary });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ error: "failed to generate summary" });
  }
}
