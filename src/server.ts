import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import 'reflect-metadata';
import { chatVoiceRouter } from './routes/chatRoutes';
import { chatRouter } from './routes/chat';
import { authRouter } from './routes/auth';
import { setupSocketHandlers } from './socket/socketHandlers';
import { initializeDatabase } from './config/database';
import { setupVoiceHandlers } from './socket/voiceSocketHandlers';

// Load environment variables
dotenv.config();

// Initialize database
initializeDatabase()
    .then(() => {
        console.log('Database initialized successfully');
    })
    .catch((error) => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });

// Create Express app
const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chat', chatVoiceRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: `${process.env.FRONTEND_URL}`,
        methods: ['GET', 'POST']
    }
});

// Set up Socket.IO handlers
setupSocketHandlers(io);
setupVoiceHandlers(io);

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Health check at http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
