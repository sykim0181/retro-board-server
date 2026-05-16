import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import { handleMessage } from "./messageHandler";
import { leaveRoom, getClientMeta, broadcast, getPresentUsers } from "./roomManager";

export function attachWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data) => {
      handleMessage(ws, data.toString());
    });

    ws.on("close", () => {
      const meta = getClientMeta(ws);
      if (!meta) return;

      const { roomId } = meta;
      leaveRoom(ws);
      broadcast(roomId, { type: "PRESENCE_UPDATED", users: getPresentUsers(roomId) });
    });

    ws.on("error", (err) => {
      console.error("[WS] Connection error:", err.message);
    });
  });
}
