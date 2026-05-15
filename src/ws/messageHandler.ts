import { WebSocket } from "ws";
import { db, Timestamp } from "../lib/firebase";
import { RoomState, TReaction, TUser, TopicDB } from "../types/types";
import { ClientToServerMessage } from "../types/messages";
import {
  broadcast,
  getClientMeta,
  getPresentUsers,
  getRoomState,
  joinRoom,
  send,
  serializeRoomState,
} from "./roomManager";

export function handleMessage(ws: WebSocket, raw: string): void {
  let msg: ClientToServerMessage;
  try {
    msg = JSON.parse(raw) as ClientToServerMessage;
  } catch {
    console.error("[WS] Failed to parse message:", raw);
    return;
  }

  switch (msg.type) {
    case "JOIN_ROOM":
      return handleJoinRoom(ws, msg.roomId, msg.user);
    case "ADD_CARD":
      return handleAddCard(ws, msg);
    case "DELETE_CARD":
      return handleDeleteCard(ws, msg);
    case "MOVE_CARD":
      return handleMoveCard(ws, msg);
    case "LIKE_CARD":
      return handleLikeCard(ws, msg);
    case "CANCEL_LIKE_CARD":
      return handleCancelLikeCard(ws, msg);
    case "CHANGE_PHASE":
      return handleChangePhase(ws, msg);
    case "ADD_MESSAGE":
      return handleAddMessage(ws, msg);
    case "ADD_TASK":
      return handleAddTask(ws, msg);
    case "UPDATE_TASK":
      return handleUpdateTask(ws, msg);
    case "ADD_REACTION":
      return handleAddReaction(ws, msg);
    case "REMOVE_REACTION":
      return handleRemoveReaction(ws, msg);
    case "SAVE_MEETING":
      void handleSaveMeeting(ws);
      return;
  }
}

function handleJoinRoom(ws: WebSocket, roomId: string, user: TUser): void {
  joinRoom(ws, roomId, user);
  const state = getRoomState(roomId)!;

  send(ws, { type: "STATE_SYNC", state: serializeRoomState(state) });
  broadcast(roomId, {
    type: "PRESENCE_UPDATED",
    users: getPresentUsers(roomId),
  });
}

type AddCard = Extract<ClientToServerMessage, { type: "ADD_CARD" }>;
function handleAddCard(ws: WebSocket, msg: AddCard): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  state.cards.set(msg.card.id, msg.card);
  const column = state.board.get(msg.column)!;
  column.push(msg.card.id);

  broadcast(meta.roomId, {
    type: "CARD_ADDED",
    card: msg.card,
    column: msg.column,
    boardColumn: [...column],
  });
}

type DeleteCard = Extract<ClientToServerMessage, { type: "DELETE_CARD" }>;
function handleDeleteCard(ws: WebSocket, msg: DeleteCard): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  state.cards.delete(msg.cardId);
  const column = state.board.get(msg.column)!;
  const idx = column.indexOf(msg.cardId);
  if (idx !== -1) column.splice(idx, 1);

  broadcast(meta.roomId, {
    type: "CARD_DELETED",
    cardId: msg.cardId,
    column: msg.column,
    boardColumn: [...column],
  });
}

type MoveCard = Extract<ClientToServerMessage, { type: "MOVE_CARD" }>;
function handleMoveCard(ws: WebSocket, msg: MoveCard): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const { cardId, fromCol, toCol, toIndex } = msg;

  if (fromCol !== toCol) {
    const card = state.cards.get(cardId);
    if (card) card.category = toCol;
  }

  const fromColumn = state.board.get(fromCol)!;
  const fromIdx = fromColumn.indexOf(cardId);
  if (fromIdx !== -1) fromColumn.splice(fromIdx, 1);

  const toColumn = state.board.get(toCol)!;
  toColumn.splice(toIndex, 0, cardId);

  broadcast(meta.roomId, {
    type: "CARD_MOVED",
    fromCol,
    fromBoardColumn: [...fromColumn],
    toCol,
    toBoardColumn: [...toColumn],
  });
}

type LikeCard = Extract<ClientToServerMessage, { type: "LIKE_CARD" }>;
function handleLikeCard(ws: WebSocket, msg: LikeCard): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const card = state.cards.get(msg.cardId);
  if (!card) return;

  card.likes.push({ user: msg.user });

  broadcast(meta.roomId, {
    type: "CARD_LIKED",
    cardId: msg.cardId,
    likes: [...card.likes],
  });
}

type CancelLikeCard = Extract<
  ClientToServerMessage,
  { type: "CANCEL_LIKE_CARD" }
>;
function handleCancelLikeCard(ws: WebSocket, msg: CancelLikeCard): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const card = state.cards.get(msg.cardId);
  if (!card) return;

  card.likes = card.likes.filter((like) => like.user.id !== msg.userId);

  broadcast(meta.roomId, {
    type: "CARD_LIKED",
    cardId: msg.cardId,
    likes: [...card.likes],
  });
}

type ChangePhase = Extract<ClientToServerMessage, { type: "CHANGE_PHASE" }>;
function handleChangePhase(ws: WebSocket, msg: ChangePhase): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const { phase } = msg;
  const curPhase = state.phase;

  switch (phase) {
    case "REFLECT":
    case "VOTE": {
      if (curPhase === "DISCUSS" || curPhase === "END") {
        clearDiscussion(state);
        broadcast(meta.roomId, { type: "DISCUSSION_CLEARED" });
      }
      break;
    }
    case "DISCUSS": {
      initiateDiscussion(state);
      broadcast(meta.roomId, {
        type: "DISCUSSION_INITIATED",
        topics: state.topics.map((t) => ({
          card: t.card,
          reactions: serializeReactions(t.reactions),
          chats: t.chats,
        })),
      });
      break;
    }
    case "END":
      break;
  }

  state.phase = phase;
  broadcast(meta.roomId, { type: "PHASE_CHANGED", phase });
}

function initiateDiscussion(state: RoomState): void {
  state.topics = Array.from(state.cards.values()).map((card) => ({
    card: { ...card },
    reactions: new Map(),
    chats: [],
  }));
}

function clearDiscussion(state: RoomState): void {
  state.topics = [];
  state.tasks = new Map();
  state.messages = new Map();
}

type AddMessage = Extract<ClientToServerMessage, { type: "ADD_MESSAGE" }>;
function handleAddMessage(ws: WebSocket, msg: AddMessage): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const topic = state.topics[msg.topicIndex];
  if (!topic) return;

  state.messages.set(msg.message.id, msg.message);
  topic.chats.push({ id: msg.message.id, type: "MESSAGE" });

  broadcast(meta.roomId, {
    type: "MESSAGE_ADDED",
    topicIndex: msg.topicIndex,
    message: msg.message,
  });
}

type AddTask = Extract<ClientToServerMessage, { type: "ADD_TASK" }>;
function handleAddTask(ws: WebSocket, msg: AddTask): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const topic = state.topics[msg.topicIndex];
  if (!topic) return;

  state.tasks.set(msg.task.id, msg.task);
  topic.chats.push({ id: msg.task.id, type: "TASK" });

  broadcast(meta.roomId, {
    type: "TASK_ADDED",
    topicIndex: msg.topicIndex,
    task: msg.task,
  });
}

type UpdateTask = Extract<ClientToServerMessage, { type: "UPDATE_TASK" }>;
function handleUpdateTask(ws: WebSocket, msg: UpdateTask): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const task = state.tasks.get(msg.taskId);
  if (!task) return;

  task.content = msg.content;

  broadcast(meta.roomId, {
    type: "TASK_UPDATED",
    taskId: msg.taskId,
    content: msg.content,
  });
}

type AddReaction = Extract<ClientToServerMessage, { type: "ADD_REACTION" }>;
function handleAddReaction(ws: WebSocket, msg: AddReaction): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const topic = state.topics[msg.topicIndex];
  if (!topic) return;

  const existing = topic.reactions.get(msg.emoji.unified);
  if (existing) {
    existing.users.push(msg.user);
  } else {
    topic.reactions.set(msg.emoji.unified, {
      emoji: msg.emoji,
      users: [msg.user],
    });
  }

  broadcast(meta.roomId, {
    type: "REACTION_UPDATED",
    topicIndex: msg.topicIndex,
    reactions: serializeReactions(topic.reactions),
  });
}

type RemoveReaction = Extract<
  ClientToServerMessage,
  { type: "REMOVE_REACTION" }
>;
function handleRemoveReaction(ws: WebSocket, msg: RemoveReaction): void {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  const topic = state.topics[msg.topicIndex];
  if (!topic) return;

  const existing = topic.reactions.get(msg.emojiUnified);
  if (!existing) return;

  existing.users = existing.users.filter((u) => u.id !== msg.userId);
  if (existing.users.length === 0) {
    topic.reactions.delete(msg.emojiUnified);
  }

  broadcast(meta.roomId, {
    type: "REACTION_UPDATED",
    topicIndex: msg.topicIndex,
    reactions: serializeReactions(topic.reactions),
  });
}

async function handleSaveMeeting(ws: WebSocket): Promise<void> {
  const meta = getClientMeta(ws);
  if (!meta) return;

  const state = getRoomState(meta.roomId);
  if (!state) return;

  try {
    const topicList: TopicDB[] = state.topics.map((topic) => {
      const chats = topic.chats.map((chat) => {
        if (chat.type === "MESSAGE") return state.messages.get(chat.id)!;
        return state.tasks.get(chat.id)!;
      });
      return {
        card: topic.card,
        reactions: Array.from(topic.reactions.values()),
        chats,
      };
    });

    const taskList = Array.from(state.tasks.values());

    await db.collection("room").doc(meta.roomId).update({
      topics: topicList,
      tasks: taskList,
      date: Timestamp.now(),
    });

    send(ws, { type: "MEETING_SAVED" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    send(ws, { type: "MEETING_SAVE_ERROR", message });
  }
}

function serializeReactions(
  reactions: Map<string, TReaction>,
): Record<string, TReaction> {
  const result: Record<string, TReaction> = {};
  reactions.forEach((r, k) => {
    result[k] = r;
  });
  return result;
}

