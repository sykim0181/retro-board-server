import { WebSocket } from "ws";
import {
  RoomState,
  TCard,
  TMessage,
  TReaction,
  TTask,
  TUser,
  createInitialRoomState,
} from "../types";
import {
  RoomStateJSON,
  ServerToClientMessage,
  TopicJSON,
} from "../types/messages";

const rooms = new Map<string, RoomState>();
const roomClients = new Map<string, Set<WebSocket>>();
const clientMeta = new Map<WebSocket, { roomId: string; user: TUser }>();

export function getOrCreateRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, createInitialRoomState());
    roomClients.set(roomId, new Set());
  }
  return rooms.get(roomId)!;
}

export function getRoomState(roomId: string): RoomState | undefined {
  return rooms.get(roomId);
}

export function joinRoom(ws: WebSocket, roomId: string, user: TUser): void {
  getOrCreateRoom(roomId);
  clientMeta.set(ws, { roomId, user });
  roomClients.get(roomId)!.add(ws);
}

export function leaveRoom(ws: WebSocket): void {
  const meta = clientMeta.get(ws);
  if (!meta) return;

  const { roomId } = meta;
  clientMeta.delete(ws);
  roomClients.get(roomId)?.delete(ws);
}

export function getClientMeta(ws: WebSocket) {
  return clientMeta.get(ws);
}

export function getPresentUsers(roomId: string): TUser[] {
  const clients = roomClients.get(roomId);
  if (!clients) return [];

  const users: TUser[] = [];
  clients.forEach((ws) => {
    const meta = clientMeta.get(ws);
    if (meta) users.push(meta.user);
  });
  return users;
}

export function send(ws: WebSocket, msg: ServerToClientMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

export function broadcast(
  roomId: string,
  msg: ServerToClientMessage,
  exclude?: WebSocket,
): void {
  roomClients.get(roomId)?.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  });
}

export function serializeRoomState(state: RoomState): RoomStateJSON {
  const board: Record<string, string[]> = {};
  state.board.forEach((cardIds, col) => {
    board[col] = cardIds;
  });

  const cards: Record<string, TCard> = {};
  state.cards.forEach((card, id) => {
    cards[id] = card;
  });

  const topics: TopicJSON[] = state.topics.map((topic) => {
    const reactions: Record<string, TReaction> = {};
    topic.reactions.forEach((reaction, key) => {
      reactions[key] = reaction;
    });
    return { card: topic.card, reactions, chats: topic.chats };
  });

  const messages: Record<string, TMessage> = {};
  state.messages.forEach((msg, id) => {
    messages[id] = msg;
  });

  const tasks: Record<string, TTask> = {};
  state.tasks.forEach((task, id) => {
    tasks[id] = task;
  });

  return {
    phase: state.phase,
    board: board as RoomStateJSON["board"],
    cards,
    topics,
    messages,
    tasks,
  };
}
