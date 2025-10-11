import { Server, Socket } from "socket.io";
import { verifyToken } from "../services/authService";
import { generateVoiceAIResponse } from "../services/voiceService";
import { saveChatMessage } from "../services/chatService";

interface AuthenticatedSocket extends Socket {
  user?: {
    user_id: string;
    username: string;
    role: string;
  };
  conversationHistory?: Array<{ role: string; content: string }>;
  currentLanguage?: string;
}

/**
 * Setup voice call Socket.IO handlers
 */
export const setupVoiceHandlers = (io: Server): void => {
  // Voice namespace for real-time voice calls
  const voiceNamespace = io.of("/voice");

  voiceNamespace.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyToken(token);
      socket.user = decoded;
      socket.conversationHistory = [];
      socket.currentLanguage = "en"; // デフォルトは英語
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  voiceNamespace.on("connection", (socket: AuthenticatedSocket) => {
    console.log(
      `Voice call connected: ${socket.id}, User: ${socket.user?.user_id}`
    );

    // Join user's voice room
    if (socket.user?.user_id) {
      socket.join(`voice:${socket.user.user_id}`);
    }

    // Handle voice call start
    socket.on(
      "voice-call-start",
      (data: { conversation_id?: string; language?: string }) => {
        console.log(
          `Voice call started by user ${socket.user?.user_id}, Language: ${data.language}`
        );

        // 言語情報を保存
        if (data.language) {
          socket.currentLanguage = data.language;
        }

        // Reset conversation history for new call
        socket.conversationHistory = [];

        socket.emit("voice-call-ready", {
          message: "Voice call ready. Start speaking!",
          conversation_id: data.conversation_id,
          language: socket.currentLanguage,
        });
      }
    );

    // Handle voice transcript (speech-to-text result)
    socket.on(
      "voice-transcript",
      async (data: {
        transcript: string;
        conversation_id?: string;
        isFinal: boolean;
        language?: string;
      }) => {
        try {
          if (!socket.user?.user_id) {
            socket.emit("voice-error", { message: "Authentication required" });
            return;
          }

          const { transcript, conversation_id, isFinal } = data;

          // 言語情報を更新（提供されている場合）
          if (data.language) {
            socket.currentLanguage = data.language;
          }

          console.log(
            `Voice transcript from ${socket.user.user_id}: "${transcript}" (${socket.currentLanguage}, final: ${isFinal})`
          );

          // Only process final transcripts
          if (!isFinal || !transcript.trim()) {
            return;
          }

          // Echo back the user's transcript
          socket.emit("voice-user-transcript", {
            transcript: transcript,
            timestamp: new Date(),
            language: socket.currentLanguage,
          });

          // Add to conversation history
          if (!socket.conversationHistory) {
            socket.conversationHistory = [];
          }
          socket.conversationHistory.push({
            role: "user",
            content: transcript,
          });

          // Save user message to database
          const userMessage = await saveChatMessage(
            transcript,
            "user",
            socket.user.user_id,
            conversation_id
          );

          // Generate AI response with language parameter
          const aiResponse = await generateVoiceAIResponse(
            transcript,
            socket.conversationHistory,
            socket.currentLanguage || "en"
          );

          // Add AI response to conversation history
          socket.conversationHistory.push({
            role: "assistant",
            content: aiResponse,
          });

          // Keep only last 10 messages in history
          if (socket.conversationHistory.length > 10) {
            socket.conversationHistory = socket.conversationHistory.slice(-10);
          }

          // Save AI message to database
          const aiMessage = await saveChatMessage(
            aiResponse,
            "ai",
            socket.user.user_id,
            conversation_id || userMessage.conversation_id
          );

          // Send AI response back to client
          socket.emit("voice-ai-response", {
            response: aiResponse,
            conversation_id: userMessage.conversation_id,
            message_id: aiMessage.id,
            timestamp: new Date(),
            language: socket.currentLanguage,
          });

          console.log(
            `AI response sent to ${socket.user.user_id} (${socket.currentLanguage}): "${aiResponse}"`
          );
        } catch (error: any) {
          console.error("Error processing voice transcript:", error);
          socket.emit("voice-error", {
            message: error.message || "Failed to process voice input",
          });
        }
      }
    );

    // Handle voice call end
    socket.on("voice-call-end", () => {
      console.log(`Voice call ended by user ${socket.user?.user_id}`);

      // Clear conversation history
      socket.conversationHistory = [];

      socket.emit("voice-call-ended", {
        message: "Voice call ended successfully",
      });
    });

    // Handle interruption (user starts speaking while AI is talking)
    socket.on("voice-interrupt", () => {
      console.log(`Voice interrupted by user ${socket.user?.user_id}`);
      socket.emit("voice-interrupt-acknowledged");
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Voice call disconnected: ${socket.id}`);
      if (socket.user?.user_id) {
        socket.leave(`voice:${socket.user.user_id}`);
      }
    });
  });
};
