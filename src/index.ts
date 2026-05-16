import dotenv from "dotenv";
import http from "http";
import express from "express";
import cors from "cors";
import summaryRouter from "./routes/summary";
import { attachWebSocketServer } from "./ws/wsServer";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
  })
);
app.use(express.json());

app.use("/api/meeting-summary", summaryRouter);

const server = http.createServer(app);
attachWebSocketServer(server);

const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log(`server running on port ${port}`);
});
