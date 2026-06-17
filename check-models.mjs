import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('[CheckModels] Missing required GEMINI_API_KEY environment variable.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('[CheckModels] Models response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('[CheckModels] Error fetching models:', error);
    }
}

listModels();
