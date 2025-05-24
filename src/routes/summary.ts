import { Router } from "express";
import { handleSummaryRequest } from "../controller/summary";

const router = Router();

router.post("/", handleSummaryRequest);

export default router;
