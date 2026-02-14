

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const DEFAULT_MODEL = "llama3"; // user can override in preferences

/**
 * Chat with local Ollama model.
 * @param {Object} params
 * @param {Array} params.history - [{ role: "user"|"model", parts: [{ text }] }] (Gemini format)
 * @param {string} params.message - User message
 * @param {string} params.systemPrompt - System instruction
 * @param {string} [params.model] - Model name (e.g., "llama3", "phi3")
 * @returns {Promise<string>}
 */
export async function chat({ history = [], message, systemPrompt, model = DEFAULT_MODEL }) {
    try {
        // Convert Gemini history format to Ollama format
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role === "model" ? "assistant" : "user",
                content: msg.parts[0].text
            })),
            { role: "user", content: message }
        ];

        const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.message.content;
    } catch (error) {
        console.error("[Ollama Service] Chat error:", error);
        if (error.code === 'ECONNREFUSED') {
            return "I cannot connect to Ollama. Make sure it's running locally on port 11434.";
        }
        throw error;
    }
}

/**
 * Generate study plan using Ollama.
 * @param {string} syllabusText
 * @param {string} [model]
 * @returns {Promise<Object>}
 */
export async function generatePlan(syllabusText, model = DEFAULT_MODEL) {
    const prompt = `
        You are an expert study planner. Create a structured study plan based on the following syllabus:
        "${syllabusText}"

        Return ONLY raw JSON (no markdown) with this structure:
        {
            "title": "Descriptive Title",
            "weeks": [
                {
                    "week_number": 1,
                    "topics": ["Topic 1", "Topic 2"],
                    "tasks": [{ "title": "Task 1", "due_date": null }]
                }
            ]
        }
    `;

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                format: "json" // Ollama supports JSON mode
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        return JSON.parse(data.response);
    } catch (error) {
        console.error("[Ollama Service] Plan generation error:", error);
        throw error;
    }
}
