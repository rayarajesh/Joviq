export type SupportMessage = {
  id: string;
  studentId: string;
  fromStudent: boolean;
  senderName: string;
  body: string;
  attachmentAssetId?: string | null;
  attachmentName?: string | null;
  attachmentContentType?: string | null;
  sentAt: string;
  readAt?: string | null;
};

export type SupportConversationSummary = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  lastMessage: string;
  lastMessageFromStudent: boolean;
  lastMessageAt: string;
  unreadCount: number;
};

export type SupportConversation = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  programs: string[];
  messages: SupportMessage[];
};

export type SendSupportMessageRequest = {
  body?: string;
  attachmentAssetId?: string;
};
