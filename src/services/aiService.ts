import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
        if (!configuration.apiKey) {
            console.warn('OpenAI API key not configured, using fallback response');
            return generateFallbackResponse(userMessage);
        }

        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo", // ✅ 新しいモデル
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 1000, // Increased token limit for longer responses
        });

        const aiResponse = response.data.choices[0]?.message?.content?.trim() || generateFallbackResponse(userMessage);
        return aiResponse;
    } catch (error: any) {
        console.error('Error calling OpenAI API:', error);
        if (error.response) {
            console.error('OpenAI API error status:', error.response.status);
            console.error('OpenAI API error data:', error.response.data);
        }
        return generateFallbackResponse(userMessage);
    }
};

const generateFallbackResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    if (message.includes('hello') || message.includes('hi')) {
        return "Hello! How can I assist you today?";
    } else if (message.includes('help')) {
        return "I'm here to help. What do you need assistance with?";
    } else if (message.includes('thank')) {
        return "You're welcome! Is there anything else I can help with?";
    } else if (message.includes('bye') || message.includes('goodbye')) {
        return "Goodbye! Have a great day!";
    } else if (message.includes('weather')) {
        return "I'm sorry, I don't have access to real-time weather data in this fallback mode.";
    } else if (message.includes('name')) {
        return "I'm an AI assistant here to help you.";
    } else {
        return "I understand you're trying to communicate with me, but I'm currently in fallback mode with limited capabilities. Please try again later when the full AI service is available.";
    }
};
