import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const LANGUAGE_MAP: Record<string, string> = {
  bm: "Bambara (Bamanankan)",
  ff: "Fulfulde",
  sw: "Swahili",
  yo: "Yoruba",
  ha: "Hausa",
  ig: "Igbo",
  am: "Amharic",
  zu: "Zulu",
  xh: "Xhosa",
  en: "English",
  fr: "French",
  ar: "Arabic",
  es: "Spanish",
  pt: "Portuguese",
  zh: "Chinese",
  hi: "Hindi",
  ja: "Japanese",
  ko: "Korean",
  de: "German",
  ru: "Russian",
};

/**
 * Generate streaming AI response for real-time voice conversation
 */
export const generateStreamingAIResponse = async (
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  languageCode: string = "en"
): Promise<AsyncGenerator<string>> => {
  if (!configuration.apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const languageName = LANGUAGE_MAP[languageCode] || "English";

  const systemPrompt = `You are a helpful voice assistant speaking in ${languageName}.
Keep responses brief and natural for voice. Respond ONLY in ${languageName}.`;

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...conversationHistory,
    { role: "user", content: `[${languageName}] ${userMessage}` },
  ];

  async function* streamResponse() {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages as any,
        temperature: 0.8,
        max_tokens: 150,
        stream: true,
      } as any);

      const stream = response.data as any;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error("Error in streaming response:", error);
      throw error;
    }
  }

  return streamResponse();
};

/**
 * Generate quick AI response for voice (optimized for voice conversations)
 */
export const generateVoiceAIResponse = async (
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  languageCode: string = "en"
): Promise<string> => {
  try {
    if (!configuration.apiKey) {
      return "I'm sorry, but I'm currently in limited mode. Please check back later.";
    }

    const languageName = LANGUAGE_MAP[languageCode] || "English";

    const systemPrompt = `You are a helpful voice assistant. The user is speaking to you in ${languageName}.
Always respond in ${languageName} ONLY. Keep responses brief (1-3 sentences) and natural for voice conversation.
Be friendly and conversational.

CRITICAL: You MUST respond in ${languageName}, not in any other language.`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory.slice(-6), // Keep last 3 exchanges
      {
        role: "user",
        content: `[${languageName}] ${userMessage}`,
      },
    ];

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages as any,
      temperature: 0.8,
      max_tokens: 150,
    });

    const aiResponse = response.data.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      return `I'm not sure how to respond to that in ${languageName}. Could you please repeat?`;
    }

    return aiResponse;
  } catch (error: any) {
    console.error("Error calling OpenAI API for voice:", error);
    return "I'm having trouble understanding. Could you please repeat that?";
  }
};
