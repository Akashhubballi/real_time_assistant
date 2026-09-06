import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Simulated Tool Registry
const tools = {
  get_weather: ({ city }) => {
    const c = city || 'San Francisco';
    return { city: c, temp: '72°F (22°C)', condition: 'Sunny with mild breeze', humidity: '48%' };
  },
  set_reminder: ({ task, time }) => {
    return { id: Date.now(), task: task || 'General Reminder', time: time || '5:00 PM', status: 'Created' };
  },
  search_database: ({ query }) => {
    return { query, matches: 3, topRecord: "Record #8492 - Q3 Technical Review - Approved" };
  }
};

// WebSocket Streaming Transport
wss.on('connection', (ws) => {
  console.log('Client connected to Real-Time Voice Assistant WebSocket');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'audio_stream') {
        // Echo or stream audio frames
        ws.send(JSON.stringify({ type: 'stream_ack', bytesReceived: data.audio ? data.audio.length : 0 }));
      } else if (data.type === 'tool_call') {
        const toolFn = tools[data.name];
        const result = toolFn ? toolFn(data.params || {}) : { error: 'Unknown tool' };
        ws.send(JSON.stringify({ type: 'tool_result', name: data.name, result }));
      }
    } catch (e) {
      console.error('WS parse error:', e);
    }
  });

  ws.on('close', () => console.log('Client disconnected from WebSocket'));
});

// REST Endpoint for Tool Execution
app.post('/api/tools/execute', (req, res) => {
  const { tool, params } = req.body;
  const toolFn = tools[tool];
  if (toolFn) {
    const result = toolFn(params || {});
    return res.json({ success: true, tool, result });
  }
  res.status(404).json({ error: `Tool ${tool} not found` });
});

// REST Endpoint for Chat (LLM integration via direct REST API)
// Using v1beta which supports these models
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-pro-latest'];

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ response: "I'm sorry, my AI brain isn't connected yet. Please add your GEMINI_API_KEY to the .env file." });
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: `You are a helpful, friendly, and knowledgeable AI voice assistant. Answer the user's question directly and concisely. User says: ${prompt}` }] }]
  });

  for (const modelName of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const apiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.warn(`Model ${modelName} failed (${apiRes.status}): ${errText.substring(0, 100)}`);
        continue; // try next model
      }

      const data = await apiRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`Responded using model: ${modelName}`);
        return res.json({ response: text });
      }
    } catch (error) {
      console.error(`Error with model ${modelName}:`, error.message);
    }
  }

  // If all models fail
  res.status(500).json({ error: 'Failed to communicate with AI model. Please check your API key.' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Real-Time Voice Assistant Backend (Project 5)', port: PORT });
});

server.listen(PORT, () => {
  console.log(`Real-Time Voice Assistant server running on port ${PORT}`);
});
