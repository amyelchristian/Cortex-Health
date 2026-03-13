import React, { useState, useRef, useEffect } from 'react';
import { Database, ShieldCheck, Activity, Clock, FileText, Download, Lock, CheckCircle2, Search, Fingerprint, AlertCircle, UploadCloud, Server, Key, EyeOff, Trash2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
/* ── Ultra-Premium Design Palette ── */
const P = {
    danger: { main: '#EF4A4A', light: '#FEE2E2', dark: '#95161B', glow: 'rgba(239,86,86,0.2)', gradient: 'linear-gradient(135deg, rgba(239,86,86,0.1) 0%, rgba(239,86,86,0.02) 100%)' },
    warning: { main: '#F68E0B', light: '#FEF3C7', dark: '#82400E', glow: 'rgba(245,158,11,0.2)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%)' },
    success: { main: '#109981', light: '#D1FAE5', dark: '#065F46', glow: 'rgba(19,165,129,0.2)', gradient: 'linear-gradient(135deg, rgba(16,153,129,0.1) 0%, rgba(16,153,129,0.02) 100%)' },
    info: { main: '#00DAAA', light: '#CCFFF0', dark: '#008A6E', glow: 'rgba(0,218,170,0.2)', gradient: 'linear-gradient(135deg, rgba(0,218,170,0.1) 0%, rgba(0,218,170,0.02) 100%)' },
    purple: { main: '#8B5CF6', light: '#EDE9FE', dark: '#5B21B6', glow: 'rgba(139,92,246,0.2)', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 100%)' },
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

const SecurityPolicyCard = ({ label, description, icon: Icon, isOn, onChange, disabled }) => (
    <div className={`flex items-start gap-4 p-5 rounded-[20px] transition-all duration-300 relative overflow-hidden group cursor-pointer ${disabled ? 'opacity-90' : 'hover:-translate-y-1'}`}
        style={{
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)',
            border: `1px solid ${isOn ? 'rgba(16,153,129,0.3)' : 'rgba(255,255,255,0.8)'}`,
            boxShadow: isOn ? '0 8px 24px rgba(16,153,129,0.1)' : '0 4px 16px rgba(0,0,0,0.02)'
        }}
        onClick={() => !disabled && onChange(!isOn)}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-colors duration-300 ${isOn ? 'bg-success-main' : 'bg-transparent'}`} style={{ background: isOn ? P.success.main : 'transparent' }} />
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{ background: isOn ? P.success.main + '20' : 'rgba(255,255,255,0.8)', color: isOn ? P.success.dark : '#9ca3af', boxShadow: isOn ? `0 0 16px ${P.success.glow}` : 'none' }}>
            <Icon size={20} strokeWidth={2} />
        </div>
        <div className="flex flex-col flex-1 mt-0.5">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-gray-900 text-[15px] font-outfit font-bold tracking-tight">{label}</span>
                <div className={`w-[42px] h-[24px] rounded-full p-[3px] transition-colors duration-300 relative flex items-center shrink-0`}
                    style={{ background: isOn ? P.success.main : 'rgba(0,0,0,0.1)' }}>
                    <div className={`w-[18px] h-[18px] rounded-full shadow-sm transition-transform duration-300 bg-white ${isOn ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </div>
            </div>
            <span className="text-gray-500 text-xs font-medium leading-relaxed pr-2">{description}</span>
        </div>
    </div>
);

/* ── Data ── */

export default function DatabaseTab({ displayName, database, documents }) {
    const [search, setSearch] = useState('');
    const [secureEnclave, setSecureEnclave] = useState(true);
    const [e2eEncryption, setE2eEncryption] = useState(true);
    const [anonymizeData, setAnonymizeData] = useState(true);
    const [isFetchingLog, setIsFetchingLog] = useState('idle');
    const [isUploading, setIsUploading] = useState(false);
    const [fetchedDocs, setFetchedDocs] = useState([]);
    const [deletedDocIds, setDeletedDocIds] = useState([]);
    const fileInputRef = useRef(null);
    const { currentUser } = useAuth();
    const userId = currentUser?.uid || `user_${Math.floor(Math.random() * 10000)}`;

    const fetchDocs = async () => {
        try {
            const res = await axios.get(`https://cortex-agent-472595500035.us-central1.run.app/documents?user_id=${userId}`);
            if (res.data && res.data.documents) {
                setFetchedDocs(res.data.documents);
            }
        } catch (err) {
            console.error("Failed to fetch documents:", err);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, [userId]);

    const handleFilesUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('user_id', userId);
                formData.append('file', file);

                await axios.post('https://cortex-agent-472595500035.us-central1.run.app/upload-document', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            alert(`Successfully uploaded ${files.length} documents for analysis!`);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Failed to upload some documents. Ensure the backend is running.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            // Refresh documents list after upload
            await fetchDocs();
        }
    };

    const handleDeleteDocument = async (docId, fileName) => {
        if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

        try {
            await axios.delete(`https://cortex-agent-472595500035.us-central1.run.app/documents/${docId}?user_id=${userId}`);
        } catch (error) {
            console.error('Error deleting document from backend:', error);
        }
        
        setDeletedDocIds(prev => [...prev, docId]);
    };

    const safeStats = database?.stats || [];
    const safeHistory = database?.history || [];
    const safeDocs = (fetchedDocs.length > 0 ? fetchedDocs : (documents || [])).filter(doc => !deletedDocIds.includes(doc.id));

    const getIcon = (type) => {
        switch (type) {
            case 'assessments': return Database;
            case 'status': return ShieldCheck;
            case 'biometrics': return Activity;
            case 'scan': return Clock;
            default: return Database;
        }
    };

    const filtered = safeDocs.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        String(r.id).toLowerCase().includes(search.toLowerCase())
    );

    const handleAuditClick = async () => {
        if (isFetchingLog !== 'idle') return;
        setIsFetchingLog('fetching');
        setTimeout(() => setIsFetchingLog('success'), 1500); // Mocking email for UI testing
        setTimeout(() => setIsFetchingLog('idle'), 4500);
    };

    return (
        <div className="relative flex flex-col gap-6 flex-1 w-full z-0 font-inter min-h-full">
            {/* ── Ultra-Premium Header Banner ── */}
            <div className="relative z-10 rounded-[28px] p-6 lg:p-8 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                style={{
                    background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 12px 48px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5)',
                }}>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success-main to-success-dark flex items-center justify-center text-white shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #109981, #065F46)', boxShadow: `0 8px 24px ${P.success.glow}` }}>
                        <Database size={26} />
                    </div>
                    <div>
                        <h2 className="text-gray-900 font-outfit font-black text-3xl tracking-tight">Data & Privacy Vault</h2>
                        <p className="text-gray-500 text-sm font-medium tracking-wide mt-1">Manage your secure hospital records and system privacy.</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {safeStats.map((s, i) => {
                    const p = P[s.palette] || P.info;
                    const Icon = getIcon(s.type);
                    return (
                        <div key={i} className="rounded-[24px] p-6 flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 group overflow-hidden relative min-h-[140px]"
                            style={{
                                background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
                                animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`, animationDelay: `${i * 100}ms`,
                            }}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700 blur-[20px]" style={{ background: p.main }} />

                            <div className="flex items-center justify-between z-10 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 bg-white"
                                    style={{ boxShadow: `0 8px 16px ${p.glow}, inset 0 0 0 1px ${p.light}` }}>
                                    <Icon size={18} style={{ color: p.main }} />
                                </div>
                                <div className="px-2 py-1 rounded-full border bg-white/50 backdrop-blur-sm" style={{ borderColor: p.main + '20' }}>
                                    <span className="text-[9px] font-black font-mono tracking-widest uppercase" style={{ color: p.dark }}>{s.delta}</span>
                                </div>
                            </div>
                            <div className="z-10 mt-auto">
                                <p className="text-3xl font-outfit font-black tracking-tight leading-none text-gray-900 drop-shadow-sm mb-1">{s.value}</p>
                                <p className="text-xs font-bold text-gray-500 tracking-wide">{s.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* ── Left Column: Medical Records & Timeline ── */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Upload Document Card */}
                    <div className="rounded-[32px] p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer transition-all duration-500 hover:-translate-y-1 block"
                        style={{
                            background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 12px 48px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5)',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.xml,.json,.dicom" multiple onChange={handleFilesUpload} disabled={isUploading} />

                        <div className="w-full rounded-[24px] border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center relative z-10 group-hover:bg-white/60"
                            style={{ borderColor: `${P.info.main}40`, backgroundColor: 'rgba(255,255,255,0.4)' }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white bg-white relative overflow-hidden transition-all duration-300 group-hover:scale-110 mb-5"
                                style={{ boxShadow: `0 8px 24px ${P.info.glow}` }}>
                                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${P.info.main}10, transparent)` }} />
                                <UploadCloud size={28} style={{ color: P.info.main }} className="relative z-10 drop-shadow-sm" />
                            </div>
                            <h3 className="text-gray-900 font-outfit font-black text-xl tracking-tight mb-2">Upload Medical Record</h3>
                            <p className="text-gray-500 text-sm font-medium tracking-wide text-center max-w-sm mb-6">
                                Drag and drop or browse to add PDF, XML, or DICOM files to your end-to-end encrypted vault.
                            </p>
                            <button className={`px-8 py-3.5 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-md flex items-center justify-center gap-2 hover:shadow-lg ${isUploading ? 'opacity-70 cursor-wait' : ''}`}
                                style={{ background: 'linear-gradient(135deg, #00DAAA, #008A6E)', boxShadow: `0 8px 24px ${P.info.glow}` }}
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                disabled={isUploading}
                            >
                                <span>{isUploading ? 'Encrypting & Uploading...' : 'Browse Files'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Medical Records Vault */}
                    <div className="rounded-[32px] overflow-hidden flex flex-col relative"
                        style={{
                            background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 12px 48px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5)',
                        }}>
                        <div className="p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/50">
                            <div>
                                <h3 className="text-gray-900 font-outfit font-black text-xl tracking-tight">Medical Records</h3>
                                <p className="text-gray-500 text-xs font-medium mt-1 tracking-wide">Access encrypted hospital reports</p>
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-full border-none text-sm focus:outline-none transition-all duration-300 placeholder:text-gray-400 font-inter"
                                    style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col bg-white/20">
                            {filtered.length > 0 ? filtered.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-white/50 last:border-0 hover:bg-white/40 transition-colors group">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <FileText size={18} className="text-info-main" style={{ color: P.info.main }} />
                                        </div>
                                        <div className="min-w-0 pr-4">
                                            <h4 className="font-outfit font-bold text-gray-900 text-sm truncate">{doc.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">DOC-{String(doc.id).padStart(4, '0')}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                <span className="text-[11px] font-medium text-gray-500">{doc.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="hidden sm:flex flex-col items-end">
                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white text-gray-500 border border-gray-100 uppercase">{doc.type || 'PDF'}</span>
                                            <span className="text-[10px] text-gray-400 font-medium mt-1">{doc.size || '1.2 MB'}</span>
                                        </div>
                                        <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-info-main hover:border-info-main/30 shadow-sm transition-all duration-200">
                                            <Download size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-red-500 hover:border-red-500/30 shadow-sm transition-all duration-200"
                                            title="Delete Document"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                    <FileText size={32} className="opacity-40 mb-3" />
                                    <p className="font-medium text-sm">No records found matching "{search}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-[32px] p-6 lg:p-8 flex flex-col relative overflow-hidden"
                        style={{
                            background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 12px 48px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.5)',
                        }}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-white"
                                style={{ boxShadow: `0 8px 16px ${P.warning.glow}, inset 0 0 0 1px ${P.warning.light}` }}>
                                <Activity size={18} style={{ color: P.warning.main }} />
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-outfit font-black text-xl tracking-tight">Cortex Activity</h3>
                            </div>
                        </div>

                        <div className="flex flex-col gap-0 pr-2">
                            {safeHistory.map((entry, i) => {
                                const p = P[entry.status] || P.info;
                                const isLast = i === safeHistory.length - 1;
                                return (
                                    <div key={i} className="flex items-stretch gap-4 group cursor-pointer">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 rounded-full bg-white border-2 z-10 relative mt-2 transition-transform duration-300 group-hover:scale-150"
                                                style={{ borderColor: p.main, boxShadow: `0 0 8px ${p.glow}` }} />
                                            {!isLast && <div className="w-0.5 flex-1 my-1 rounded-full opacity-30" style={{ background: `linear-gradient(to bottom, ${p.main}, transparent)` }} />}
                                        </div>
                                        <div className="flex-1 pb-6 group-hover:-translate-y-1 transition-transform duration-300">
                                            <div className="bg-white/50 backdrop-blur-md border border-white p-4 rounded-[20px] shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:bg-white/80">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-[14px] font-bold text-gray-900 font-outfit">{entry.title}</h4>
                                                    <span className="text-[10px] text-gray-400 font-mono font-bold bg-white px-2 py-0.5 rounded shadow-sm">{entry.time}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium">{entry.detail}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Security Center ── */}
                <div className="rounded-[32px] overflow-hidden flex flex-col relative h-full group pb-6"
                    style={{
                        background: '#000000', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                        border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}>
                    <div className="absolute -right-20 top-0 w-80 h-80 rounded-full opacity-[0.15] pointer-events-none transition-all duration-1000"
                        style={{ background: `radial-gradient(circle, ${P.success.main}, transparent 60%)`, filter: 'blur(60px)' }} />
                    <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                    <div className="p-8 pb-6 relative z-10 border-b border-white/10">
                        <div className="flex items-center justify-between mb-5">
                            <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center shadow-lg"
                                style={{ boxShadow: `0 8px 24px ${P.success.glow}` }}>
                                <ShieldCheck size={24} style={{ color: P.success.main }} />
                            </div>
                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10"
                                style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: P.success.main, boxShadow: `0 0 8px ${P.success.main}` }} />
                                <span className="text-[10px] font-bold font-mono tracking-[0.1em] text-white/90">SECURE ENCLAVE</span>
                            </div>
                        </div>
                        <h3 className="text-white font-outfit font-black text-2xl tracking-tight leading-tight">Security & Privacy</h3>
                        <p className="text-gray-400 text-xs font-inter mt-2 tracking-wide leading-relaxed">
                            Configure how the hospital infrastructure handles and encrypts your clinical data.
                        </p>
                    </div>

                    <div className="p-6 flex-1 relative z-10 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Policies</span>
                            <span className="text-[9px] font-mono font-bold text-success-main tracking-wider" style={{ color: P.success.main }}>SYcned</span>
                        </div>

                        {/* Dark Mode Version of Policy Cards */}
                        <div className="space-y-3">
                            {[
                                { icon: Server, label: "Local Processing", desc: "Data processed inside hospital walls.", on: secureEnclave, set: setSecureEnclave, locked: true },
                                { icon: Key, label: "E2E Encryption", desc: "AES-256 bit storage encryption.", on: e2eEncryption, set: setE2eEncryption, locked: true },
                                { icon: EyeOff, label: "Anonymize Data", desc: "Strip PII before machine learning.", on: anonymizeData, set: setAnonymizeData, locked: false }
                            ].map((item, i) => (
                                <div key={i} className={`flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 relative overflow-hidden bg-white/5 border border-white/10 ${!item.locked && 'cursor-pointer hover:bg-white/10 hover:border-white/20'}`}
                                    onClick={() => !item.locked && item.set(!item.on)}>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/5" style={{ color: item.on ? P.success.main : '#9ca3af' }}>
                                        <item.icon size={16} />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white text-sm font-outfit font-bold">{item.label}</span>
                                            <div className="w-8 h-4 rounded-full p-0.5 transition-colors relative" style={{ background: item.on ? P.success.main : 'rgba(255,255,255,0.2)' }}>
                                                <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-300 ${item.on ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                        <span className="text-gray-400 text-[11px] leading-tight">{item.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="px-8 pt-4 flex items-center justify-center gap-6 relative z-10 border-t border-white/10 mx-4">
                        <div className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors cursor-help">
                            <Lock size={12} /> <span className="text-[10px] font-bold font-mono uppercase tracking-widest">HIPAA</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors cursor-help">
                            <ShieldCheck size={12} /> <span className="text-[10px] font-bold font-mono uppercase tracking-widest">SOC-2</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
