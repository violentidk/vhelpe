"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function MentorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!draft.trim()) return;
    const userMessage = draft.trim();
    setDraft("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const response = await fetch("/api/mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });
    const data = await response.json();
    setLoading(false);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer ?? data.error ?? "No answer." },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Mentor Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-border p-3">
          {!messages.length && (
            <p className="text-sm text-muted-foreground">
              Ask for help improving your thesis sections, argumentation, or competency evidence.
            </p>
          )}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-lg p-2 text-sm ${
                message.role === "user"
                  ? "bg-primary/15 text-card-foreground"
                  : "bg-muted text-card-foreground"
              }`}
            >
              <span className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">
                {message.role}
              </span>
              {message.content}
            </div>
          ))}
        </div>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="How can I improve my technical implementation chapter?"
        />
        <Button onClick={sendMessage} disabled={loading || !draft.trim()}>
          <Send className="h-4 w-4" />
          {loading ? "Thinking..." : "Send"}
        </Button>
      </CardContent>
    </Card>
  );
}
