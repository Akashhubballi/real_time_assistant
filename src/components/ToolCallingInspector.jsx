import React from 'react';

export default function ToolCallingInspector({ activeTool, history }) {
  return (
    <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>⚙️ LLM Function / Tool Calling Log</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--emerald)' }}>Active Inspector</span>
      </div>

      {activeTool ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '0.85rem', borderRadius: '8px', borderLeft: '3px solid var(--cyan)', marginBottom: '1rem' }}>
          <div style={{ color: 'var(--pink)', marginBottom: '0.3rem' }}>Function: <strong>{activeTool.name}()</strong></div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Status: <span style={{ color: 'var(--emerald)', fontWeight: '600' }}>{activeTool.status}</span></div>
          <div style={{ color: '#a5b4fc' }}>Params: {JSON.stringify(activeTool.params, null, 2)}</div>
          {activeTool.result && (
            <div style={{ color: 'var(--emerald)', marginTop: '0.4rem' }}>Result: {JSON.stringify(activeTool.result, null, 2)}</div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
          No active tool call. Try asking: <em>"What's the weather in London?"</em> or <em>"Remind me to submit code at 6 PM"</em>.
        </div>
      )}

      {history && history.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.4rem' }}>
            RECENT TOOL EXECUTIONS ({history.length}):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {history.slice(-3).map((item, idx) => (
              <div key={idx} style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.6rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--indigo)' }}>{item.name}()</span>
                <span style={{ color: 'var(--emerald)' }}>✔ Success</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
