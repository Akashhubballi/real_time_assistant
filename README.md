# Project 5: Real-Time Voice Assistant (Advanced Track)

A streaming, low-latency Voice Assistant built with **Vite, React, Express, WebSockets, and Web Speech API**, supporting **LLM Tool & Function Calling**, **Barge-in Interruption**, and **Real-Time Latency Tracking**.

---

## ⚡ Key Features

1. **Streaming Speech-to-Text & Text-to-Speech**:
   - Audio input streams directly from microphone using Web Audio API.
   - Low-latency TTS voice response.

2. **LLM Function & Tool Calling**:
   - `get_weather({ city: string })`: Fetches live weather report for any city.
   - `set_reminder({ task: string, time: string })`: Creates active reminders.
   - `search_database({ query: string })`: Performs real-time vector database record lookup.

3. **Barge-in Speech Interruption Handling**:
   - Speak anytime or click the glowing orb while the assistant is talking to immediately interrupt audio output.

4. **Stretch Goals Implemented**:
   - **Round-Trip Latency Meter**: Displays real-time response latency (ms) ensuring sub-1.5s performance.
   - **Tool Execution Inspector**: Live visual panel showing function names, input arguments, and JSON result payloads.

---

## 🚀 Quick Setup & Run in VS Code

### Step 1: Open Project in VS Code
Open VS Code terminal (`Ctrl + ~`) in the extracted directory:
```bash
cd realtime-voice-assistant
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Project
Launch the development server:
```bash
npm run dev
```

Open your browser at: **`http://localhost:3000`**

*(Optionally run `npm run server` in a second terminal to start the Express + WebSocket backend on port 5000).*

---

## 📁 Repository Structure

```
realtime-voice-assistant/
├── server/
│   └── index.js                   # Express + WebSocket streaming server & tool handlers
├── src/
│   ├── components/
│   │   └── ToolCallingInspector.jsx # Real-time tool log inspector
│   ├── App.jsx                    # Core application UI & speech state machine
│   ├── main.jsx                   # React root entry point
│   └── index.css                  # Futuristic dark UI design system & orb animation
├── index.html                     # HTML shell & font imports
├── vite.config.js                 # Vite proxy configuration
├── package.json                   # Dependencies and scripts
└── README.md                      # Project documentation
```

---

## 🤖 AI Coding Assistant Disclosure
Developed with assistance from **Antigravity AI (Gemini 3.6)** for rapid React component scaffolding, UI design system setup, and documentation.
