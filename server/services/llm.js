import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
    console.warn("[Aekagra AI] ⚠ GEMINI_API_KEY is missing. AI features will use stub responses.");
}

/**
 * Chat with the AI Tutor.
 * @param {Array} history - Previous messages [{ role: "user" | "model", parts: [{ text: string }] }]
 * @param {string} message - The user's new message
 * @param {string} systemPrompt - Mode-specific instructions
 * @returns {Promise<string>} The AI's response text
 */
export async function chat({ history = [], message, systemPrompt }) {
    if (!model) {
        return "I'm currently in offline mode because the GEMINI_API_KEY is missing. Please add it to your .env file to unlock my full potential!";
    }

    try {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `System Instruction: ${systemPrompt}` }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will act according to these instructions." }],
                },
                ...history,
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("[LLM Service] Chat error:", error);
        throw new Error("Failed to get response from AI Tutor.");
    }
}

/**
 * Generate a structured study plan from syllabus text.
 * @param {string} syllabusText
 * @returns {Promise<Object>} JSON object with title and weeks array
 */
export async function generatePlan(syllabusText) {
    if (!model) {
        // Mock fallback if no API key
        return {
            title: "Study Plan (Offline Mode)",
            weeks: [
                {
                    week_number: 1,
                    topics: ["Introduction", "Basic Concepts"],
                    tasks: [{ title: "Read Chapter 1", due_date: null }],
                },
            ],
        };
    }

    const prompt = `
        You are an expert study planner. Create a structured study plan based on the following syllabus/topic list:
        "${syllabusText}"

        Return ONLY raw JSON (no markdown block) with this structure:
        {
            "title": "Descriptive Title",
            "weeks": [
                {
                    "week_number": 1,
                    "topics": ["Topic 1", "Topic 2"],
                    "tasks": [
                        { "title": "Specific actionable task", "due_date": null }
                    ]
                }
            ]
        }
        Limit to 4-8 weeks depending on complexity. Ensure tasks are actionable.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("[LLM Service] Plan generation error:", error);
        throw new Error("Failed to generate study plan.");
    }
}
