import "../styles/support-chat.css";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { ArrowLeft, Check, CheckCheck, FileText, Headphones, Paperclip, Search, SendHorizontal, X } from "lucide-react";
import { assetsApi } from "../features/assets/api/assetsApi";
import { assetPurposes, assetTypes, assetVisibilities } from "../features/assets/api/assetsTypes";
import { adminSupportApi, studentSupportApi } from "../features/support/api/supportApi";
import type { SupportConversation, SupportConversationSummary, SupportMessage } from "../features/support/api/supportTypes";
import { formatApiError } from "../lib/api/httpClient";

const CHAT_POLL_MS = 8000;
const LIST_POLL_MS = 10000;
const BADGE_POLL_MS = 30000;
const SUPPORT_READ_EVENT = "joviq:support-read";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const STUDENT_QUICK_TOPICS = ["Payment issue", "Course access", "Certificate", "Project review"];

type Viewer = "student" | "admin";

/** Runs `callback` now and then every `ms` while the tab is visible. */
function usePolling(callback: () => void | Promise<void>, ms: number, enabled = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") void callbackRef.current();
    };
    void callbackRef.current();
    const timer = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms, enabled]);
}

/** Unread support messages for the sidebar / navbar badge. */
export function useSupportUnread(role: "Student" | "Admin" | null) {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    if (!role) return;
    try {
      const response = role === "Admin" ? await adminSupportApi.getUnread() : await studentSupportApi.getUnread();
      setCount(response.data.unreadCount);
    } catch {
      // The badge is a hint; a failed poll should never surface an error.
    }
  }, [role]);

  usePolling(load, BADGE_POLL_MS, Boolean(role));
  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener(SUPPORT_READ_EVENT, refresh);
    return () => window.removeEventListener(SUPPORT_READ_EVENT, refresh);
  }, [load]);

  return count;
}

function announceRead() {
  window.dispatchEvent(new Event(SUPPORT_READ_EVENT));
}

async function uploadAttachment(file: File) {
  const isImage = IMAGE_TYPES.includes(file.type);
  const response = await assetsApi.uploadFile(file, {
    type: isImage ? assetTypes.image : assetTypes.document,
    purpose: assetPurposes.supportAttachment,
    visibility: assetVisibilities.private,
  });
  return response.data.id;
}

function validateAttachment(file: File) {
  if (IMAGE_TYPES.includes(file.type)) {
    return file.size > MAX_IMAGE_BYTES ? "Images must be 10 MB or smaller." : "";
  }
  if (DOCUMENT_TYPES.includes(file.type)) {
    return file.size > MAX_DOCUMENT_BYTES ? "Documents must be 50 MB or smaller." : "";
  }
  return "Attach a JPG, PNG, WEBP image, or a PDF / Word document.";
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function formatListTime(value: string) {
  const day = formatDay(value);
  return day === "Today" ? formatTime(value) : day;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function SupportAttachment({ message }: { message: SupportMessage }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const isImage = IMAGE_TYPES.includes(message.attachmentContentType ?? "");
  const assetId = message.attachmentAssetId;

  useEffect(() => {
    if (!isImage || !assetId) return;
    let active = true;
    assetsApi.getAccessUrl(assetId)
      .then((response) => { if (active) setUrl(response.data.url); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [assetId, isImage]);

  async function openFile() {
    if (!assetId) return;
    // Signed URLs expire, so fetch a fresh one on every click.
    const opened = window.open("", "_blank");
    try {
      const response = await assetsApi.getAccessUrl(assetId);
      if (opened) opened.location.href = response.data.url;
    } catch {
      opened?.close();
      setFailed(true);
    }
  }

  if (isImage && url && !failed) {
    return (
      <button className="support-chat__image" type="button" onClick={() => void openFile()} aria-label={`Open ${message.attachmentName ?? "image"}`}>
        <img src={url} alt={message.attachmentName ?? "Attached image"} loading="lazy" />
      </button>
    );
  }

  return (
    <button className="support-chat__file" type="button" onClick={() => void openFile()}>
      <FileText size={18} />
      <span>{failed ? "File unavailable" : message.attachmentName ?? "Attachment"}</span>
    </button>
  );
}

function ChatThread({ messages, viewer, emptyText }: { messages: SupportMessage[]; viewer: Viewer; emptyText: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lastMessageId]);

  if (!messages.length) {
    return <div className="support-chat__thread support-chat__thread--empty"><p>{emptyText}</p></div>;
  }

  return (
    <div className="support-chat__thread" ref={scrollRef} aria-live="polite">
      {messages.map((message, index) => {
        const mine = viewer === "student" ? message.fromStudent : !message.fromStudent;
        const day = formatDay(message.sentAt);
        const showDay = index === 0 || formatDay(messages[index - 1].sentAt) !== day;
        const showSender = viewer === "admin" && !message.fromStudent &&
          (index === 0 || messages[index - 1].fromStudent || messages[index - 1].senderName !== message.senderName);
        return (
          <Fragment key={message.id}>
            {showDay ? <div className="support-chat__day"><span>{day}</span></div> : null}
            <div className={`support-chat__bubble ${mine ? "is-mine" : "is-theirs"}`}>
              {showSender ? <small className="support-chat__sender">{message.senderName}</small> : null}
              {message.attachmentAssetId ? <SupportAttachment message={message} /> : null}
              {message.body ? <p>{message.body}</p> : null}
              <span className="support-chat__meta">
                {formatTime(message.sentAt)}
                {mine ? (
                  message.readAt
                    ? <CheckCheck className="is-read" size={15} aria-label="Seen" />
                    : <Check size={15} aria-label="Sent" />
                ) : null}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function ChatComposer({ onSend, disabled, draft, onDraftChange }: {
  onSend: (body: string, file: File | null) => Promise<boolean>;
  disabled?: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 140)}px`;
  }, [draft]);

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!picked) return;
    const problem = validateAttachment(picked);
    setError(problem);
    setFile(problem ? null : picked);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (sending || disabled || (!draft.trim() && !file)) return;
    setSending(true);
    setError("");
    const sent = await onSend(draft.trim(), file);
    if (sent) {
      onDraftChange("");
      setFile(null);
    }
    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <form className="support-chat__composer" onSubmit={submit}>
      {file || error ? (
        <div className="support-chat__composer-extra">
          {file ? (
            <span className="support-chat__chip">
              <Paperclip size={14} /> {file.name}
              <button type="button" aria-label="Remove attachment" onClick={() => setFile(null)}><X size={14} /></button>
            </span>
          ) : null}
          {error ? <span className="support-chat__error" role="alert">{error}</span> : null}
        </div>
      ) : null}
      <div className="support-chat__composer-row">
        <button
          className="support-chat__icon-button"
          type="button"
          aria-label="Attach a photo or document"
          title="Attach a photo or document"
          disabled={disabled || sending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={19} />
        </button>
        <input ref={fileInputRef} type="file" hidden accept={[...IMAGE_TYPES, ...DOCUMENT_TYPES].join(",")} onChange={pickFile} />
        <textarea
          ref={textareaRef}
          rows={1}
          maxLength={2000}
          placeholder="Type a message"
          aria-label="Message"
          value={draft}
          disabled={disabled}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="support-chat__send"
          type="submit"
          aria-label="Send message"
          disabled={disabled || sending || (!draft.trim() && !file)}
        >
          <SendHorizontal size={19} />
        </button>
      </div>
    </form>
  );
}

export function StudentSupportChat({ preview = false }: { preview?: boolean }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(!preview);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await studentSupportApi.getMessages();
      setMessages(response.data);
      setError("");
      announceRead();
    } catch (loadError) {
      setError(formatApiError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(load, CHAT_POLL_MS, !preview);

  async function send(body: string, file: File | null) {
    if (preview) {
      setError("Messaging is disabled in student preview.");
      return false;
    }
    try {
      const attachmentAssetId = file ? await uploadAttachment(file) : undefined;
      const response = await studentSupportApi.sendMessage({ body, attachmentAssetId });
      setMessages((current) => [...current, response.data]);
      setError("");
      return true;
    } catch (sendError) {
      setError(formatApiError(sendError));
      return false;
    }
  }

  return (
    <section className="support-chat support-chat--student" aria-label="Support chat">
      <header className="support-chat__header">
        <span className="support-chat__avatar support-chat__avatar--team"><Headphones size={20} /></span>
        <div>
          <h1>Joviq Support</h1>
          <p>Ask us anything about payments, course access, projects or certificates. We usually reply within a few hours.</p>
        </div>
      </header>
      {error ? <p className="support-chat__banner" role="alert">{error}</p> : null}
      {loading ? (
        <div className="support-chat__thread support-chat__thread--empty" role="status"><p>Loading your chat…</p></div>
      ) : messages.length ? (
        <ChatThread messages={messages} viewer="student" emptyText="" />
      ) : (
        <div className="support-chat__thread support-chat__thread--empty">
          <p>👋 Hi! How can we help you today?</p>
          <div className="support-chat__topics">
            {STUDENT_QUICK_TOPICS.map((topic) => (
              <button key={topic} type="button" onClick={() => setDraft(`${topic}: `)}>{topic}</button>
            ))}
          </div>
        </div>
      )}
      <ChatComposer onSend={send} disabled={loading} draft={draft} onDraftChange={setDraft} />
    </section>
  );
}

export function AdminSupportInbox() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [conversations, setConversations] = useState<SupportConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadList = useCallback(async () => {
    try {
      const response = await adminSupportApi.getConversations(debouncedSearch);
      setConversations(response.data);
    } catch (loadError) {
      setError(formatApiError(loadError));
    } finally {
      setListLoading(false);
    }
  }, [debouncedSearch]);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const loadConversation = useCallback(async () => {
    if (!selectedId) return;
    try {
      const response = await adminSupportApi.getConversation(selectedId);
      // Ignore a late response for a chat the admin already left.
      if (selectedIdRef.current !== selectedId) return;
      setConversation(response.data);
      setConversations((current) => current.map((item) => (item.studentId === selectedId ? { ...item, unreadCount: 0 } : item)));
      announceRead();
    } catch (loadError) {
      setError(formatApiError(loadError));
    }
  }, [selectedId]);

  usePolling(loadList, LIST_POLL_MS);
  usePolling(loadConversation, CHAT_POLL_MS, Boolean(selectedId));

  function openConversation(studentId: string) {
    if (studentId === selectedId) return;
    setConversation(null);
    setError("");
    setSelectedId(studentId);
  }

  async function send(body: string, file: File | null) {
    if (!selectedId) return false;
    try {
      const attachmentAssetId = file ? await uploadAttachment(file) : undefined;
      const response = await adminSupportApi.sendMessage(selectedId, { body, attachmentAssetId });
      setConversation((current) => (current?.studentId === response.data.studentId
        ? { ...current, messages: [...current.messages, response.data] }
        : current));
      void loadList();
      return true;
    } catch (sendError) {
      setError(formatApiError(sendError));
      return false;
    }
  }

  const selectedSummary = conversations.find((item) => item.studentId === selectedId);
  const headerName = conversation?.studentName ?? selectedSummary?.studentName ?? "";

  return (
    <section className={`support-inbox ${selectedId ? "has-selection" : ""}`} aria-label="Support chat inbox">
      <aside className="support-inbox__list">
        <header>
          <h2>Support Chat</h2>
          <label className="support-inbox__search">
            <Search size={16} />
            <input type="search" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </header>
        <div className="support-inbox__items">
          {listLoading ? <p className="support-inbox__empty" role="status">Loading chats…</p> : null}
          {!listLoading && !conversations.length ? (
            <p className="support-inbox__empty">{debouncedSearch ? "No chats match your search." : "No student messages yet."}</p>
          ) : null}
          {conversations.map((item) => (
            <button
              key={item.studentId}
              type="button"
              className={`support-inbox__item ${item.studentId === selectedId ? "is-active" : ""} ${item.unreadCount ? "is-unread" : ""}`}
              onClick={() => openConversation(item.studentId)}
            >
              <span className="support-chat__avatar">{initials(item.studentName)}</span>
              <span className="support-inbox__item-text">
                <span className="support-inbox__item-top">
                  <strong>{item.studentName}</strong>
                  <time dateTime={item.lastMessageAt}>{formatListTime(item.lastMessageAt)}</time>
                </span>
                <span className="support-inbox__item-bottom">
                  <span>{item.lastMessageFromStudent ? "" : "You: "}{item.lastMessage}</span>
                  {item.unreadCount ? <b aria-label={`${item.unreadCount} unread`}>{item.unreadCount}</b> : null}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="support-inbox__chat">
        {selectedId ? (
          <section className="support-chat support-chat--admin">
            <header className="support-chat__header">
              <button className="support-chat__icon-button support-inbox__back" type="button" aria-label="Back to chats" onClick={() => { setSelectedId(null); setConversation(null); }}>
                <ArrowLeft size={19} />
              </button>
              <span className="support-chat__avatar">{initials(headerName)}</span>
              <div>
                <h1>{headerName || "Loading…"}</h1>
                {conversation ? (
                  <p>
                    {[conversation.studentEmail, conversation.studentPhone ? `+91 ${conversation.studentPhone}` : "", conversation.programs.join(", ") || "Not enrolled yet"]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
            </header>
            {error ? <p className="support-chat__banner" role="alert">{error}</p> : null}
            {conversation ? (
              <ChatThread messages={conversation.messages} viewer="admin" emptyText="No messages yet. Say hello!" />
            ) : (
              <div className="support-chat__thread support-chat__thread--empty" role="status"><p>Loading chat…</p></div>
            )}
            <ChatComposer
              onSend={send}
              disabled={!conversation}
              draft={drafts[selectedId] ?? ""}
              onDraftChange={(value) => setDrafts((current) => ({ ...current, [selectedId]: value }))}
            />
          </section>
        ) : (
          <div className="support-inbox__placeholder">
            <Headphones size={40} />
            <h2>Select a chat</h2>
            <p>Pick a student on the left to read and reply to their messages.</p>
            {error ? <p className="support-chat__banner" role="alert">{error}</p> : null}
          </div>
        )}
      </div>
    </section>
  );
}
