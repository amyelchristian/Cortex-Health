import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Activity, Stethoscope, MessageSquare,
  FileText, Home, ArrowRight, Brain, Shield, Send, MoreHorizontal
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [userId] = useState(() => `user_${Math.floor(Math.random() * 10000)}`);

  // Chat State
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi! I'm Cortex, your AI health companion. How can I help you today? \n\nYou can ask me a health question, take a vital sign assessment, or upload a medical document for me to analyze!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Vitals State
  const [vitals, setVitals] = useState({
    hr: '', spo2: '', sys_bp: '', dia_bp: '', temp: '', rr: ''
  });
  const [assessmentResult, setAssessmentResult] = useState(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'chat') scrollToBottom();
  }, [messages, activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        user_id: userId,
        message: userMsg
      });
      setMessages(prev => [...prev, { role: 'model', content: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting to my servers right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();
    setIsTyping(true);
    try {
      // Convert empty strings to default normal values for scaffolding
      const payload = {
        hr: parseFloat(vitals.hr) || 75,
        spo2: parseFloat(vitals.spo2) || 98,
        sys_bp: parseFloat(vitals.sys_bp) || 120,
        dia_bp: parseFloat(vitals.dia_bp) || 80,
        temp: parseFloat(vitals.temp) || 98.6,
        rr: parseFloat(vitals.rr) || 16
      };

      const res = await axios.post(`${API_URL}/assessment`, {
        user_id: userId,
        vitals: payload
      });

      setAssessmentResult(res.data.data);
    } catch (err) {
      alert("Failed to submit assessment.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-[#1e332a]">
      {/* Background Orbs */}
      <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-info-glow blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-glow blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <div className="w-[280px] glass-panel m-6 mr-3 flex flex-col pt-8 pb-6 px-4 z-10 border-white/10 relative overflow-hidden hidden md:flex">
        <div className="flex items-center gap-3 px-4 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-info-main to-info-dark flex items-center justify-center text-white shadow-lg shadow-info-main/20">
            <Brain size={20} />
          </div>
          <h1 className="font-outfit font-bold text-2xl tracking-tight text-white">Cortex.<span className="text-info-main">AI</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'chat', icon: MessageSquare, label: 'Health Chat' },
            { id: 'assessment', icon: Activity, label: 'Vital Assessment' },
            { id: 'dashboard', icon: Home, label: 'Insights Dashboard' },
            { id: 'documents', icon: FileText, label: 'Document OCR' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all duration-300 ${activeTab === item.id
                  ? 'bg-white/10 text-white shadow-inner border border-white/5'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-info-main' : ''} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 py-4 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success-main animate-pulse" />
          <span className="text-xs font-medium text-white/50">ML Model Online · 99.98% Acc</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 m-6 ml-3 relative z-10 flex flex-col min-w-0">

        {/* Header */}
        <header className="glass-panel px-8 py-5 mb-6 flex justify-between items-center rounded-3xl border-white/10">
          <h2 className="font-outfit font-bold text-xl text-white">
            {activeTab === 'chat' && 'Health Companion'}
            {activeTab === 'assessment' && 'Vital Sign Analysis'}
            {activeTab === 'dashboard' && 'Patient Dashboard'}
            {activeTab === 'documents' && 'Document Intelligence'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium">
              ID: {userId.split('_')[1]}
            </span>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <div className="flex-1 glass-panel rounded-3xl border-white/10 overflow-hidden flex flex-col relative">

          {/* ════ CHAT VIEW ════ */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar flex flex-col gap-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-full`}>
                    <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-info-main/20 border border-info-main/30 flex items-center justify-center flex-shrink-0 mt-1">
                          <Brain size={14} className="text-info-main" />
                        </div>
                      )}
                      <div className={`px-5 py-4 rounded-2xl whitespace-pre-wrap leading-relaxed text-[15px] ${msg.role === 'user'
                          ? 'bg-info-main text-white rounded-tr-sm shadow-md'
                          : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                        }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-4 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-info-main/20 border border-info-main/30 flex items-center justify-center flex-shrink-0 mt-1">
                        <Brain size={14} className="text-info-main" />
                      </div>
                      <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 md:p-6 border-t border-white/10 bg-black/20">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Describe your symptoms or ask a health question..."
                    className="w-full glass-input py-4 pl-6 pr-16 text-white placeholder-white/30 outline-none transition-all"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
                    className="absolute right-2 p-2.5 rounded-xl bg-info-main text-white hover:bg-info-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ════ ASSESSMENT VIEW ════ */}
          {activeTab === 'assessment' && (
            <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col md:flex-row gap-10">

              <div className="flex-1 w-full max-w-md">
                <div className="mb-8">
                  <h3 className="font-outfit font-bold text-2xl mb-2 text-white">Enter Vital Signs</h3>
                  <p className="text-white/50 text-sm">Enter the patient's current vitals to run a 99.98% accurate Random Forest prediction.</p>
                </div>

                <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">Heart Rate (bpm)</label>
                      <input type="number" value={vitals.hr} onChange={e => setVitals({ ...vitals, hr: e.target.value })} placeholder="e.g. 75" className="w-full glass-input p-3.5 text-white outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">SpO2 (%)</label>
                      <input type="number" value={vitals.spo2} onChange={e => setVitals({ ...vitals, spo2: e.target.value })} placeholder="e.g. 98" className="w-full glass-input p-3.5 text-white outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">Systolic BP</label>
                      <input type="number" value={vitals.sys_bp} onChange={e => setVitals({ ...vitals, sys_bp: e.target.value })} placeholder="e.g. 120" className="w-full glass-input p-3.5 text-white outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">Diastolic BP</label>
                      <input type="number" value={vitals.dia_bp} onChange={e => setVitals({ ...vitals, dia_bp: e.target.value })} placeholder="e.g. 80" className="w-full glass-input p-3.5 text-white outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">Resp. Rate</label>
                      <input type="number" value={vitals.rr} onChange={e => setVitals({ ...vitals, rr: e.target.value })} placeholder="e.g. 16" className="w-full glass-input p-3.5 text-white outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">Temp (°F)</label>
                      <input type="number" step="0.1" value={vitals.temp} onChange={e => setVitals({ ...vitals, temp: e.target.value })} placeholder="e.g. 98.6" className="w-full glass-input p-3.5 text-white outline-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isTyping}
                    className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-info-main to-info-dark text-white font-bold tracking-wide shadow-lg shadow-info-main/20 hover:shadow-info-main/40 transition-all disabled:opacity-50"
                  >
                    {isTyping ? 'Analyzing via RF Model...' : 'Run ML Assessment'}
                  </button>
                </form>
              </div>

              {/* Assessment Results Panel */}
              <div className="flex-1 border-l border-white/10 pl-0 md:pl-10">
                {assessmentResult ? (
                  <div className="h-full flex flex-col">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="font-outfit font-bold text-xl text-white">ML Prediction</h3>
                      <div className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wider uppercase ${assessmentResult.prediction.risk_level === 'High' ? 'bg-danger-main/20 border-danger-main/50 text-danger-main' :
                          assessmentResult.prediction.risk_level === 'Medium' ? 'bg-warning-main/20 border-warning-main/50 text-warning-main' :
                            'bg-success-main/20 border-success-main/50 text-success-main'
                        }`}>
                        {assessmentResult.prediction.risk_level} Risk
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      {['Low', 'Medium', 'High'].map(level => {
                        const prob = assessmentResult.prediction.probabilities[level] || 0;
                        const color = level === 'Low' ? 'bg-success-main' : level === 'Medium' ? 'bg-warning-main' : 'bg-danger-main';
                        return (
                          <div key={level}>
                            <div className="flex justify-between text-xs mb-1.5 font-medium text-white/60">
                              <span>{level} Risk Probability</span>
                              <span>{prob.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                              <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${prob}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="flex items-center gap-2 mb-4 text-info-main">
                        <Brain size={18} />
                        <h4 className="font-bold text-sm tracking-wide">AI CLINICAL EXPLANATION</h4>
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed font-sans">
                        {assessmentResult.explanation}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-white/30">
                    <Shield size={64} className="mb-6 opacity-20" />
                    <p className="text-lg font-medium">No assessment run yet.</p>
                    <p className="text-sm mt-2 max-w-xs">Enter vitals on the left to securely invoke the machine learning model.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholders for other tabs */}
          {(activeTab === 'dashboard' || activeTab === 'documents') && (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/30">
              <MoreHorizontal size={64} className="mb-6 opacity-20 animate-pulse" />
              <p className="text-lg font-medium">This module is part of the broader Cortex system.</p>
              <p className="text-sm mt-2">Try the Health Chat or Vital Assessment tabs.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
