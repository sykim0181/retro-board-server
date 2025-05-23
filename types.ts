type TUser = {
  id: string;
  name: string;
};

type TLike = {
  user: TUser;
};

type TColumnType = "start" | "stop" | "continue";

type TCard = {
  id: string;
  category: TColumnType;
  title: string;
  content: string;
  likes: TLike[];
};

type TEmoji = {
  unified: string;
  name: string;
};

type TReaction = {
  emoji: TEmoji;
  users: TUser[];
};

type TMessage = {
  id: string;
  user: TUser;
  content: string;
  createdAt: string;
};

type TopicDB = {
  card: TCard;
  reactions: Array<TReaction>;
  chats: Array<TMessage | TTask>;
};

type TTask = {
  id: string;
  user: TUser;
  content: string;
  createdAt: string;
};

type MeetingDB = {
  topics: TopicDB[];
  tasks: TTask[];
};

type TRoom = {
  name: string;
  id: string;
  ownerId: string;
  date: Date;
};

export type TMeeting = TRoom & MeetingDB;