export type ChatRole = "user" | "assistant";

export type EscalateTo = "colegio" | "aemps" | "medico" | "inspeccion" | "titular" | null;

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  followUps?: string[];
  escalate?: EscalateTo;
  createdAt: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

export type TopicId =
  | "recetas"
  | "genericos"
  | "estupefacientes"
  | "seguridad"
  | "servicios"
  | "inspeccion"
  | "guardias"
  | "facturacion";

export type Topic = {
  id: TopicId;
  title: string;
  blurb: string;
  starters: string[];
};
