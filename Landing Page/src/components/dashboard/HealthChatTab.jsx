import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, MessageSquare, Plus, PanelLeftClose, PanelLeft, Edit2, Check, X } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://cortex-agent-472595500035.us-central1.run.app';

export default function HealthChatTab() {
    const { currentUser } = useAuth();
    const [userId] = useState(() => currentUser?.uid || `user_${Math.floor(Math.random() * 10000)}`);

    const defaultMessage = { role: 'model', content: "Hi! I'm Cortex, your AI health companion. How can I help you today? \n\nYou can ask me a health question, take a vital sign assessment, or upload a medical document for me to analyze!" };

    const [sessions, setSessions] = useState([
        { id: Date.now(), title: "Active Session", messages: [defaultMessage] }
    ]);
    const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const messages = activeSession.messages;
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editTitleInput, setEditTitleInput] = useState('');
    const chatContainerRef = useRef(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatInput('');
        setIsTyping(true);

        const updateSession = (newMsg, optionalTitle) => {
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        title: optionalTitle || s.title,
                        messages: [...s.messages, newMsg]
                    };
                }
                return s;
            }));
        };

        const newTitle = activeSession.messages.length === 1
            ? (userMsg.length > 22 ? userMsg.substring(0, 22) + "..." : userMsg)
            : undefined;

        updateSession({ role: 'user', content: userMsg }, newTitle);

        try {
            const assessments = currentUser?.firestoreData?.assessments || [];
            const latestAssessment = assessments.length > 0 ? assessments[0] : null;

            // Only send the history of the current ACTIVE isolated chat session
            const historyPayload = activeSession.messages
                .filter(m => m.role === 'user' || m.role === 'model') // Filter only strict allowed roles
                .map(m => ({ role: m.role, content: m.content }));

            const res = await axios.post(`${API_URL}/chat`, {
                user_id: userId,
                message: userMsg,
                latest_assessment: latestAssessment,
                chat_history: historyPayload
            });
            updateSession({ role: 'model', content: res.data.response });
        } catch (err) {
            updateSession({ role: 'model', content: "Sorry, I'm having trouble connecting to my cognitive servers right now. Please ensure the backend is running on port 8000." });
        } finally {
            setIsTyping(false);
        }
    };

    const handleNewChat = () => {
        if (activeSession.messages.length > 1) {
            const newId = Date.now();
            setSessions(prev => [{ id: newId, title: "New Chat", messages: [defaultMessage] }, ...prev]);
            setActiveSessionId(newId);
        }
    };

    const handleStartEdit = (e, session) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditTitleInput(session.title);
    };

    const handleSaveEdit = (e, sessionId) => {
        e.stopPropagation();
        if (editTitleInput.trim()) {
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editTitleInput.trim() } : s));
        }
        setEditingSessionId(null);
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setEditingSessionId(null);
    };

    return (
        <div className="flex flex-row h-full min-h-[500px] flex-1 w-full rounded-[32px] overflow-hidden relative z-0 transition-all duration-500 hover:shadow-lg"
            style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5)',
            }}>

            {/* Sidebar Chat History */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64 border-r border-white/50' : 'w-0'} bg-white/20 backdrop-blur-md flex flex-col shrink-0 overflow-hidden`}>
                <div className="p-4 flex flex-col h-full w-64 shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 p-3 bg-white/40 hover:bg-white/60 rounded-[16px] text-gray-900 font-bold transition-colors mb-6 border border-white/50 shadow-sm"
                    >
                        <Plus size={18} />
                        New Chat
                    </button>

                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar pr-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2 mt-2">Chat History</div>
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => { if (editingSessionId !== session.id) setActiveSessionId(session.id) }}
                                className={`w-full text-left flex items-center justify-between p-3 rounded-[12px] font-medium transition-colors mb-2 cursor-pointer group ${activeSessionId === session.id
                                    ? 'bg-white/60 border border-[#00DAAA]/30 shadow-sm hover:bg-white/80'
                                    : 'hover:bg-white/40 hover:text-gray-900 border border-transparent'
                                    }`}
                            >
                                {editingSessionId === session.id ? (
                                    <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                        <MessageSquare size={16} className="text-[#00DAAA] shrink-0" />
                                        <input
                                            autoFocus
                                            value={editTitleInput}
                                            onChange={e => setEditTitleInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleSaveEdit(e, session.id);
                                                if (e.key === 'Escape') handleCancelEdit(e);
                                            }}
                                            className="bg-white/80 border border-gray-200 rounded px-2 py-0.5 text-[13px] text-gray-900 w-full focus:outline-none focus:border-[#00DAAA]/50"
                                        />
                                        <button onClick={(e) => handleSaveEdit(e, session.id)} className="p-1 hover:bg-white/80 rounded shrink-0">
                                            <Check size={14} className="text-[#00DAAA]" />
                                        </button>
                                        <button onClick={handleCancelEdit} className="p-1 hover:bg-white/80 rounded shrink-0">
                                            <X size={14} className="text-gray-400" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <MessageSquare size={16} className={activeSessionId === session.id ? 'text-[#00DAAA] shrink-0' : 'text-gray-400 shrink-0'} />
                                            <span className={`truncate text-[13px] ${activeSessionId === session.id ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>{session.title}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleStartEdit(e, session)}
                                            className={`p-1.5 rounded bg-white border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 ${activeSessionId === session.id ? 'visible' : 'hidden group-hover:block'}`}
                                            title="Rename chat"
                                        >
                                            <Edit2 size={12} className="text-gray-500" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 relative min-w-0 bg-white/10">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/50 flex items-center justify-between z-10 relative bg-white/40 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-white/50 hover:text-gray-900 transition-colors"
                        >
                            {sidebarOpen ? <PanelLeftClose size={22} /> : <PanelLeft size={22} />}
                        </button>
                        <div className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-white shadow-sm"
                            style={{ boxShadow: `0 8px 16px rgba(0,218,170,0.2), inset 0 0 0 1px #CCFFF0` }}>
                            <Brain size={22} style={{ color: '#00DAAA' }} />
                        </div>
                        <div>
                            <h2 className="font-outfit font-black text-lg tracking-tight text-gray-900">Health Companion AI</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-[#109981] animate-pulse shadow-[0_0_8px_#109981]" />
                                <span className="text-[10px] font-bold font-mono tracking-widest text-[#109981] uppercase">Cortex AI Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Log */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative z-10 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-full`}>
                            <div className={`flex gap-4 max-w-[85%] lg:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                {msg.role === 'model' && (
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-gray-100">
                                        <Brain size={18} style={{ color: '#00DAAA' }} />
                                    </div>
                                )}

                                <div className={`px-5 py-4 whitespace-pre-wrap leading-relaxed text-[15px] font-medium shadow-sm border border-white/50 backdrop-blur-md ${msg.role === 'user'
                                    ? 'bg-gray-900 text-white rounded-[24px] rounded-tr-md'
                                    : 'bg-white/80 text-gray-800 rounded-[24px] rounded-tl-md chat-markdown'
                                    }`}>
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => <p className="font-bold mt-2 mb-1" {...props} />,
                                            h2: ({ node, ...props }) => <p className="font-bold mt-2 mb-1" {...props} />,
                                            h3: ({ node, ...props }) => <p className="font-bold mt-2 mb-1" {...props} />,
                                            h4: ({ node, ...props }) => <p className="font-bold mt-2 mb-1" {...props} />,
                                            h5: ({ node, ...props }) => <p className="font-bold mt-2 mb-1" {...props} />,
                                            h6: ({ node, ...props }) => <p className="font-bold mt-2 mb-1" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />
                                        }}
                                    >
                                        {msg.content.replace(/#/g, '')}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex gap-4 max-w-[85%]">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-gray-100">
                                    <Brain size={18} style={{ color: '#00DAAA' }} />
                                </div>
                                <div className="px-5 py-4 bg-white/80 border border-white/50 rounded-[24px] rounded-tl-md shadow-sm flex items-center gap-1.5 h-[52px]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00DAAA] animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00DAAA] animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00DAAA] animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 lg:p-6 bg-white/40 border-t border-white/50 relative z-10 backdrop-blur-md">
                    <form onSubmit={handleSendMessage} className="relative flex items-center max-w-5xl mx-auto">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Describe your symptoms or ask a health question..."
                            className="w-full bg-white border border-gray-200 shadow-sm rounded-full py-4 pl-6 pr-16 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00DAAA]/50 focus:ring-4 focus:ring-[#00DAAA]/10 transition-all font-medium"
                            disabled={isTyping}
                        />
                        <button
                            type="submit"
                            disabled={!chatInput.trim() || isTyping}
                            className="absolute right-2 p-3 rounded-full bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:scale-105"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
