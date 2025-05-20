import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.listen(3001, () => {
  console.log("server running on port 3001");
});
