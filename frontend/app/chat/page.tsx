"use client";

import { useEffect, useState, useRef, useCallback, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ToastContainer } from "@/components/ToastContainer";
import { useToast } from "@/lib/useToast";
import { useUser } from "@/context/UserContext";
import { isAuthenticated, fetchCurrentUser } from "@/services/authService";
import {
  listConversations,
  createConversation,
  updateConversation,
  getConversationMessages,
  sendMessage,
  formatConversationDate,
  formatMessageTime,
} from "@/services/conversationService";
import type { Conversation, Message } from "@/types/conversation";
import ReactMarkdown from "react-markdown";

export default function ChatPage() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const { toasts, showToast, dismissToast } = useToast();

  // Conversations and active thread state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Current active conversation object
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  // UI state
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  // Scenario 1: On initial load / conversation open: automatically scroll to bottom
  // so the latest message is immediately visible
  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeConversationId, loadingMessages, scrollToBottom]);

  // Scenario 2: On new message (user sends a message, or assistant reply arrives)
  const prevMessagesCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesCountRef.current || sending) {
      scrollToBottom(true);
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages.length, sending, scrollToBottom]);

  // Check auth and hydrate user context
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    if (!user) {
      fetchCurrentUser()
        .then(setUser)
        .catch(() => {
          router.push("/login");
        });
    }
  }, [router, user, setUser]);

  // Load previous conversations on mount
  useEffect(() => {
    if (!isAuthenticated()) return;

    let isMounted = true;
    listConversations()
      .then((data) => {
        if (!isMounted) return;
        setConversations(data);
        if (data.length > 0) {
          setActiveConversationId(data[0].id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        showToast(
          err instanceof Error ? err.message : "Failed to load conversations.",
          "error"
        );
      })
      .finally(() => {
        if (isMounted) setLoadingConversations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  // Dynamically fetch previous messages when active conversation changes
  useEffect(() => {
    if (activeConversationId === null) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    getConversationMessages(activeConversationId)
      .then((msgs) => {
        if (!isMounted) return;
        setMessages(msgs);
      })
      .catch((err) => {
        if (!isMounted) return;
        showToast(
          err instanceof Error ? err.message : "Failed to load messages.",
          "error"
        );
      })
      .finally(() => {
        if (isMounted) setLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeConversationId, showToast]);

  // Initiate a new conversation
  const handleNewConversation = async () => {
    try {
      // Create conversation on backend
      const res = await createConversation("New Conversation");
      const newConv: Conversation = {
        id: res.id,
        user_id: user?.id ?? 0,
        title: "New Conversation",
        created_at: new Date().toISOString(),
      };

      // Optimistic update: place at top of list and select it
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(res.id);
      setMessages([]);
      setMobileSidebarOpen(false);
      inputRef.current?.focus();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to create conversation.",
        "error"
      );
    }
  };

  // Submit a new message
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed || sending) return;

    let targetConvId = activeConversationId;

    // If no active conversation exists, initiate one first
    if (targetConvId === null) {
      try {
        const titleCandidate =
          trimmed.length > 30 ? `${trimmed.slice(0, 30)}...` : trimmed;
        const res = await createConversation(titleCandidate);
        const newConv: Conversation = {
          id: res.id,
          user_id: user?.id ?? 0,
          title: titleCandidate,
          created_at: new Date().toISOString(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(res.id);
        targetConvId = res.id;
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to initiate conversation.",
          "error"
        );
        return;
      }
    }

    // Optimistically add user message to the thread
    const optimisticUserMsg: Message = {
      id: Date.now(),
      conversation_id: targetConvId,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInputValue("");
    setSending(true);
    setTimeout(() => scrollToBottom(true), 20);

    // If active conversation still has generic title, update it optimistically and on backend
    const currentConv = conversations.find((c) => c.id === targetConvId);
    if (
      currentConv &&
      (!currentConv.title || currentConv.title === "New Conversation")
    ) {
      const derivedTitle =
        trimmed.length > 30 ? `${trimmed.slice(0, 30)}...` : trimmed;
      // Optimistic title update
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId ? { ...c, title: derivedTitle } : c
        )
      );
      // Background call to rename conversation
      updateConversation(targetConvId, derivedTitle).catch(() => {
        // Silently ignore rename sync error
      });
    }

    try {
      // Backend automatically loads full context, compiles prompt for Bedrock, and returns AI message
      const aiReply = await sendMessage(targetConvId, trimmed);
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Failed to receive response from AI. Please try again.",
        "error"
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#eef2f6]">
      <Navbar variant="solid" />

      {/* Main chat layout container */}
      <main className="flex flex-1 overflow-hidden p-3 md:p-6">
        <div className="mx-auto flex h-full w-full max-w-6xl gap-5">
          {/* ── Left Sidebar (Conversation List) ────────────────────── */}
          <aside
            id="chat-sidebar"
            className={`fixed inset-y-0 left-0 z-40 flex w-80 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform duration-300 md:static md:translate-x-0 ${
              mobileSidebarOpen
                ? "translate-x-0 top-16 bottom-3 left-3 shadow-xl"
                : "-translate-x-full md:translate-x-0"
            }`}
          >
            {/* Header: Blue banner matching screenshot */}
            <div className="flex items-center justify-between rounded-t-2xl bg-[#0067b8] px-5 py-4 text-white shadow-xs">
              <h2 className="text-base font-semibold tracking-wide">
                Conversations
              </h2>
              <button
                id="new-conversation-btn"
                onClick={handleNewConversation}
                title="New Conversation"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-2xl font-light text-white transition-colors hover:bg-white/20 active:scale-95 cursor-pointer"
                aria-label="Start new conversation"
              >
                +
              </button>
            </div>

            {/* Conversation Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#edf2f7]">
              {loadingConversations ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="flex items-center gap-3 p-2 animate-pulse"
                    >
                      <div className="h-9 w-9 rounded-xl bg-slate-200" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                        <div className="h-2.5 w-1/3 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <p className="text-sm">No conversations yet.</p>
                  <button
                    onClick={handleNewConversation}
                    className="mt-3 text-xs font-semibold text-[#0067b8] hover:underline cursor-pointer"
                  >
                    Click + to start one
                  </button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const displayDate = formatConversationDate(conv.created_at);

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#e8f1fa]"
                          : "bg-white hover:bg-slate-50"
                      }`}
                      aria-current={isActive ? "true" : undefined}
                    >
                      {/* Active: rounded square with solid blue speech bubble. Inactive: dashed circle */}
                      {isActive ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#c5e0fa] text-[#0067b8]">
                          <ChatBubbleSolidIcon />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-300">
                          <span className="sr-only">Inactive</span>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            isActive
                              ? "font-semibold text-slate-900"
                              : "font-medium text-slate-800"
                          }`}
                        >
                          {conv.title || "New Conversation"}
                        </p>
                        {displayDate && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {displayDate}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Mobile backdrop */}
          {mobileSidebarOpen && (
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
            />
          )}

          {/* ── Right Panel (Chatbox) ─────────────────────────────────── */}
          <section
            id="chat-main-panel"
            className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            {/* ── Conversation Header Bar (Dynamic Active Title) ──────── */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6 md:py-3.5 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile sidebar toggle button */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="flex items-center justify-center p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
                  aria-label="Open conversations list"
                  title="Conversations"
                >
                  <SidebarToggleIcon />
                </button>

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f1fa] text-[#0067b8]">
                    <ChatBubbleSolidIcon size="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="active-conversation-title"
                      className="truncate text-sm md:text-base font-semibold text-slate-900"
                    >
                      {activeConversation?.title ||
                        (loadingConversations ? "Loading..." : "New Conversation")}
                    </h2>
                    {activeConversation && (
                      <p className="truncate text-xs text-slate-400">
                        {messages.length} {messages.length === 1 ? "message" : "messages"}
                        {activeConversation.created_at && (
                          <span> • Started {formatConversationDate(activeConversation.created_at)}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Action Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="header-new-chat-btn"
                  onClick={handleNewConversation}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-[#e8f1fa] hover:text-[#0067b8] transition-colors cursor-pointer"
                >
                  <span className="text-sm font-bold leading-none">+</span>
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              </div>
            </div>

            {/* Message Thread Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <LoadingSpinner />
                    <span>Loading messages...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f1fa] text-[#0067b8]">
                    <ChatBubbleSolidIcon size="w-7 h-7" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-800">
                    How can I help you plan today?
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    Ask me for multi-day itineraries, flight options, local food
                    suggestions, or packing guidelines.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
                    {[
                      "Plan a family trip to Japan.",
                      "3-day culinary tour in Singapore",
                      "Weekend getaway in Bali",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => {
                          setInputValue(prompt);
                          inputRef.current?.focus();
                        }}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:border-sky-300 hover:bg-[#e8f1fa] hover:text-[#0067b8] transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === "user";

                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* User message: Crisp rectangular blue box with sharp/minimal corners */}
                      {isUser ? (
                        <div className="max-w-[85%] md:max-w-[65%] rounded-xs bg-[#0067b8] px-5 py-3 text-sm md:text-base leading-relaxed text-white shadow-xs">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.created_at && (
                            <div className="mt-1.5 flex justify-end">
                              <span className="text-[11px] font-normal text-white/70">
                                {formatMessageTime(msg.created_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Assistant message: Pill shape with light grayish/blue bg and soft border, rendered with Markdown */
                        <div className="max-w-[90%] md:max-w-[75%] rounded-3xl border border-[#dbe4ee] bg-[#f0f4f8] px-5 py-3 text-sm md:text-base leading-relaxed text-[#1e293b] shadow-xs">
                          <div className="text-sm md:text-base leading-relaxed break-words">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2.5 last:mb-0">{children}</p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-slate-900">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic">{children}</em>
                                ),
                                ul: ({ children }) => (
                                  <ul className="my-2 ml-5 list-disc space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="my-2 ml-5 list-decimal space-y-1">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="leading-relaxed">{children}</li>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="mt-3 mb-1 text-base md:text-lg font-bold text-slate-900">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="mt-2.5 mb-1 text-sm md:text-base font-bold text-slate-900">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="mt-2 mb-0.5 text-sm font-semibold text-slate-900">
                                    {children}
                                  </h3>
                                ),
                                code: ({ children }) => (
                                  <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                                    {children}
                                  </code>
                                ),
                                pre: ({ children }) => (
                                  <pre className="my-2 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-white">
                                    {children}
                                  </pre>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="my-2 border-l-2 border-[#0067b8] pl-3 italic text-slate-600">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {msg.created_at && (
                            <div className="mt-2 flex justify-end">
                              <span className="text-[11px] font-normal text-slate-400">
                                {formatMessageTime(msg.created_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing Indicator: Loading state while waiting for LLM response */}
              {sending && (
                <div
                  className="flex justify-start"
                  role="status"
                  aria-live="polite"
                  aria-label="AI is typing"
                >
                  <div className="flex items-center gap-2 rounded-3xl border border-[#dbe4ee] bg-[#f0f4f8] px-5 py-3 text-sm text-slate-600 shadow-xs">
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#0067b8] animate-bounce" />
                      <span className="inline-block h-2 w-2 rounded-full bg-[#0067b8] animate-bounce [animation-delay:0.2s]" />
                      <span className="inline-block h-2 w-2 rounded-full bg-[#0067b8] animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="ml-1 text-xs font-medium text-slate-500">
                      AI is typing...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Bottom Input Bar ─────────────────────────────────────── */}
            <div className="border-t border-slate-200 bg-white p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-3"
              >
                {/* Pill input container with focus border */}
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id="chat-input-field"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="w-full rounded-full border border-slate-300 bg-[#f8fafc] px-6 py-3 text-sm md:text-base text-slate-800 placeholder:text-slate-400 transition-all focus:border-[#0067b8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0067b8] disabled:opacity-60"
                    aria-label="Type a message to the AI"
                  />
                  {/* Subtle blue bottom accent line */}
                  <div className="absolute inset-x-5 -bottom-0.5 h-[1.5px] bg-[#0067b8]/20 rounded-full pointer-events-none" />
                </div>

                {/* Circular blue Send Button matching screenshot */}
                <button
                  id="chat-send-btn"
                  type="submit"
                  disabled={sending || !inputValue.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0067b8] text-white shadow-sm transition-all hover:bg-[#005a9e] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  aria-label="Send message"
                >
                  <SendAirplaneIcon />
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────

function ChatBubbleSolidIcon({ size = "w-5 h-5" }: { size?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={size}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9s-4.428-9-9.75-9c-5.322 0-9.75 3.97-9.75 9 0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.444 1.223z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SendAirplaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 translate-x-0.5"
      aria-hidden="true"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function SidebarToggleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-[#0067b8]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}
