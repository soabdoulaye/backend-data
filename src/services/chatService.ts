import { AppDataSource } from '../config/database';
import { ChatMessage } from '../entities/ChatMessage';
import { User } from '../entities/User';
import { generateAIResponse } from './aiService';

// Repository for ChatMessage entity
const chatMessageRepository = AppDataSource.getRepository(ChatMessage);
const userRepository = AppDataSource.getRepository(User);

/**
 * Save a chat message to the database
 */
export const saveChatMessage = async (
    content: string,
    sender: 'user' | 'ai',
    user_id: string,
    conversation_id?: string
): Promise<ChatMessage> => {
    // Find user
    const user = await userRepository.findOne({
        where: { id: user_id }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Create new chat message
    const chatMessage = chatMessageRepository.create({
        content,
        sender,
        user,
        user_id,
        conversation_id
    });

    // Save chat message to database
    await chatMessageRepository.save(chatMessage);

    return chatMessage;
};

/**
 * Get chat messages for a user
 */
export const getChatMessages = async (
    user_id: string,
    conversation_id?: string,
    limit: number = 50,
    offset: number = 0
): Promise<ChatMessage[]> => {
    // Find user
    const user = await userRepository.findOne({
        where: { id: user_id }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Query options
    const queryOptions: any = {
        where: { user_id },
        order: { created_at: 'DESC' },
        take: limit,
        skip: offset
    };

    // Add conversation ID if provided
    if (conversation_id) {
        queryOptions.where.conversation_id = conversation_id;
    }

    // Get chat messages
    const chatMessages = await chatMessageRepository.find(queryOptions);

    return chatMessages.reverse(); // Return in chronological order
};

/**
 * Process a user message and generate AI response
 */
export const processUserMessage = async (
    message: string,
    user_id: string,
    conversation_id?: string
): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> => {
    // Save user message
    const userMessage = await saveChatMessage(message, 'user', user_id, conversation_id);

    // Generate AI response
    const aiResponse = await generateAIResponse(message);

    // Save AI response
    const aiMessage = await saveChatMessage(aiResponse, 'ai', user_id, conversation_id);

    return {
        userMessage,
        aiMessage
    };
};

/**
 * Get user's conversations
 */
export const getUserConversations = async (
    user_id: string
): Promise<{ conversation_id: string; lastMessage: string; created_at: Date }[]> => {
    // Find user
    const user = await userRepository.findOne({
        where: { id: user_id }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Get distinct conversation IDs with their latest message
    const conversations = await AppDataSource.query(`
        WITH LatestMessages AS (
            SELECT 
                conversation_id,
                content,
                created_at,
                ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as RowNum
            FROM 
                chat_messages
            WHERE 
                user_id = $1
        )
        SELECT 
            conversation_id,
            content as lastMessage,
            created_at
        FROM 
            LatestMessages
        WHERE 
            RowNum % 2 = 0
        ORDER BY 
            created_at DESC
    `, [user_id]);

    return conversations;
};
