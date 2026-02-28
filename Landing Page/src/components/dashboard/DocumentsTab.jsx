import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    Search, FileText, FlaskConical, ScanLine, ClipboardList, FileDown,
    Sparkles, Calendar, MoreHorizontal, CheckCircle2, Clock, FilePlus2,
    Download, Share2, AlertTriangle, Activity, User, Hash, FileCheck,
    Stethoscope, Printer, TrendingUp, Eye, ArrowRight, Files
} from 'lucide-react';

/* ── Ultra-Premium Design Palette ── */
const P = {
    danger: { main: '#EF4A4A', light: '#FEE2E2', dark: '#95161B', glow: 'rgba(239,86,86,0.2)', gradient: 'linear-gradient(135deg, rgba(239,86,86,0.1) 0%, rgba(239,86,86,0.02) 100%)' },
    warning: { main: '#F68E0B', light: '#FEF3C7', dark: '#82400E', glow: 'rgba(245,158,11,0.2)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%)' },
    success: { main: '#109981', light: '#D1FAE5', dark: '#065F46', glow: 'rgba(19,165,129,0.2)', gradient: 'linear-gradient(135deg, rgba(16,153,129,0.1) 0%, rgba(16,153,129,0.02) 100%)' },
    info: { main: '#00DAAA', light: '#CCFFF0', dark: '#008A6E', glow: 'rgba(0,218,170,0.2)', gradient: 'linear-gradient(135deg, rgba(0,218,170,0.1) 0%, rgba(0,218,170,0.02) 100%)' },
    purple: { main: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6', glow: 'rgba(139,92,246,0.2)', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 100%)' },
};

/* ── Category Config ── */
const categories = ['All', 'Labs', 'Imaging', 'Clinical Notes', 'Medications', 'Discharge'];
const catIcons = { 'Labs': FlaskConical, 'Imaging': ScanLine, 'Clinical Notes': ClipboardList, 'Medications': Activity, 'Discharge': FileDown };
const catPalette = { 'Labs': 'danger', 'Imaging': 'warning', 'Clinical Notes': 'info', 'Medications': 'purple', 'Discharge': 'success' };

/* ── Document Data ── */

/* ── Status Config ── */
const urgencyConfig = {
    Critical: { color: P.danger.main, bg: 'rgba(239,86,86,0.15)', label: 'CRITICAL' },
    High: { color: P.warning.main, bg: 'rgba(245,158,11,0.15)', label: 'HIGH' },
    Medium: { color: P.info.main, bg: 'rgba(0,218,170,0.15)', label: 'MEDIUM' },
    Low: { color: P.success.main, bg: 'rgba(16,153,129,0.15)', label: 'LOW' },
};
const statusConfig = {
    Reviewed: { color: P.success.dark, bg: P.success.light, border: P.success.main, dot: P.success.main },
    Pending: { color: P.warning.dark, bg: P.warning.light, border: P.warning.main, dot: P.warning.main },
    Draft: { color: P.info.dark, bg: P.info.light, border: P.info.main, dot: P.info.main },
};

/* ── Helper Components ── */
const AmbientMeshBackground = () => (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-[32px] pointer-events-none opacity-50">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"
            style={{ background: 'rgba(204, 255, 240, 0.6)', animationDuration: '8s' }} />
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full mix-blend-multiply filter blur-[90px] animate-pulse"
            style={{ background: 'rgba(237, 233, 254, 0.6)', animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] animate-pulse"
            style={{ background: 'rgba(209, 250, 229, 0.5)', animationDuration: '12s', animationDelay: '4s' }} />
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
    </div>
);

const PremiumProgressRing = ({ value, max, color, size = 48 }) => {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - (value / Math.max(max, 1)));
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <defs>
                <filter id={`glow-${color.replace('#', '')}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="4" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" filter={`url(#glow-${color.replace('#', '')})`}
                className="transition-all duration-[1s] ease-out" />
        </svg>
    );
};

/* ══════════════════════════════════════════
   DocumentsTab Component
   ══════════════════════════════════════════ */
export default function DocumentsTab({ displayName, documents: propDocs }) {
    const { currentUser } = useAuth();
    const userId = currentUser?.uid || `user_${Math.floor(Math.random() * 10000)}`;
    const firstName = displayName?.split(' ')[0] || 'User';
    const [filter, setFilter] = useState('All');
    const [selectedId, setSelectedId] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [fetchedDocs, setFetchedDocs] = useState([]);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/documents?user_id=${userId}`);
                if (res.data && res.data.documents) {
                    setFetchedDocs(res.data.documents);
                }
            } catch (err) {
                console.error("Failed to fetch documents:", err);
            }
        };
        fetchDocs();
    }, [userId]);

    const safeDocs = fetchedDocs.length > 0 ? fetchedDocs : (propDocs || []);

    const filtered = useMemo(() => safeDocs.filter(d => {
        const matchCat = filter === 'All' || d.category === filter;
        const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    }), [filter, searchQuery, safeDocs]);

    const stats = useMemo(() => [
        { label: 'Total Records', value: safeDocs.length, icon: Files, palette: 'info', max: Math.max(1, safeDocs.length) },
        { label: 'Recent Updates', value: safeDocs.filter(d => d.isRecent).length, icon: Sparkles, palette: 'success', max: Math.max(1, safeDocs.length) },
        { label: 'Action Needed', value: safeDocs.filter(d => d.requiresAction).length, icon: AlertTriangle, palette: 'warning', max: Math.max(1, safeDocs.length) },
        { label: 'Shared', value: safeDocs.filter(d => d.isShared).length, icon: Share2, palette: 'purple', max: Math.max(1, safeDocs.length) },
    ], [safeDocs]);

    const selectedDoc = safeDocs.find(d => d.id === selectedId) || safeDocs[0];
    const selP = P[catPalette[selectedDoc?.category]] || P.info;
    const SelIcon = catIcons[selectedDoc?.category] || FileText;
    const aiBullets = selectedDoc?.summary.split('. ').filter(s => s.trim().length > 0).map(s => s.endsWith('.') ? s : s + '.') || [];

    return (
        <div className="relative flex flex-col gap-7 flex-1 w-full z-0 font-inter min-h-full">
            <AmbientMeshBackground />

            {/* ═══════════ Section Header Banner ═══════════ */}
            <div className="relative z-10 rounded-[32px] p-8 lg:p-10 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5)',
                }}>
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-info-main to-info-dark flex items-center justify-center text-white shadow-lg shadow-info-main/20">
                        <FileText size={30} />
                    </div>
                    <div>
                        <h2 className="text-gray-900 font-outfit font-black text-4xl tracking-tight">Clinical Documents</h2>
                        <p className="text-gray-500 text-[15px] font-medium tracking-wide mt-1.5">
                            Welcome back, {firstName} · {safeDocs.length} secure records available
                        </p>
                    </div>
                </div>
                <div className="px-5 py-2.5 rounded-full border border-white/40 flex items-center gap-2.5"
                    style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)' }}>
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: P.success.main, boxShadow: `0 0 8px ${P.success.main}` }} />
                    <span className="text-xs font-bold font-mono tracking-widest text-gray-700 uppercase">Synced 4m ago</span>
                </div>
            </div>

            {/* ═══════════ Ultra-Premium Stats Row ═══════════ */}
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s, i) => {
                    const p = P[s.palette];
                    const Icon = s.icon;
                    return (
                        <div key={i} className="rounded-[28px] p-7 flex items-center gap-6 transition-all duration-500 hover:-translate-y-1.5 group overflow-hidden relative"
                            style={{
                                background: 'rgba(255, 255, 255, 0.65)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255, 255, 255, 0.8)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
                                animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
                                animationDelay: `${i * 100}ms`,
                            }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700 blur-[20px]"
                                style={{ background: p.main }} />

                            <div className="relative flex-shrink-0 z-10">
                                <PremiumProgressRing value={s.value} max={s.max} color={p.main} size={60} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Icon size={22} style={{ color: p.main }} className="group-hover:scale-110 transition-transform duration-300" />
                                </div>
                            </div>
                            <div className="z-10">
                                <p className="text-[2.25rem] font-outfit font-black tracking-tight leading-none mb-1.5 text-gray-900 drop-shadow-sm">{s.value}</p>
                                <p className="text-sm font-bold text-gray-500 tracking-wide">{s.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══════════ Filters ═══════════ */}
            <div className="relative z-10 flex flex-col md:flex-row gap-5 items-center justify-between">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full shadow-sm border border-gray-100 bg-white"
                    style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }}>
                    {categories.map(cat => {
                        const isActive = filter === cat;
                        return (
                            <button key={cat} onClick={() => setFilter(cat)}
                                className={`px-5 lg:px-6 py-2.5 rounded-full text-[15px] font-medium transition-all duration-200 ${isActive ? 'bg-[#1c1c1c] text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                style={isActive && catPalette[cat] ? {
                                    // Optionally tint the text based on category when active, or keep it white
                                    // as they requested the SAME styling as the navbar, let's keep it strictly identical to the navbar's black/white theme
                                    background: '#1c1c1c', color: 'white'
                                } : {}}>
                                {cat}
                            </button>
                        );
                    })}
                </div>
                <div className="relative w-full md:w-72">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-5 py-3 rounded-full border-none text-[15px] focus:outline-none transition-all duration-300 placeholder:text-gray-400 font-inter"
                        style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                    />
                </div>
            </div>

            {/* ═══════════ Content Area ═══════════ */}
            <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-7 flex-1">

                {/* Left: Document List */}
                <div className="xl:col-span-2 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar min-h-[500px]">
                    {filtered.map((d, idx) => {
                        const dp = P[catPalette[d.category]] || P.info;
                        const Icon = catIcons[d.category] || FileText;
                        const isSelected = selectedId === d.id;
                        const sc = statusConfig[d.status];

                        return (
                            <div key={d.id} onClick={() => setSelectedId(d.id)}
                                className="rounded-[28px] p-6 cursor-pointer transition-all duration-300 group hover:-translate-y-1"
                                style={{
                                    background: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                                    backdropFilter: 'blur(24px)',
                                    WebkitBackdropFilter: 'blur(24px)',
                                    border: `1px solid ${isSelected ? dp.main + '40' : 'rgba(255,255,255,0.8)'}`,
                                    boxShadow: isSelected ? `0 12px 32px ${dp.glow}, 0 0 0 2px ${dp.main}10` : '0 4px 16px rgba(0,0,0,0.02)',
                                }}>
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                                        style={{ background: isSelected ? dp.main + '20' : 'white', boxShadow: isSelected ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <Icon size={24} style={{ color: dp.main }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <h4 className="font-outfit font-bold text-gray-900 text-lg truncate">{d.title}</h4>
                                            {isSelected && <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: dp.main }}><Eye size={14} /> Viewing</div>}
                                        </div>
                                        <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed mb-3.5">{d.summary}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg" style={{ background: dp.main + '15', color: dp.dark }}>{d.category}</span>
                                                <span className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5"
                                                    style={{ color: sc.color, background: sc.bg, borderColor: sc.border + '30' }}>
                                                    <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} /> {d.status}
                                                </span>
                                            </div>
                                            <div className="text-xs font-medium text-gray-400 flex items-center gap-2"><Calendar size={14} /> {d.date}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Dark Frosted Preview Pane */}
                <div className="rounded-[32px] p-7 lg:p-9 flex flex-col relative overflow-hidden group min-h-[500px]"
                    style={{
                        background: '#000000',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}>
                    <div className="absolute -right-20 top-0 w-96 h-96 rounded-full opacity-[0.15] pointer-events-none transition-all duration-1000"
                        style={{ background: `radial-gradient(circle, ${selP.main}, transparent 60%)`, filter: 'blur(60px)' }} />
                    <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                    {selectedDoc ? (
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-5 mb-7 pb-7 border-b border-white/10">
                                <div className="w-16 h-16 rounded-[18px] flex items-center justify-center bg-white/5 border border-white/10" style={{ boxShadow: `0 8px 24px ${selP.glow}` }}>
                                    <SelIcon size={28} style={{ color: selP.main }} />
                                </div>
                                <div>
                                    <h3 className="text-white font-outfit font-black text-2xl tracking-tight leading-tight">{selectedDoc.title}</h3>
                                    <p className="text-gray-400 text-[13px] font-mono mt-1.5 tracking-wide">{selectedDoc.category} · {selectedDoc.date}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-7">
                                {/* Badges */}
                                <div className="flex flex-wrap gap-2.5">
                                    <span className="text-[11px] font-mono font-bold px-3.5 py-2 rounded-full border flex items-center gap-2"
                                        style={{ color: statusConfig[selectedDoc.status]?.color, background: 'rgba(255,255,255,0.05)', borderColor: statusConfig[selectedDoc.status]?.border + '40' }}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusConfig[selectedDoc.status]?.dot }} /> {selectedDoc.status}
                                    </span>
                                    {selectedDoc.urgency && (
                                        <span className="text-[11px] font-mono font-bold px-3.5 py-2 rounded-full flex items-center gap-2"
                                            style={{ color: urgencyConfig[selectedDoc.urgency]?.color, background: urgencyConfig[selectedDoc.urgency]?.bg }}>
                                            <AlertTriangle size={14} /> {urgencyConfig[selectedDoc.urgency]?.label}
                                        </span>
                                    )}
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { icon: User, label: 'Physician', value: selectedDoc.physician },
                                        { icon: Hash, label: 'Doc ID', value: `DOC-${String(selectedDoc.id).padStart(4, '0')}` },
                                    ].map((m, i) => (
                                        <div key={i} className="p-4 rounded-[18px] bg-white/5 border border-white/10 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><m.icon size={16} className="text-gray-300" /></div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{m.label}</p>
                                                <p className="text-[13px] text-white font-medium truncate">{m.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* AI Findings */}
                                <div>
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <Sparkles size={16} style={{ color: P.info.main }} />
                                        <span className="text-[13px] font-outfit font-bold tracking-wide text-white">AI Extraction</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {aiBullets.map((bullet, i) => (
                                            <div key={i} className="flex items-start gap-3.5 p-4 rounded-[18px] border border-white/5 bg-white/[0.02]">
                                                <ArrowRight size={16} className="mt-0.5 flex-shrink-0" style={{ color: selP.main }} />
                                                <span className="text-gray-300 text-[13px] leading-relaxed font-medium">{bullet}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-7 pt-7 border-t border-white/10">
                                <button onClick={async () => {
                                    try {
                                        await axios.post('http://localhost:8000/documents/share', { user_id: userId, doc_id: selectedDoc.id });
                                        setFetchedDocs(prev => prev.map(doc => doc.id === selectedDoc.id ? { ...doc, isShared: true } : doc));
                                        alert("Document securely shared with your registered care team!");
                                    } catch (err) {
                                        alert("Error sharing. Please try again.");
                                        console.error(err);
                                    }
                                }} className="w-full py-4.5 px-2 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
                                    style={{ background: selectedDoc.isShared ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                                    <Share2 size={20} /> {selectedDoc.isShared ? "Shared with Care Team" : "Share Clinical Portal"}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
