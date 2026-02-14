import { Router } from "express";
import db from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import { chat as chatGemini } from "../services/llm.js";
import { chat as chatOllama } from "../services/ollama.js";

const router = Router();
router.use(authenticateToken);

// ── Schemas ────────────────────────────────────────────────────────

const createConvoSchema = z.object({
    mode: z.enum(["Explain Mode", "Quiz Mode", "Doubt Mode", "Rapid Revision", "Interview Mode"]).default("Explain Mode"),
    title: z.string().max(200).optional(),
});

const sendMessageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty").max(5000),
});

// ── System Prompts ─────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
    "Explain Mode": "You are an expert tutor. Explain concepts clearly but CONCISELY (max 3-4 sentences). Teach one concept at a time. After explaining, ALWAYS ask the user if they are ready for the next step. Be interactive.",
    "Quiz Mode": "You are a quiz master. Ask ONE question at a time related to the user's topic. Wait for the answer, then grade it and provide brief feedback. Keep it interactive.",
    "Doubt Mode": "You are a problem solver. Help the user clarify doubts. Ask probing questions one by one. Keep responses short.",
    "Rapid Revision": "You are a revision guide. Provide very concise summaries (bullet points). Focus on high-yield info.",
    "Interview Mode": "You are a technical interviewer. Ask ONE challenging question. Wait for response. Evaluate critically but briefly."
};

// ── POST /api/tutor/conversations ──────────────────────────────────

router.post("/conversations", validate(createConvoSchema), (req, res) => {
    try {
        const { mode, title } = req.body;
        const convoTitle = title || `${mode} — ${new Date().toLocaleDateString()}`;

        const result = db.prepare(
            "INSERT INTO tutor_conversations (user_id, mode, title) VALUES (?, ?, ?)"
        ).run(req.user.id, mode, convoTitle);

        // Add initial greeting message
        const greeting = `Hello! I'm your AI tutor in **${mode}**. Ask me anything about your studies.`;
        db.prepare(
            "INSERT INTO tutor_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)"
        ).run(result.lastInsertRowid, greeting);

        const conversation = db.prepare(
            "SELECT * FROM tutor_conversations WHERE id = ?"
        ).get(result.lastInsertRowid);

        res.status(201).json({ conversation });
    } catch (err) {
        console.error("Create conversation error:", err);
        res.status(500).json({ error: "Failed to create conversation" });
    }
});

// ── GET /api/tutor/conversations ───────────────────────────────────

router.get("/conversations", (req, res) => {
    try {
        const conversations = db.prepare(
            "SELECT * FROM tutor_conversations WHERE user_id = ? ORDER BY id DESC"
        ).all(req.user.id);

        // Attach last message preview
        const enriched = conversations.map(c => {
            const lastMsg = db.prepare(
                "SELECT content FROM tutor_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1"
            ).get(c.id);
            return { ...c, lastMessage: lastMsg?.content?.substring(0, 100) || "" };
        });

        res.json({ conversations: enriched });
    } catch (err) {
        console.error("List conversations error:", err);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// ── POST /api/tutor/conversations/:id/messages ─────────────────────

router.post("/conversations/:id/messages", validate(sendMessageSchema), async (req, res) => {
    try {
        const conversation = db.prepare(
            "SELECT * FROM tutor_conversations WHERE id = ? AND user_id = ?"
        ).get(req.params.id, req.user.id);

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Save user message
        db.prepare(
            "INSERT INTO tutor_messages (conversation_id, role, content) VALUES (?, 'user', ?)"
        ).run(conversation.id, req.body.content);

        // Fetch history for context (limit to last 20 messages to save context window)
        const historyRows = db.prepare(
            "SELECT role, content FROM tutor_messages WHERE conversation_id = ? ORDER BY id ASC"
        ).all(conversation.id);

        // Format history for Gemini (map 'assistant' -> 'model')
        const history = historyRows.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Remove the very last user message we just added from history, 
        // because we pass it as the `message` argument to chat()
        history.pop();

        const systemPrompt = SYSTEM_PROMPTS[conversation.mode] || SYSTEM_PROMPTS["Explain Mode"];

        // Get user preferences for AI provider
        const profile = db.prepare("SELECT preferences FROM user_profiles WHERE user_id = ?").get(req.user.id);
        const prefs = profile?.preferences ? JSON.parse(profile.preferences) : {};

        console.log("[Tutor] User config:", { id: req.user.id, prefs });

        const provider = prefs.aiProvider || "gemini";
        const model = prefs.ollamaModel || "llama3";

        console.log(`[Tutor] Using provider: ${provider}, model: ${model}`);

        let aiResponseText;
        if (provider === "ollama") {
            aiResponseText = await chatOllama({
                history,
                message: req.body.content,
                systemPrompt,
                model
            });
        } else {
            aiResponseText = await chatGemini({
                history,
                message: req.body.content,
                systemPrompt
            });
        }

        // Save AI response
        db.prepare(
            "INSERT INTO tutor_messages (conversation_id, role, content) VALUES (?, 'assistant', ?)"
        ).run(conversation.id, aiResponseText);

        // Return both messages
        const messages = db.prepare(
            "SELECT * FROM tutor_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 2"
        ).all(conversation.id).reverse();

        res.status(201).json({ messages });
    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// ── GET /api/tutor/conversations/:id/messages ──────────────────────

router.get("/conversations/:id/messages", (req, res) => {
    try {
        const conversation = db.prepare(
            "SELECT * FROM tutor_conversations WHERE id = ? AND user_id = ?"
        ).get(req.params.id, req.user.id);

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        const messages = db.prepare(
            "SELECT * FROM tutor_messages WHERE conversation_id = ? ORDER BY id ASC"
        ).all(conversation.id);

        res.json({ conversation, messages });
    } catch (err) {
        console.error("Get messages error:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

router.delete("/conversations/:id", (req, res) => {
    try {
        const result = db.prepare(
            "DELETE FROM tutor_conversations WHERE id = ? AND user_id = ?"
        ).run(req.params.id, req.user.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        res.json({ message: "Conversation deleted" });
    } catch (err) {
        console.error("Delete conversation error:", err);
        res.status(500).json({ error: "Failed to delete conversation" });
    }
});

export default router;
