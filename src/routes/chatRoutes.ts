import express from 'express';
import { 
    getChatMessages, 
    processUserMessage, 
    getUserConversations,
    deleteMessage,
    deleteConversation,
    deleteAllConversations,
    updateMessage
} from '../services/chatService';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Get chat messages
router.get('/messages', authenticate, async (req, res) => {
    try {
        const user_id = req.user?.user_id;
        const { conversation_id, limit, offset } = req.query;

        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const messages = await getChatMessages(
            user_id,
            conversation_id as string,
            limit ? parseInt(limit as string) : 50,
            offset ? parseInt(offset as string) : 0
        );

        res.json({
            success: true,
            data: { messages }
        });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch messages' });
    }
});

// Send a chat message (REST fallback)
router.post('/', authenticate, async (req, res) => {
    try {
        const user_id = req.user?.user_id;
        const { message, conversation_id } = req.body;

        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await processUserMessage(message, user_id, conversation_id);

        res.json({
            success: true,
            data: {
                userMessage: result.userMessage,
                aiMessage: result.aiMessage,
                conversation_id: result.userMessage.conversation_id
            }
        });
    } catch (error: any) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: error.message || 'Failed to process message' });
    }
});

// Get user conversations
router.get('/conversations', authenticate, async (req, res) => {
    try {
        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const conversations = await getUserConversations(user_id);

        res.json({
            success: true,
            data: { conversations }
        });
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
    }
});

// Delete a single message
router.delete('/message/:message_id', authenticate, async (req, res) => {
    try {
        const user_id = req.user?.user_id;
        const { message_id } = req.params;

        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await deleteMessage(message_id, user_id);

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: error.message || 'Failed to delete message' });
    }
});

// Delete a conversation
router.delete('/conversation/:conversation_id', authenticate, async (req, res) => {
    try {
        const user_id = req.user?.user_id;
        const { conversation_id } = req.params;

        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await deleteConversation(conversation_id, user_id);

        res.json({
            success: true,
            message: 'Conversation deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: error.message || 'Failed to delete conversation' });
    }
});

// Delete all conversations
router.delete('/conversations', authenticate, async (req, res) => {
    try {
        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await deleteAllConversations(user_id);

        res.json({
            success: true,
            message: 'All conversations deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting all conversations:', error);
        res.status(500).json({ error: error.message || 'Failed to delete all conversations' });
    }
});

// Edit/Update a message
router.put('/message/:message_id', authenticate, async (req, res) => {
    try {
        const user_id = req.user?.user_id;
        const { message_id } = req.params;
        const { content } = req.body;

        if (!user_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const updatedMessage = await updateMessage(message_id, user_id, content);

        res.json({
            success: true,
            data: updatedMessage
        });
    } catch (error: any) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: error.message || 'Failed to update message' });
    }
});

export const chatVoiceRouter = router;