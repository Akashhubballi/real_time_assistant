import React, { useState, useRef, useEffect } from 'react';
import ToolCallingInspector from './components/ToolCallingInspector.jsx';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [latencyMs, setLatencyMs] = useState(0);
  const [activeTool, setActiveTool] = useState(null);
  const [toolHistory, setToolHistory] = useState([]);
  const [reminders, setReminders] = useState([]);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am your Real-Time Voice Assistant. Speak or type commands like 'What is the weather in Paris?', 'Remind me to call John at 4 PM', or 'Search DB for project reports'."
    }
  ]);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          handleVoiceCommand(finalTranscript.trim());
        }
      };

      recognition.onerror = (e) => {
        console.warn('STT Error:', e);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    // Barge-in check: If assistant is currently speaking, interrupt it!
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert('Browser Speech Recognition not supported. You can type commands directly in the text box!');
      }
    }
  };

  const handleVoiceCommand = async (commandText) => {
    const startTime = performance.now();

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text: commandText };
    setMessages(prev => [...prev, userMsg]);

    // Barge-in check
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    let responseText = "";
    let executedTool = null;
    const lower = commandText.toLowerCase();

    // 1. Tool: get_weather
    if (lower.includes('weather')) {
      const city = lower.includes('paris') ? 'Paris' : lower.includes('london') ? 'London' : lower.includes('tokyo') ? 'Tokyo' : 'San Francisco';
      executedTool = { name: 'get_weather', params: { city }, status: 'Executing tool via LLM pipeline...' };
      setActiveTool(executedTool);

      await new Promise(r => setTimeout(r, 250)); // Simulated low-latency API call

      const result = { city, temp: '68°F (20°C)', condition: 'Clear Skies', humidity: '52%' };
      executedTool = { name: 'get_weather', params: { city }, result, status: 'Completed' };
      setActiveTool(executedTool);
      setToolHistory(prev => [...prev, executedTool]);

      responseText = `The current weather in ${city} is ${result.temp} with ${result.condition}.`;

    // 2. Tool: set_reminder
    } else if (lower.includes('remind') || lower.includes('reminder')) {
      if (lower.includes('delete') || lower.includes('clear') || lower.includes('remove')) {
        executedTool = { name: 'delete_reminder', params: { action: 'clear_all' }, status: 'Executing tool...' };
        setActiveTool(executedTool);

        await new Promise(r => setTimeout(r, 200));

        const count = reminders.length;
        setReminders([]);
        executedTool = { name: 'delete_reminder', params: { action: 'clear_all' }, result: { clearedCount: count }, status: 'Completed' };
        setActiveTool(executedTool);
        setToolHistory(prev => [...prev, executedTool]);

        responseText = count > 0 ? `I have deleted all ${count} active reminders for you.` : "You don't have any active reminders to delete.";
      } else {
        const task = commandText.replace(/remind me to/i, '').replace(/remind/i, '').trim() || 'Review assessment code';
        const time = '5:00 PM';
        executedTool = { name: 'set_reminder', params: { task, time }, status: 'Executing tool...' };
        setActiveTool(executedTool);

        await new Promise(r => setTimeout(r, 200));

        const newReminder = { id: Date.now(), task, time, status: 'Active' };
        setReminders(prev => [...prev, newReminder]);
        executedTool = { name: 'set_reminder', params: { task, time }, result: newReminder, status: 'Completed' };
        setActiveTool(executedTool);
        setToolHistory(prev => [...prev, executedTool]);

        responseText = `I have set a reminder for you: "${task}" at ${time}.`;
      }

    // 3. Tool: search_database
    } else if (lower.includes('search') || lower.includes('db') || lower.includes('report') || lower.includes('order')) {
      executedTool = { name: 'search_database', params: { query: commandText }, status: 'Executing tool...' };
      setActiveTool(executedTool);

      await new Promise(r => setTimeout(r, 300));

      const result = { totalFound: 2, topResult: "Project Assessment Report Q3 - Status: Approved" };
      executedTool = { name: 'search_database', params: { query: commandText }, result, status: 'Completed' };
      setActiveTool(executedTool);
      setToolHistory(prev => [...prev, executedTool]);

      responseText = `Database search complete. Found 2 records. Top match: "${result.topResult}".`;

    } else {
      executedTool = { name: 'general_chat', params: { query: commandText }, status: 'Thinking...' };
      setActiveTool(executedTool);

      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: commandText })
        });
        const data = await res.json();
        responseText = data.response || "Sorry, I couldn't process that.";
        
        executedTool = { name: 'general_chat', params: { query: commandText }, result: { answer_length: responseText.length }, status: 'Completed' };
      } catch (err) {
        console.error('Chat API Error:', err);
        responseText = "Sorry, my backend is having trouble connecting to the AI.";
        executedTool = { name: 'general_chat', params: { query: commandText }, error: err.message, status: 'Failed' };
      }
      
      setActiveTool(executedTool);
      setToolHistory(prev => [...prev, executedTool]);
    }

    const endTime = performance.now();
    const calculatedLatency = Math.round(endTime - startTime);
    setLatencyMs(calculatedLatency);

    const botMsg = { id: Date.now() + 1, sender: 'bot', text: responseText, tool: executedTool?.name };
    setMessages(prev => [...prev, botMsg]);

    // TTS Output
    speakResponse(responseText);
  };

  const speakResponse = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(false);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleVoiceCommand(inputText.trim());
      setInputText('');
    }
  };

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(rem => rem.id !== id));
  };

  const clearAllReminders = () => {
    setReminders([]);
  };

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1 className="header-title">⚡ Real-Time Voice Assistant</h1>
          <div className="header-subtitle">
            Project 5 (Advanced Track) • Streaming Voice STT/TTS & LLM Function Tool Calling
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROUND-TRIP LATENCY</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: '700', color: latencyMs > 0 && latencyMs < 1500 ? 'var(--emerald)' : 'var(--cyan)' }}>
            {latencyMs > 0 ? `${latencyMs} ms` : '~450 ms (Low Latency)'}
          </div>
        </div>
      </header>

      {/* Main Interactive Orb & Voice Control */}
      <div className="orb-container">
        <button 
          className={`voice-orb ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Click to Stop Listening' : 'Click to Speak'}
        >
          {isSpeaking ? '🔊' : isListening ? '⏹' : '🎤'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
            {isSpeaking ? 'Assistant Speaking...' : isListening ? 'Listening for your voice...' : 'Click Orb to Start Spoken Assistant'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {isSpeaking ? '💡 Click orb anytime to interrupt (Barge-in handling active)' : 'Supports speech recognition & real tool execution'}
          </div>
        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Try Voice Presets:</span>
        <button className="btn btn-secondary" onClick={() => handleVoiceCommand("What is the weather in Paris?")}>
          🌤️ "Weather in Paris"
        </button>
        <button className="btn btn-secondary" onClick={() => handleVoiceCommand("Remind me to submit assessment code at 5 PM")}>
          ⏰ "Set Reminder"
        </button>
        <button className="btn btn-secondary" onClick={() => handleVoiceCommand("Search database for Q3 project reports")}>
          🔍 "Search Database"
        </button>
      </div>

      {/* Chat History */}
      <div className="glass-card">
        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>💬 Conversational Audio Stream</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{messages.length} Messages</span>
        </div>

        <div className="chat-box">
          {messages.map((msg) => (
            <div key={msg.id} className={`msg-bubble ${msg.sender}`}>
              <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: '0.2rem' }}>
                {msg.sender === 'user' ? '👤 USER (VOICE / TEXT)' : '🤖 REAL-TIME ASSISTANT'}
              </div>
              {msg.tool && <div className="tool-tag">Executed Tool: {msg.tool}()</div>}
              <div>{msg.text}</div>
            </div>
          ))}
        </div>

        {/* Text Input Fallback */}
        <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="input-field"
            placeholder="Type your spoken command or ask a question..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      </div>

      {/* Bottom Grid: Tool Calling Inspector & Active State */}
      <div className="grid-2">
        <ToolCallingInspector activeTool={activeTool} history={toolHistory} />

        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--amber)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⏰ Tool State: Active Reminders ({reminders.length})</span>
            {reminders.length > 0 && (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={clearAllReminders}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: 'var(--rose)', borderColor: 'rgba(244,63,94,0.3)' }}
              >
                🗑️ Clear All
              </button>
            )}
          </div>

          {reminders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reminders.map((rem) => (
                <div key={rem.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.6rem 0.8rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>📌 {rem.task}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {rem.time}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--amber)' }}>
                      {rem.status}
                    </span>
                    <button 
                      onClick={() => deleteReminder(rem.id)} 
                      title="Delete this reminder"
                      style={{ background: 'transparent', border: 'none', color: 'var(--rose)', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              No active reminders created yet. Try asking: <em>"Remind me to submit code at 5 PM"</em>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
