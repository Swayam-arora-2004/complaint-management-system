import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Paperclip, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  read: boolean;
}

const STORAGE_KEY = "chatbot_messages";
const UNREAD_KEY = "chatbot_unread_count";

// System prompt for the AI chatbot
const SYSTEM_PROMPT = `You are a helpful customer support assistant for a Complaint Management System. 
You help users with:
- Submitting complaints
- Tracking complaint status
- General questions about the system
- Answering any questions they have

Be friendly, concise, and helpful. If asked about complaints, guide them to use the system features. 
For general questions, provide helpful answers.`;

// Get AI response from API (Free APIs prioritized)
const getAIResponse = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
  // Priority 1: Groq API (FREE - No credit card required, very fast)
  // Get free API key from: https://console.groq.com/keys
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (groqApiKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Free, fast model
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...conversationHistory.slice(-10).map(msg => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            { role: "user", content: userMessage },
          ],
          max_tokens: 250,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
      }
    } catch (error) {
      console.error("Groq API error:", error);
    }
  }

  // Priority 2: OpenAI (if you have free credits)
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiApiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...conversationHistory.slice(-10).map(msg => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            { role: "user", content: userMessage },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
    }
  }

  // Priority 3: Hugging Face Inference API (FREE - No API key needed for some models)
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            past_user_inputs: conversationHistory
              .filter(m => m.sender === "user")
              .slice(-3)
              .map(m => m.text),
            generated_responses: conversationHistory
              .filter(m => m.sender === "bot")
              .slice(-3)
              .map(m => m.text),
            text: userMessage,
          },
          options: {
            wait_for_model: true,
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.generated_text) {
        let cleaned = data.generated_text.trim();
        if (cleaned.length > 300) {
          cleaned = cleaned.substring(0, 300) + "...";
        }
        return cleaned;
      }
    }
  } catch (error) {
    console.error("Hugging Face API error:", error);
  }

  // Final fallback: Enhanced keyword-based responses
  return getFallbackResponse(userMessage);
};

// Enhanced fallback response generator
const getFallbackResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  // Complaint-specific responses
  if (lowerMessage.includes("complaint") || lowerMessage.includes("issue") || lowerMessage.includes("problem")) {
    return "I can help you with complaints. You can submit a new complaint or track an existing one. Would you like me to guide you through the process?";
  }
  if (lowerMessage.includes("track") || lowerMessage.includes("status") || lowerMessage.includes("ticket")) {
    return "To track your complaint, please go to the Dashboard page where you can see all your complaints and their current status. You can also search for a specific complaint by ID.";
  }
  if (lowerMessage.includes("submit") || lowerMessage.includes("new") || lowerMessage.includes("create")) {
    return "To submit a new complaint, click on 'Submit Complaint' in the navigation or go to the Submit Complaint page. Fill out the form with details about your issue.";
  }
  
  // Greetings
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! How can I assist you today? I can help with complaints, answer questions, or provide general support.";
  }
  
  // Help
  if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
    return "I'm here to help! I can assist you with submitting complaints, tracking tickets, or answering questions about the complaint management system. What would you like to know?";
  }
  
  // Politeness
  if (lowerMessage.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return "Goodbye! Feel free to reach out if you need any assistance.";
  }
  
  // Enhanced default responses that acknowledge the question
  const defaultResponses = [
    "I understand you're asking about that. While I can help with complaint management questions, for more detailed answers you might want to check our help documentation. What specific aspect would you like to know more about?",
    "That's an interesting question. I'm primarily designed to help with complaint management, but I'll do my best to assist. Can you provide more context?",
    "I see. For complaint-related questions, I can definitely help! For other topics, I'll try my best. What would you like to know?",
    "I'm here to help with complaints, tracking, and support. Could you rephrase your question or provide more details?",
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      } catch {
        return [];
      }
    }
    // Initial welcome message
    return [{
      id: "1",
      text: "Hi! How can I help you today?",
      sender: "bot" as const,
      timestamp: new Date(),
      read: false,
    }];
  });
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Calculate unread count (only bot messages that are unread and chat is closed)
  const unreadCount = messages.filter(
    (msg) => msg.sender === "bot" && !msg.read && !isOpen
  ).length;

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    localStorage.setItem(UNREAD_KEY, unreadCount.toString());
  }, [messages, unreadCount]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (isOpen) {
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, read: true }))
      );
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
      read: true,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setMessage("");
    setIsTyping(true);

    try {
      // Get AI response (will use API if available, otherwise fallback)
      const botResponseText = await getAIResponse(text.trim(), updatedMessages);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: "bot",
        timestamp: new Date(),
        read: isOpen, // Mark as read if chat is open
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error getting bot response:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        read: isOpen,
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const handleSend = () => {
    sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    const initialMessage: Message = {
      id: "1",
      text: "Hi! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
      read: true,
    };
    setMessages([initialMessage]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(UNREAD_KEY);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex flex-col w-[360px] h-[500px] bg-card border border-border rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Help / Chat</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-8 w-8"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      msg.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="px-4 pt-2 border-t border-border">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleQuickReply("How do I submit a complaint?")}
                >
                  Report Issue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleQuickReply("How do I track my complaint?")}
                >
                  Track Ticket
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleQuickReply("I need help with my complaint")}
                >
                  Talk to Agent
                </Button>
              </div>
            </div>
          )}

          {/* Input Row */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                className="flex-1"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleSend}
                disabled={!message.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
};
