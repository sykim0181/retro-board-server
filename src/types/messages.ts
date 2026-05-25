import {
  TCard,
  TColumnType,
  TEmoji,
  TLike,
  TMessage,
  TReaction,
  TRoomPhase,
  TTask,
  TTopic,
  TUser,
} from ".";

// Client → Server
export type ClientToServerMessage =
  | { type: "JOIN_ROOM"; roomId: string; user: TUser }
  | { type: "ADD_CARD"; card: TCard; column: TColumnType }
  | { type: "DELETE_CARD"; cardId: string; column: TColumnType }
  | { type: "MOVE_CARD"; cardId: string; fromCol: TColumnType; toCol: TColumnType; toIndex: number }
  | { type: "LIKE_CARD"; cardId: string; user: TUser }
  | { type: "CANCEL_LIKE_CARD"; cardId: string; userId: string }
  | { type: "CHANGE_PHASE"; phase: TRoomPhase }
  | { type: "ADD_MESSAGE"; topicIndex: number; message: TMessage }
  | { type: "ADD_TASK"; topicIndex: number; task: TTask }
  | { type: "UPDATE_TASK"; taskId: string; content: string }
  | { type: "ADD_REACTION"; topicIndex: number; emoji: TEmoji; user: TUser }
  | { type: "REMOVE_REACTION"; topicIndex: number; emojiUnified: string; userId: string }
  | { type: "SAVE_MEETING" };

// Server → Client
export type RoomStateJSON = {
  phase: TRoomPhase;
  board: Record<TColumnType, string[]>;
  cards: Record<string, TCard>;
  topics: TopicJSON[];
  messages: Record<string, TMessage>;
  tasks: Record<string, TTask>;
};

export type TopicJSON = {
  card: TCard;
  reactions: Record<string, TReaction>;
  chats: TTopic["chats"];
};

export type ServerToClientMessage =
  | { type: "STATE_SYNC"; state: RoomStateJSON }
  | { type: "PRESENCE_UPDATED"; users: TUser[] }
  | { type: "CARD_ADDED"; card: TCard; column: TColumnType; boardColumn: string[] }
  | { type: "CARD_DELETED"; cardId: string; column: TColumnType; boardColumn: string[] }
  | { type: "CARD_MOVED"; fromCol: TColumnType; fromBoardColumn: string[]; toCol: TColumnType; toBoardColumn: string[] }
  | { type: "CARD_LIKED"; cardId: string; likes: TLike[] }
  | { type: "PHASE_CHANGED"; phase: TRoomPhase }
  | { type: "DISCUSSION_INITIATED"; topics: TopicJSON[] }
  | { type: "DISCUSSION_CLEARED" }
  | { type: "MESSAGE_ADDED"; topicIndex: number; message: TMessage }
  | { type: "TASK_ADDED"; topicIndex: number; task: TTask }
  | { type: "TASK_UPDATED"; taskId: string; content: string }
  | { type: "REACTION_UPDATED"; topicIndex: number; reactions: Record<string, TReaction> }
  | { type: "MEETING_SAVED" }
  | { type: "MEETING_SAVE_ERROR"; message: string };
