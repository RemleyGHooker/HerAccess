import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
}

export default function VoiceInput({ onTranscription }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!recognitionRef.current) {
        throw new Error("Speech recognition not supported in this browser");
      }

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Transcribed text:", transcript);
        onTranscription(transcript);
        setIsRecording(false);
        toast({
          title: "Success",
          description: "Your message was transcribed successfully.",
        });
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Recognition error:', event.error);
        toast({
          title: "Error",
          description: "Failed to transcribe speech. Please try again and speak clearly.",
          variant: "destructive",
        });
        setIsRecording(false);
      };

      recognitionRef.current.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone. Click the button again to stop.",
      });

    } catch (error) {
      console.error('Error accessing speech recognition:', error);
      toast({
        title: "Microphone Error",
        description: error instanceof Error ? error.message : "Could not access speech recognition. Please check your browser settings.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={isRecording ? stopRecording : startRecording}
      className={`relative ${isRecording ? "bg-red-100 hover:bg-red-200" : ""} ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <Square className="h-4 w-4 text-red-500" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {isRecording && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </Button>
  );
}

// Add TypeScript support for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}