import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Loader2, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import VoiceInput from "./VoiceInput";

type Message = {
  id: number;
  text: string;
  isBot: boolean;
};

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm here to help answer your questions about reproductive healthcare resources in the Midwest region. I can provide information about nearby facilities, services, and legal rights. How can I assist you today?",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          previousMessages: messages.map(m => ({
            role: m.isBot ? "assistant" : "user",
            content: m.text
          }))
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to get AI response");
      }

      const data = await response.json();
      return data.response;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = {
      id: messages.length + 1,
      text: input.trim(),
      isBot: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const response = await chatMutation.mutateAsync(input);
      const botResponse = {
        id: messages.length + 2,
        text: response,
        isBot: true,
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleVoiceInput = (transcription: string) => {
    setInput(transcription);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg h-14 w-14"
        size="icon"
      >
        <MessageSquare className="h-7 w-7" />
      </Button>

      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-[350px] shadow-xl border-pink-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-pink-700">Healthcare Assistant</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-pink-700 hover:text-pink-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea ref={scrollAreaRef} className="h-[400px] pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isBot ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.isBot
                          ? "bg-pink-100 text-gray-800"
                          : "bg-pink-500 text-white"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-pink-100 text-gray-800">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1"
                disabled={chatMutation.isPending}
              />
              <VoiceInput onTranscription={handleVoiceInput} />
              <Button 
                type="submit" 
                disabled={chatMutation.isPending}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}