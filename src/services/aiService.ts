import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// 言語情報をマッピング
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

export const generateAIResponse = async (
  userMessage: string,
  languageCode: string = "en"
): Promise<string> => {
  try {
    if (!configuration.apiKey) {
      console.warn("OpenAI API key not configured, using fallback response");
      return generateFallbackResponse(userMessage);
    }

    const languageName = LANGUAGE_MAP[languageCode] || "English";

    // より詳細なシステムプロンプト - 言語情報を含める
    const systemPrompt = `You are a helpful AI assistant. The user is communicating with you in ${languageName}. 
Please respond in the same language (${languageName}) that the user is using.

Important guidelines:
- Always respond in ${languageName}, not English
- Be respectful of the user's language and culture
- If you don't understand something, ask for clarification in ${languageName}
- Keep your response concise and natural
- Use appropriate tone for the language and culture`;

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `[Language: ${languageName}]\n${userMessage}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse =
      response.data.choices[0]?.message?.content?.trim() ||
      generateFallbackResponse(userMessage);
    return aiResponse;
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);
    if (error.response) {
      console.error("OpenAI API error status:", error.response.status);
      console.error("OpenAI API error data:", error.response.data);
    }
    return generateFallbackResponse(userMessage);
  }
};

const generateFallbackResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();

  if (
    message.includes("hello") ||
    message.includes("hi") ||
    message.includes("bonjour")
  ) {
    return "Hello! How can I help you?";
  } else if (message.includes("help")) {
    return "I'm here to help. What do you need?";
  } else if (message.includes("thank")) {
    return "You're welcome!";
  } else if (message.includes("bye") || message.includes("goodbye")) {
    return "Goodbye! Have a great day!";
  } else {
    return "I understand you're trying to communicate. Let me help you. Could you clarify your question?";
  }
};
