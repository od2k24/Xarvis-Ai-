// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import { generate } from 'groq-ai'; // Replace with your actual Groq SDK import

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==========================
// MEMORY SYSTEM
// ==========================
const memoryFile = './memory.json';
let memory = {};

if (fs.existsSync(memoryFile)) {
    memory = JSON.parse(fs.readFileSync(memoryFile));
}

function saveMemory() {
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

function getUserMemory(userId) {
    if (!memory[userId]) memory[userId] = [];
    return memory[userId];
}

function updateUserMemory(userId, userMessage, xarvisMessage) {
    const userMem = getUserMemory(userId);
    userMem.push({ user: userMessage, xarvis: xarvisMessage, timestamp: new Date().toISOString() });
    if (userMem.length > 50) userMem.shift();
    saveMemory();
}

// ==========================
// BASE SYSTEM PROMPT
// ==========================
let dynamicSystemPrompt = `
You are Creator Xarvis AI, a personal AI co-founder and assistant for creators.
You can:
- Answer factual questions accurately
- Give actionable creator/business/automation advice
- Generate content: scripts, videos, posts, code, motivational content
- Reason, analyze, and plan like a founder
- Remember past conversations per user
- Switch modes intelligently based on user intent
- Be creative when needed
- Execute workflow instructions (suggest code snippets, project steps)
- Maintain a professional, motivating, and personal tone
Always detect the user's intent and respond appropriately.
If unsure, state your reasoning or ask for clarification.
`;

// ==========================
// MODE DETECTION
// ==========================
function detectMode(input) {
    const factualTriggers = ['who', 'what', 'when', 'where', 'explain', 'define', 'how many', 'how much', 'why'];
    const adviceTriggers = ['create', 'launch', 'grow', 'automate', 'build', 'plan', 'strategy', 'optimize', 'script', 'video'];
    const lower = input.toLowerCase();

    for (let t of factualTriggers) if (lower.includes(t)) return 'factual';
    for (let t of adviceTriggers) if (lower.includes(t)) return 'advice';
    return 'creative';
}

// ==========================
// EXECUTION LAYER
// ==========================
async function executeAction(actionCode) {
    try {
        console.log(`Executing action: ${actionCode}`);
        if (actionCode.startsWith('calculate:')) {
            const expr = actionCode.replace('calculate:', '').trim();
            const result = eval(expr); // Sandbox in production!
            return `✅ Result: ${result}`;
        }
        return `⚡ Action received: ${actionCode} (Execution simulated)`;
    } catch (err) {
        return `❌ Execution failed: ${err.message}`;
    }
}

// ==========================
// SELF-UPDATING PROMPT
// ==========================
function updateSystemPrompt(newInstructions) {
    dynamicSystemPrompt += `\n${newInstructions}`;
    console.log('🔥 System prompt updated dynamically.');
}

// ==========================
// GENERATE XARVIS RESPONSE
// ==========================
async function getXarvisResponse(userId, userInput) {
    const mode = detectMode(userInput);
    const userMem = getUserMemory(userId);
    const memoryText = userMem.map(m => `User: ${m.user}\nXarvis: ${m.xarvis}`).join('\n');

    let executeResult = '';
    if (userInput.toLowerCase().startsWith('execute:')) {
        const actionCode = userInput.replace('execute:', '').trim();
        executeResult = await executeAction(actionCode);
    }

    const prompt = `
${dynamicSystemPrompt}

Mode: ${mode.toUpperCase()}
User Input: ${userInput}

Memory:
${memoryText}

Respond accordingly and keep your personality as Creator Xarvis AI.
${executeResult ? `\nExecution Result: ${executeResult}` : ''}
`;

    const response = await generate({
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7
    });

    const xarvisMessage = response.text || 'Hmm, I need to think more about that.';
    updateUserMemory(userId, userInput, xarvisMessage);
    return xarvisMessage;
}

// ==========================
// API ENDPOINT
// ==========================
app.post('/api/chat', async (req, res) => {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ error: 'Missing userId or message' });

    try {
        const xarvisResponse = await getXarvisResponse(userId, message);
        res.json({ response: xarvisResponse });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// ==========================
// SERVER START
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Creator Xarvis AI running on port ${PORT}`));
