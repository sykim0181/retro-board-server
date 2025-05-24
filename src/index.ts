import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import summaryRouter from "./routes/summary";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
  })
);
app.use(express.json());

app.use("/api/meeting-summary", summaryRouter);

app.listen(3001, () => {
  console.log("server running on port 3001");
});
