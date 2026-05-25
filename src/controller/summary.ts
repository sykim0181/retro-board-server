import { Request, Response } from "express";
import { db } from "../lib/firebase";
import { generateSummary } from "../services/summary";

export async function handleSummaryRequest(req: Request, res: Response) {
  const { meeting } = req.body;
  const roomId = meeting.id;

  try {
    const doc = await db.collection("room").doc(roomId).get();
    const cached = doc.data()?.summary;
    if (cached) {
      res.json({ summary: cached });
      return;
    }

    const summary = await generateSummary(meeting);
    await db.collection("room").doc(roomId).update({ summary });
    res.json({ summary });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ error: "failed to generate summary" });
  }
}
