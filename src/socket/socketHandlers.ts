import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { processUserMessage } from '../services/chatService';
import { verifyToken } from '../services/authService';

interface AuthenticatedSocket extends Socket {
    user?: {
        user_id: string;
        username: string;
        role: string;
    };
}

/**
 * Set up Socket.IO event handlers
 * @param io Socket.IO server instance
 */
export const setupSocketHandlers = (io: Server): void => {
    // Middleware for authentication
    io.use((socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            // Verify token
            const decoded = verifyToken(token);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // Handle connection event
    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.id}, User ID: ${socket.user?.user_id}`);

        // Join user's room for private messages
        if (socket.user?.user_id) {
            socket.join(`user:${socket.user.user_id}`);
        }

        // Handle user message event
        socket.on('user-message', async (data: { message: string; conversation_id?: string }) => {
            try {
                if (!socket.user?.user_id) {
                    socket.emit('error', {
                        message: 'Authentication required'
                    });
                    return;
                }

                console.log(`Message from ${socket.id}: ${data.message}`);

                // Process user message and get AI response
                const { userMessage, aiMessage } = await processUserMessage(
                    data.message,
                    socket.user.user_id,
                    data.conversation_id
                );

                // Emit user message back to the client for confirmation
                socket.emit('message-received', {
                    id: userMessage.id,
                    content: userMessage.content,
                    sender: userMessage.sender,
                    conversation_id: userMessage.conversation_id,
                    created_at: userMessage.created_at
                });

                // Emit AI response back to the client
                socket.emit('ai-message', {
                    id: aiMessage.id,
                    content: aiMessage.content,
                    sender: aiMessage.sender,
                    conversation_id: aiMessage.conversation_id,
                    created_at: aiMessage.created_at
                });
            } catch (error: any) {
                console.error('Error processing message:', error);

                // Emit error message
                socket.emit('error', {
                    message: error.message || 'An error occurred while processing your request'
                });
            }
        });

        // Handle typing event
        socket.on('typing', (data: { conversation_id: string; isTyping: boolean }) => {
            if (!socket.user?.user_id) {
                return;
            }

            // Broadcast typing status to other clients in the same conversation
            socket.to(`conversation:${data.conversation_id}`).emit('user-typing', {
                user_id: socket.user.user_id,
                isTyping: data.isTyping
            });
        });

        // Handle join conversation event
        socket.on('join-conversation', (conversation_id: string) => {
            if (!socket.user?.user_id) {
                return;
            }

            // Join conversation room
            socket.join(`conversation:${conversation_id}`);
            console.log(`User ${socket.user.user_id} joined conversation ${conversation_id}`);
        });

        // Handle leave conversation event
        socket.on('leave-conversation', (conversation_id: string) => {
            if (!socket.user?.user_id) {
                return;
            }

            // Leave conversation room
            socket.leave(`conversation:${conversation_id}`);
            console.log(`User ${socket.user.user_id} left conversation ${conversation_id}`);
        });

        // Handle disconnect event
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
