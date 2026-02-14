import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import db from '../db.js';
import tutorRoutes from '../routes/tutor.js';

// Mock the LLM service
// We need to mock '../services/llm.js' before importing tutorRoutes if tutorRoutes imports it directly.
// Vitest hoisting handles this if we use vi.mock correctly.

vi.mock('../services/llm.js', () => ({
    chat: vi.fn().mockResolvedValue("This is a mocked AI response."),
    generatePlan: vi.fn().mockResolvedValue({ title: "Mock Plan", weeks: [] }),
}));

// Setup app
const app = express();
app.use(express.json());

// Mock auth middleware for testing
// We can overwrite the authenticateToken middleware or just generate a valid token if we had full auth setup.
// But easier: Mock the middleware.
// However, typically middlewares are imported.
// In tutor.js: `import { authenticateToken } from "../middleware/auth.js";`
// So we need to mock THAT module too.

vi.mock('../middleware/auth.js', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
    }
}));

app.use('/api/tutor', tutorRoutes);

describe('Tutor Routes', () => {
    beforeAll(() => {
        // Setup DB for tutor
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password_hash TEXT
            );
            INSERT INTO users (id, email, password_hash) VALUES (1, 'test@example.com', 'hash');
        `);

        // Tables are created by db.js but lets ensure they exist or are clean
        db.exec(`DELETE FROM tutor_conversations; DELETE FROM tutor_messages;`);
    });

    it('should create a new conversation', async () => {
        const res = await request(app)
            .post('/api/tutor/conversations')
            .send({ mode: 'Explain Mode' });

        expect(res.status).toBe(201);
        expect(res.body.conversation).toHaveProperty('id');
        expect(res.body.conversation).toHaveProperty('mode', 'Explain Mode');
    });

    it('should send a message and get AI response', async () => {
        // First get the conversation ID
        const convoRes = await request(app)
            .post('/api/tutor/conversations')
            .send({ mode: 'Quiz Mode' });
        const convoId = convoRes.body.conversation.id;

        const res = await request(app)
            .post(`/api/tutor/conversations/${convoId}/messages`)
            .send({ content: "Hello AI" });

        expect(res.status).toBe(201);
        console.log("Tutor Test Debug:", JSON.stringify(res.body, null, 2));
        expect(res.body.messages).toHaveLength(2); // User + Assistant
        const aiMsg = res.body.messages.find(m => m.role === 'assistant');
        console.log("AI Msg found:", aiMsg);
        expect(aiMsg).toBeDefined();
        expect(aiMsg.content).toBe("This is a mocked AI response.");
        // Logic in route: `ORDER BY created_at DESC LIMIT 2`. reverse() -> [oldest, newest].
        // So messages[1] is AI response.

        // Wait, route does: `const messages = db.prepare(...).all().reverse();`
        // Query: `ORDER BY created_at DESC LIMIT 2` -> [Assistant, User]
        // reverse() -> [User, Assistant]

        expect(res.body.messages[1].role).toBe('assistant');
        expect(res.body.messages[1].content).toBe("This is a mocked AI response.");
    });
});
