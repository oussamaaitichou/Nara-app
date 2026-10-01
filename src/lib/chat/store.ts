import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, Conversation } from "./types";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type ChatState = {
  conversations: Conversation[];
  activeId: string | null;
  ensureActive: () => string;
  newConversation: () => string;
  setActive: (id: string) => void;
  appendMessage: (conversationId: string, message: Omit<ChatMessage, "id" | "createdAt"> & { id?: string }) => string;
  patchMessage: (conversationId: string, messageId: string, patch: Partial<ChatMessage>) => void;
  renameIfUntitled: (conversationId: string, title: string) => void;
  deleteConversation: (id: string) => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      ensureActive: () => {
        const current = get().activeId;
        if (current && get().conversations.some((c) => c.id === current)) return current;
        return get().newConversation();
      },
      newConversation: () => {
        const id = uid();
        const conv: Conversation = {
          id,
          title: "Nueva consulta",
          messages: [],
          updatedAt: Date.now(),
        };
        set((s) => ({ conversations: [conv, ...s.conversations], activeId: id }));
        return id;
      },
      setActive: (id) => set({ activeId: id }),
      appendMessage: (conversationId, message) => {
        const id = message.id ?? uid();
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  title:
                    c.title === "Nueva consulta" && message.role === "user"
                      ? message.content.slice(0, 72)
                      : c.title,
                  messages: [
                    ...c.messages,
                    {
                      id,
                      createdAt: Date.now(),
                      role: message.role,
                      content: message.content,
                      followUps: message.followUps,
                      escalate: message.escalate,
                    },
                  ],
                }
              : c,
          ),
        }));
        return id;
      },
      patchMessage: (conversationId, messageId, patch) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
                }
              : c,
          ),
        }));
      },
      renameIfUntitled: (conversationId, title) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId && (c.title === "Nueva consulta" || !c.title)
              ? { ...c, title: title.slice(0, 72) }
              : c,
          ),
        }));
      },
      deleteConversation: (id) => {
        set((s) => {
          const next = s.conversations.filter((c) => c.id !== id);
          const activeId = s.activeId === id ? (next[0]?.id ?? null) : s.activeId;
          return { conversations: next, activeId };
        });
      },
    }),
    {
      name: "nara-consultas-v1",
      skipHydration: true,
      partialize: (state) => ({
        conversations: state.conversations,
        activeId: state.activeId,
      }),
    },
  ),
);

export function selectActive(state: ChatState) {
  return state.conversations.find((c) => c.id === state.activeId) ?? null;
}
