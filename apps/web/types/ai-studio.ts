export interface AiGeneratedFile {
  id: string;
  type: "dockerfile" | "compose";
  content: string;
  createdAt: string;
}

export interface MockFile {
  path: string;
  content: string;
  lastModified: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
