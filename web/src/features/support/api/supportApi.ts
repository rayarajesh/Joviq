import { request } from "../../../lib/api/httpClient";
import type {
  SendSupportMessageRequest,
  SupportConversation,
  SupportConversationSummary,
  SupportMessage
} from "./supportTypes";

type UnreadResponse = { unreadCount: number };

export const studentSupportApi = {
  getMessages() {
    return request<SupportMessage[]>("/api/v1/student/support/messages");
  },

  sendMessage(body: SendSupportMessageRequest) {
    return request<SupportMessage>("/api/v1/student/support/messages", { method: "POST", body });
  },

  getUnread() {
    return request<UnreadResponse>("/api/v1/student/support/unread");
  }
};

export const adminSupportApi = {
  getConversations(search = "") {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    return request<SupportConversationSummary[]>(`/api/v1/admin/support/conversations${query}`);
  },

  getConversation(studentId: string) {
    return request<SupportConversation>(`/api/v1/admin/support/conversations/${studentId}`);
  },

  sendMessage(studentId: string, body: SendSupportMessageRequest) {
    return request<SupportMessage>(`/api/v1/admin/support/conversations/${studentId}/messages`, { method: "POST", body });
  },

  getUnread() {
    return request<UnreadResponse>("/api/v1/admin/support/unread");
  }
};
