import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

// Create OpenAI API instance
const openai = new OpenAIApi(configuration);

/**
 * Generate AI response using OpenAI API
 * @param userMessage The user's message
 * @returns AI-generated response
 */
export const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
        // Check if API key is configured
        if (!configuration.apiKey) {
            console.warn('OpenAI API key not configured, using fallback response');
            return generateFallbackResponse(userMessage);
        }

        // Call OpenAI API
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: `User: ${userMessage}\nAI:`,
            temperature: 0.7,
            max_tokens: 150,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0.6,
            stop: ["User:", "AI:"],
        });

        // Extract and return the generated text
        const aiResponse = response.data.choices[0]?.text?.trim() || generateFallbackResponse(userMessage);
        return aiResponse;
    } catch (error: any) {
        console.error('Error calling OpenAI API:', error);

        // Check for specific error types
        if (error.response) {
            console.error('OpenAI API error status:', error.response.status);
            console.error('OpenAI API error data:', error.response.data);
        }

        // Return fallback response in case of error
        return generateFallbackResponse(userMessage);
    }
};

/**
 * Generate a fallback response when OpenAI API is unavailable
 * @param userMessage The user's message
 * @returns Fallback response
 */
const generateFallbackResponse = (userMessage: string): string => {
    // Simple keyword-based response generation
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
