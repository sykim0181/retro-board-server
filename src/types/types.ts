export type TColumnType = "start" | "stop" | "continue";
export type TRoomPhase = "REFLECT" | "VOTE" | "DISCUSS" | "END";

export type TUser = {
  id: string;
  name: string;
};

export type TLike = {
  user: TUser;
};

export type TCard = {
  id: string;
  category: TColumnType;
  title: string;
  content: string;
  likes: TLike[];
};

export type TEmoji = {
  unified: string;
  name: string;
};

export type TReaction = {
  emoji: TEmoji;
  users: TUser[];
};

export type TChat = {
  id: string;
  type: "MESSAGE" | "TASK";
};

export type TTopic = {
  card: TCard;
  reactions: Map<string, TReaction>;
  chats: TChat[];
};

export type TMessage = {
  id: string;
  user: TUser;
  content: string;
  createdAt: string;
};

export type TTask = {
  id: string;
  user: TUser;
  content: string;
  createdAt: string;
};

export type TopicDB = {
  card: TCard;
  reactions: TReaction[];
  chats: (TMessage | TTask)[];
};

export type Board = Map<TColumnType, string[]>;

export type RoomState = {
  phase: TRoomPhase;
  board: Board;
  cards: Map<string, TCard>;
  topics: TTopic[];
  messages: Map<string, TMessage>;
  tasks: Map<string, TTask>;
};

export const createInitialRoomState = (): RoomState => ({
  phase: "REFLECT",
  board: new Map([
    ["start", []],
    ["stop", []],
    ["continue", []],
  ]),
  cards: new Map(),
  topics: [],
  messages: new Map(),
  tasks: new Map(),
});
