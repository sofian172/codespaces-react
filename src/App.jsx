import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const initialChats = [
  { id: 1, title: 'Welcome to Agentic AI', preview: 'Build, inspect and automate from one workspace.' },
  { id: 2, title: 'MINEMODS project', preview: 'Ready to work with your repository.' },
];

const skills = [
  ['🧠', 'Planner', 'Break a task into clear steps'],
  ['💻', 'Coder', 'Write and improve code'],
  ['🔎', 'Researcher', 'Analyze files and sources'],
  ['🚀', 'Deployer', 'Prepare Vercel deployments'],
];

function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('agentic-unlocked') === '1');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [chats, setChats] = useState(() => JSON.parse(localStorage.getItem('agentic-chats') || 'null') || initialChats);
  const [files, setFiles] = useState([]);
  const [terminal, setTerminal] = useState(['Agentic terminal ready.', 'Type help for available safe commands.']);
  const fileRef = useRef(null);

  useEffect(() => localStorage.setItem('agentic-chats', JSON.stringify(chats)), [chats]);
  const greeting = useMemo(() => 'مرحباً! 👋 أنا Agentic AI. أقدر أساعدك في التخطيط، البرمجة، تحليل الملفات وتجهيز مشاريعك.', []);

  async function unlock(e) {
    e.preventDefault();
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const value = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (value === 'fcf86bffbafa46c8c9d12c5c85a4ba8455a2cd67df466f9e448c002e2f977471') {
      sessionStorage.setItem('agentic-unlocked', '1');
      setUnlocked(true);
    } else { setPassword(''); alert('كلمة المرور غير صحيحة'); }
  }

  async function sendMessage(text = message) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...messages, { role: 'user', content: clean }];
    setMessages(next); setMessage(''); setBusy(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next, files }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر الاتصال بالخادم');
      setMessages((m) => [...m, { role: 'assistant', content: data.text }]);
      if (messages.length === 0) setChats((items) => [{ id: Date.now(), title: clean.slice(0, 34), preview: clean }, ...items].slice(0, 20));
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${err.message}\n\nأضف AI_GATEWAY_API_KEY في Vercel Environment Variables لتفعيل النموذج.` }]);
    } finally { setBusy(false); }
  }

  function uploadFiles(e) {
    [...e.target.files].forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setFiles((f) => [...f, { name: file.name, content: String(reader.result).slice(0, 50000) }]);
      reader.readAsText(file);
    });
    e.target.value = '';
  }

  async function runTerminal() {
    const input = window.prompt('اكتب أمراً آمناً مثل: help أو pwd أو ls');
    if (!input) return;
    const res = await fetch('/api/terminal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: input }) });
    const data = await res.json();
    setTerminal((t) => [...t, `$ ${input}`, data.output || data.error]); setTab('terminal');
  }

  if (!unlocked) return <main className="lock-screen"><div className="lock-card"><div className="brand-mark">✦</div><h1>Agentic AI</h1><p>مساحة ذكاء اصطناعي للمشاريع والبرمجة.</p><form onSubmit={unlock}><input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور"/><button>دخول</button></form><small>الوصول محمي</small></div></main>;

  return <div className="app-shell" dir="rtl">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark small-mark">✦</span><div><strong>Agentic AI</strong><small>Workspace</small></div></div>
      <button className="new-chat" onClick={() => { setMessages([]); setTab('chat'); }}>＋ محادثة جديدة</button>
      <div className="side-label">Recent chats</div>
      <div className="chat-list">{chats.map((chat) => <button key={chat.id} className="chat-item" onClick={() => setTab('chat')}><b>{chat.title}</b><span>{chat.preview}</span></button>)}</div>
      <div className="side-label">Skills</div>
      <div className="skills">{skills.map(([icon, name, desc]) => <button key={name} onClick={() => { setTab('chat'); setMessage(`استخدم مهارة ${name}: ${desc}`); }}><span>{icon}</span><div><b>{name}</b><small>{desc}</small></div></button>)}</div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><span className="status-dot"/> Online <span className="divider">·</span> GPT-5.2 Fast</div><button onClick={() => alert('Connections: GitHub و Vercel — التوكنات يجب أن تبقى server-side.')}>⚙️</button></header>
      {tab === 'chat' && <main className="chat-page">
        <div className="hero"><div className="hero-icon">✦</div><h2>What can I build for you?</h2><p>{greeting}</p></div>
        <div className="messages">{messages.map((m, i) => <div key={i} className={`bubble ${m.role}`}><span className="role">{m.role === 'user' ? 'أنت' : 'Agentic AI'}</span><div>{m.content}</div></div>)}{busy && <div className="bubble assistant"><span className="role">Agentic AI</span><div className="typing"><i/><i/><i/></div></div>}</div>
        <div className="composer"><div className="composer-tools"><button onClick={() => fileRef.current?.click()}>📎 ملف</button><button onClick={runTerminal}>⌘ Terminal</button>{files.length > 0 && <span>{files.length} ملف</span>}</div><textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="اكتب أي شيء…"/><button className="send" onClick={() => sendMessage()} disabled={busy}>↑</button><input ref={fileRef} hidden type="file" multiple onChange={uploadFiles}/></div>
        <div className="quick-actions"><button onClick={() => sendMessage('حلل المشروع الحالي واقترح خطة تطوير.')}>🔍 Analyze project</button><button onClick={() => sendMessage('أنشئ خطة تنفيذ لهذه الفكرة خطوة بخطوة.')}>✨ Plan a task</button><button onClick={() => setTab('terminal')}>⌘ Open terminal</button></div>
      </main>}
      {tab === 'terminal' && <main className="panel"><div className="panel-head"><div><h2>Terminal</h2><p>بيئة أوامر آمنة ومحدودة داخل الموقع.</p></div><button onClick={runTerminal}>＋ Run command</button></div><pre className="terminal">{terminal.join('\n')}</pre></main>}
      {tab === 'files' && <main className="panel"><div className="panel-head"><div><h2>Files</h2><p>الملفات المرفقة بهذه الجلسة.</p></div><button onClick={() => fileRef.current?.click()}>＋ Add files</button></div><div className="file-grid">{files.length ? files.map((f, i) => <div className="file-card" key={i}>📄 <b>{f.name}</b><button onClick={() => setFiles((all) => all.filter((_, n) => n !== i))}>×</button></div>) : <div className="empty">لم تتم إضافة ملفات بعد.</div>}</div><input ref={fileRef} hidden type="file" multiple onChange={uploadFiles}/></main>}
      <nav className="bottom-nav"><button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>💬<span>Chat</span></button><button className={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>📁<span>Files</span></button><button className={tab === 'terminal' ? 'active' : ''} onClick={() => setTab('terminal')}>⌘<span>Terminal</span></button><button onClick={() => alert('Connections جاهزة للربط مع GitHub و Vercel عبر توكنات server-side.')}>🔗<span>Connect</span></button></nav>
    </section>
  </div>;
}

export default App;
