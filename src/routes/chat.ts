import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { processUserMessage, getChatMessages, getUserConversations } from '../services/chatService';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/chat
 * Send a message and get AI response
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { message, conversation_id } = req.body;
        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }
       
        // Process user message and get AI response
        const { userMessage, aiMessage } = await processUserMessage(
            message,
            user_id,
            conversation_id
        );

        // Return the response
        return res.status(200).json({
            success: true,
            data: {
                conversation_id: conversation_id,
                userMessage: {
                    id: userMessage.id,
                    content: userMessage.content,
                    sender: userMessage.sender,
                    created_at: userMessage.created_at
                },
                aiMessage: {
                    id: aiMessage.id,
                    content: aiMessage.content,
                    sender: aiMessage.sender,
                    created_at: aiMessage.created_at
                }
            }
        });
    } catch (error: any) {
        console.error('Error in chat endpoint:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while processing your request'
        });
    }
});

/**
 * GET /api/chat/messages
 * Get chat messages for a conversation
 */
router.get('/messages', authenticate, async (req, res) => {
    try {
        const { conversation_id } = req.query;
        const user_id = req.user?.user_id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Get chat messages
        const messages = await getChatMessages(
            user_id,
            conversation_id as string,
            limit,
            offset
        );

        // Return the response
        return res.status(200).json({
            success: true,
            data: {
                messages: messages.map(message => ({
                    id: message.id,
                    content: message.content,
                    sender: message.sender,
                    conversation_id: message.conversation_id,
                    created_at: message.created_at
                }))
            }
        });
    } catch (error: any) {
        console.error('Error in get messages endpoint:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while fetching messages'
        });
    }
});

/**
 * GET /api/chat/conversations
 * Get user's conversations
 */
router.get('/conversations', authenticate, async (req, res) => {
    try {
        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Get user's conversations
        const conversations = await getUserConversations(user_id);

        // Return the response
        return res.status(200).json({
            success: true,
            data: {
                conversations
            }
        });
    } catch (error: any) {
        console.error('Error in get conversations endpoint:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while fetching conversations'
        });
    }
});

export const chatRouter = router;
