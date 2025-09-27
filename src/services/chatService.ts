import { getSupabaseClient } from '../config/database';
import { generateAIResponse } from './aiService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Save a chat message to Supabase
 */
export const saveChatMessage = async (
    content: string,
    sender: 'user' | 'ai',
    user_id: string,
    conversation_id?: string
) => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('chat_messages')
        .insert([
            {
                content,
                sender,
                user_id,
                conversation_id,
            }
        ])
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to save chat message: ${error.message}`);
    }

    return data;
};

/**
 * Get chat messages for a user
 */
export const getChatMessages = async (
    user_id: string,
    conversation_id?: string,
    limit: number = 50,
    offset: number = 0
) => {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (conversation_id) {
        query = query.eq('conversation_id', conversation_id);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch chat messages: ${error.message}`);
    }

    return data.reverse();
};

/**
 * Process a user message and generate AI response
 */
export const processUserMessage = async (
    message: string,
    user_id: string,
    conversation_id?: string
) => {
    const convId = conversation_id ?? uuidv4();
    
    const userMessage = await saveChatMessage(message, 'user', user_id, convId);
    const aiResponse = await generateAIResponse(message);
    const aiMessage = await saveChatMessage(aiResponse, 'ai', user_id, convId);

    return {
        userMessage,
        aiMessage,
    };
};

/**
 * Get user's conversations (latest message per conversation)
 */
export const getUserConversations = async (
  userId: string
): Promise<{ conversationId: string; lastMessage: string; createdAt: Date }[]> => {
  const supabase = getSupabaseClient();
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('conversation_id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }

  const conversationMap = new Map();
  messages?.forEach((msg) => {
    if (msg.conversation_id && !conversationMap.has(msg.conversation_id)) {
      conversationMap.set(msg.conversation_id, {
        conversationId: msg.conversation_id,
        lastMessage: msg.content,
        createdAt: new Date(msg.created_at)
      });
    }
  });

  return Array.from(conversationMap.values());
};

/**
 * Delete a single message
 */
export const deleteMessage = async (
    message_id: string,
    user_id: string
): Promise<void> => {
    const supabase = getSupabaseClient();

    // Verify message belongs to user
    const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', message_id)
        .eq('user_id', user_id)
        .single();

    if (fetchError || !message) {
        throw new Error('Message not found or unauthorized');
    }

    // Delete message
    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', message_id);

    if (error) {
        throw new Error(`Failed to delete message: ${error.message}`);
    }
};

/**
 * Delete entire conversation
 */
export const deleteConversation = async (
    conversation_id: string,
    user_id: string
): Promise<void> => {
    const supabase = getSupabaseClient();

    // Delete all messages in conversation
    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversation_id)
        .eq('user_id', user_id);

    if (error) {
        throw new Error(`Failed to delete conversation: ${error.message}`);
    }
};

/**
 * Delete all conversations for a user
 */
export const deleteAllConversations = async (
    user_id: string
): Promise<void> => {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user_id);

    if (error) {
        throw new Error(`Failed to delete all conversations: ${error.message}`);
    }
};

/**
 * Update a message (for edit functionality)
 */
export const updateMessage = async (
    message_id: string,
    user_id: string,
    new_content: string
): Promise<any> => {
    const supabase = getSupabaseClient();

    // Verify message belongs to user and is a user message
    const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', message_id)
        .eq('user_id', user_id)
        .eq('sender', 'user')
        .single();

    if (fetchError || !message) {
        throw new Error('Message not found or cannot be edited');
    }

    // Update message
    const { data, error } = await supabase
        .from('chat_messages')
        .update({ 
            content: new_content,
            updated_at: new Date()
        })
        .eq('id', message_id)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update message: ${error.message}`);
    }

    return data;
};