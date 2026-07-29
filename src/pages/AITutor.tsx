import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect, useRef } from "react";
import { Send, Bot, Plus, MessageSquare, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTutorConversations, useTutorMessages, useCreateConversation, useSendMessage, useDeleteTutorConversation } from "@/hooks/use-api";
import { gsap, useGSAP } from "@/lib/gsap-setup";

const modes = ["Explain Mode", "Quiz Mode", "Doubt Mode", "Rapid Revision", "Interview Mode"];

const AITutor = () => {
  const [selectedMode, setSelectedMode] = useState("Explain Mode");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const { data: convosData, isLoading: convosLoading } = useTutorConversations();
  const { data: messagesData, isLoading: messagesLoading } = useTutorMessages(activeConversationId);
  const createMutation = useCreateConversation();
  const sendMutation = useSendMessage();
  const deleteMutation = useDeleteTutorConversation();

  const conversations = convosData?.conversations || [];
  const messages = messagesData?.messages || [];

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesLoading]);

  // Entrance animations for empty mode selector
  useGSAP(() => {
    if (activeConversationId) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    gsap.set(".tutor-icon", { autoAlpha: 0, scale: 0.7, y: 15 });
    gsap.set(".tutor-title", { autoAlpha: 0, y: 15 });
    gsap.set(".tutor-desc", { autoAlpha: 0, y: 15 });
    gsap.set(".tutor-modes", { autoAlpha: 0, y: 20 });

    tl.to(".tutor-icon", { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" })
      .to(".tutor-title", { autoAlpha: 1, y: 0, duration: 0.4 }, "<0.15")
      .to(".tutor-desc", { autoAlpha: 1, y: 0, duration: 0.4 }, "<0.1")
      .to(".tutor-modes", { autoAlpha: 1, y: 0, duration: 0.5 }, "<0.15");
  }, { scope: pageRef, dependencies: [activeConversationId] });

  const handleSend = () => {
    if (!input.trim() || !activeConversationId) return;

    sendMutation.mutate({ conversationId: activeConversationId, content: input });
    setInput("");
  };

  return (
    <AppLayout>
      <div ref={pageRef} className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar (Conversations) */}
        <div className="w-64 border-r border-border bg-background/50 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-border">
            <button
              onClick={() => setActiveConversationId(null)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {convosLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-4 text-xs text-muted-foreground">No conversations yet</div>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => setActiveConversationId(convo.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors cursor-pointer ${activeConversationId === convo.id
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    } group flex items-center justify-between gap-2`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <MessageSquare className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{convo.title || `Chat ${convo.id}`}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this conversation?")) {
                        deleteMutation.mutate(convo.id, {
                          onSuccess: () => {
                            if (activeConversationId === convo.id) setActiveConversationId(null);
                          }
                        });
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative w-full">
          {!activeConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="tutor-icon w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h1 className="tutor-title text-2xl font-bold font-ndot mb-2">AI Tutor</h1>
              <p className="tutor-desc text-muted-foreground mb-8 max-w-md">
                Select a mode to start learning. I can explain concepts, quiz you, or help revise topics.
              </p>

              <div className="tutor-modes flex flex-wrap justify-center gap-3 max-w-2xl">
                {modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSelectedMode(mode);
                      createMutation.mutate({ mode, title: `${mode} Session` }, {
                        onSuccess: (data) => setActiveConversationId(data.conversation.id)
                      });
                    }}
                    className="human-button px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
                  >
                    {createMutation.isPending && selectedMode === mode ? <Loader2 className="w-4 h-4 animate-spin" /> : mode}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <div>
                    <h2 className="font-bold text-sm">
                      {conversations.find(c => c.id === activeConversationId)?.title || "Chat"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {conversations.find(c => c.id === activeConversationId)?.mode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4 scroll-smooth">
                {messagesLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm mt-10">Start the conversation...</div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] md:max-w-xl p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "glass rounded-bl-none prose prose-sm prose-invert max-w-none"
                          }`}
                      >
                        {msg.role === "user" ? (
                          msg.content
                        ) : (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {sendMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="glass p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-background">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={sendMutation.isPending}
                    placeholder="Type your message..."
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sendMutation.isPending}
                    className="bg-primary text-primary-foreground p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AITutor;
