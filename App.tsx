import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Sparkles, PenTool, Video, Calendar, BarChart3, MessageSquare, Settings, Plus,
  ChevronRight, TrendingUp, TrendingDown, Clock, CheckCircle2, Instagram, Youtube, Smartphone, Zap, Star, Search,
  Type as TypeIcon, Image as ImageIcon, Wand2, Mic, StopCircle, RefreshCw, ExternalLink, BrainCircuit,
  Save, Copy, Wand, ArrowRight, Play, Check, Menu, X, Globe, Layers, Rocket, Flame, LayoutGrid, Timer, CreditCard, User, LogOut, Mail, Lock, Loader2, ShieldCheck, Trash2, Camera, Upload, Eye, ListFilter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

// Internal modules
import { Platform, CreatorType, Niche, UserProfile, VideoIdea, SubscriptionPlan, ScriptArchetype } from './types';
import { 
  generateHooksWithSearch, 
  generateProImage, 
  editImageWithFlash, 
  complexCoachAdvice,
  analyzeMedia,
  generateScript,
  getNicheTrends
} from './geminiService';
import { 
  auth, 
  signInUser, 
  signUpUser, 
  logoutUser, 
  getProfile, 
  saveProfile, 
  updateProfile,
  getIdeas,
  addIdea,
  deleteIdea
} from './firebaseService';
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// --- Helper Functions for Live API ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Shared UI Components ---
const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
    <Icon size={20} /> <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className = "", ...props }: { children?: React.ReactNode, className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-[#151518] border border-[#26262B] rounded-2xl p-6 transition-all ${className}`} {...props}>{children}</div>
);

const Badge = ({ children, color = "purple", ...props }: { children?: React.ReactNode, color?: string } & React.HTMLAttributes<HTMLSpanElement>) => {
  const colors: any = {
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    zinc: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${colors[color]}`} {...props}>{children}</span>;
};

// --- New Feature Components ---

const TrendTicker = ({ niche }: { niche: string }) => {
  const [trends, setTrends] = useState<string[]>([]);
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await getNicheTrends(niche);
        setTrends(data);
      } catch (e) { console.error(e); }
    };
    fetchTrends();
  }, [niche]);

  if (trends.length === 0) return null;

  return (
    <div className="bg-purple-600/10 border-y border-purple-500/20 py-2 overflow-hidden whitespace-nowrap relative">
      <div className="flex animate-[scroll_30s_linear_infinite] gap-10">
        {[...trends, ...trends].map((trend, i) => (
          <div key={i} className="flex items-center gap-2">
            <Flame size={14} className="text-purple-500 fill-current" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{trend}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

const CalendarFlowView = ({ ideas, onAction }: { ideas: VideoIdea[], onAction: (view: string) => void }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  
  const getDayIdeas = (offset: number) => {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + offset);
    const dateStr = targetDate.toISOString().split('T')[0];
    return ideas.filter(i => i.scheduledAt?.startsWith(dateStr));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">Weekly Flow</h2>
        <div className="flex gap-2">
           <Badge color="zinc">October 2024</Badge>
           <button onClick={() => onAction('hooks')} className="bg-purple-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16} /> Schedule Video</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-4">
        {[0, 1, 2, 3, 4, 5, 6].map(offset => {
          const date = new Date();
          date.setDate(today.getDate() + offset);
          const dayIdeas = getDayIdeas(offset);
          const isToday = offset === 0;

          return (
            <div key={offset} className={`flex flex-col gap-4 min-h-[400px]`}>
              <div className={`p-4 rounded-xl text-center border ${isToday ? 'bg-purple-600 border-purple-500' : 'bg-zinc-900 border-zinc-800'}`}>
                <p className={`text-xs font-black uppercase ${isToday ? 'text-white' : 'text-zinc-500'}`}>{days[date.getDay()]}</p>
                <p className={`text-xl font-black ${isToday ? 'text-white' : 'text-white'}`}>{date.getDate()}</p>
              </div>
              <div className="flex-1 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 p-2 space-y-2">
                {dayIdeas.length > 0 ? dayIdeas.map(idea => (
                  <div key={idea.id} className="bg-[#151518] border border-zinc-800 rounded-xl p-3 shadow-sm group hover:border-purple-500 transition-all cursor-pointer">
                    <Badge color={idea.status === 'ready' ? 'green' : 'blue'}>{idea.status}</Badge>
                    <h4 className="text-xs font-bold mt-2 line-clamp-2">{idea.title}</h4>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-500">
                      <Clock size={10} /> 10:00 AM
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center opacity-20">
                    <Plus size={24} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Auth Components ---
const AuthView = ({ mode, onSwitch, onSuccess }: { mode: 'login' | 'signup', onSwitch: (m: 'login' | 'signup') => void, onSuccess: (user: FirebaseUser) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const user = await signUpUser(email, password, name);
        onSuccess(user);
      } else {
        const user = await signInUser(email, password);
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0A0B] animate-in fade-in zoom-in duration-500">
      <Card className="w-full max-w-md p-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-purple-600 p-3 rounded-xl mb-4"><Zap size={24} className="fill-white" /></div>
          <h2 className="text-3xl font-black">{mode === 'login' ? 'Welcome Back' : 'Join the Flow'}</h2>
          <p className="text-zinc-500">{mode === 'login' ? 'Sign in to manage your empire.' : 'Start your viral journey today.'}</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-500 text-sm font-bold flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-rose-500" />
             {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase px-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 focus:border-purple-500 outline-none transition-all" />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase px-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        <div className="text-center">
          <p className="text-zinc-500 text-sm">{mode === 'login' ? "Don't have an account?" : "Already have an account?"} <button onClick={() => onSwitch(mode === 'login' ? 'signup' : 'login')} className="ml-2 text-purple-400 font-bold hover:text-purple-300">{mode === 'login' ? 'Sign Up' : 'Log In'}</button></p>
        </div>
      </Card>
    </div>
  );
};

// --- View Components ---

const PricingView = ({ currentPlan, onPlanSelect }: { currentPlan?: SubscriptionPlan, onPlanSelect: (plan: SubscriptionPlan) => void }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const plans: { name: SubscriptionPlan, price: string, description: string, features: string[], highlight?: boolean }[] = [
    { name: "Starter", price: "0", description: "For creators just starting their journey.", features: ["3 Videos / month", "Gemini 3 Flash access", "Basic Hook Generator", "Community Support"], },
    { name: "Pro", price: "49", description: "The complete viral content engine.", features: ["Unlimited Videos", "Gemini 3 Pro Reasoning", "4K Image Generation", "Auto-Scheduling", "Growth Coach Access"], highlight: true },
    { name: "Studio", price: "199", description: "Scalable content for teams and brands.", features: ["Multiple Accounts", "API Access", "Dedicated Growth Strategist", "Custom AI Fine-tuning", "Priority Processing"], }
  ];
  const handleSelect = async (plan: SubscriptionPlan) => {
    setLoading(plan);
    try { await onPlanSelect(plan); } catch (e) { console.error(e); } finally { setLoading(null); }
  };
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4"><h2 className="text-4xl font-black">Choose your viral engine.</h2><p className="text-zinc-500 text-lg max-w-xl mx-auto">Scale your reach with more processing power and advanced AI models.</p></div>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, i) => {
          const isCurrent = currentPlan === plan.name || (!currentPlan && plan.name === 'Starter');
          return (
            <Card key={i} className={`flex flex-col justify-between p-8 space-y-8 relative ${plan.highlight ? 'border-purple-500 bg-purple-600/5 shadow-2xl shadow-purple-600/10' : ''}`}>
              {plan.highlight && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div><h3 className="text-2xl font-bold">{plan.name}</h3><p className="text-zinc-500 text-sm mt-1">{plan.description}</p></div>
                  {isCurrent && <ShieldCheck className="text-purple-500" size={24} />}
                </div>
                <div className="flex items-baseline gap-1"><span className="text-5xl font-black">${plan.price}</span><span className="text-zinc-500 font-bold">/mo</span></div>
                <div className="space-y-3 pt-4">{plan.features.map((feature, j) => (<div key={j} className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircle2 size={16} className="text-emerald-500" />{feature}</div>))}</div>
              </div>
              <button onClick={() => !isCurrent && handleSelect(plan.name)} disabled={isCurrent || !!loading} className={`w-full py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${isCurrent ? 'bg-zinc-800 text-zinc-500 cursor-default' : plan.highlight ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30' : 'bg-white/5 hover:bg-white/10'}`}>
                {loading === plan.name ? <Loader2 className="animate-spin" size={20} /> : (isCurrent ? 'Active Plan' : `Upgrade to ${plan.name}`)}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const SettingsView = ({ profile, onUpdateProfile, onLogout }: { profile: UserProfile | null, onUpdateProfile: (p: UserProfile) => void, onLogout: () => void }) => {
  const [formData, setFormData] = useState<UserProfile>(profile || { name: '', platforms: [], creatorType: 'Personal Brand', niche: [], plan: 'Starter' });
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await saveProfile(auth.currentUser.uid, formData);
        onUpdateProfile(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between"><h2 className="text-3xl font-black">Creator Profile</h2><button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-bold hover:bg-rose-500 hover:text-white transition-all"><LogOut size={18} /> Log Out</button></div>
      <div className="grid gap-8">
        <Card className="space-y-6">
          <div className="flex items-center gap-4 border-b border-[#26262B] pb-6"><div className="w-20 h-20 rounded-3xl bg-purple-600 flex items-center justify-center text-white text-3xl font-black">{formData.name.charAt(0) || 'C'}</div><div><div className="flex items-center gap-3"><h3 className="text-xl font-bold">{formData.name || 'Set your name'}</h3>{formData.plan && formData.plan !== 'Starter' && <Badge color="purple">{formData.plan}</Badge>}</div><p className="text-zinc-500 text-sm">{formData.creatorType} • {formData.niche.join(', ') || 'No niche set'}</p></div></div>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Display Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Creator Type</label><select value={formData.creatorType} onChange={e => setFormData({...formData, creatorType: e.target.value as CreatorType})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none">{['Personal Brand', 'Business', 'Coach', 'Influencer', 'Faceless Channel'].map(t => (<option key={t} value={t}>{t}</option>))}</select></div>
          </div>
        </Card>
        <div className="flex justify-end gap-4"><button onClick={handleSave} disabled={loading} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={20} /> : (isSaved ? <Check size={20} /> : <Save size={20} />)}{isSaved ? 'Saved!' : 'Save Changes'}</button></div>
      </div>
    </div>
  );
};

const DashboardView = ({ userProfile, ideas, onDeleteIdea, onAction }: { userProfile: UserProfile, ideas: VideoIdea[], onDeleteIdea: (id: string) => void, onAction: (view: string) => void }) => {
  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="relative overflow-hidden group border-purple-500/20 bg-gradient-to-br from-[#1A1A1E] to-purple-950/20 p-10 md:p-14">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] -z-10 group-hover:bg-purple-600/20 transition-all"></div>
        <div className="max-w-xl space-y-6">
          <Badge color="purple">Direct Content Access</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Create your next <br />viral video</h1>
          <p className="text-zinc-400 text-lg font-medium">Optimized for TikTok, Reels & Shorts. Use Gemini 3 to turn ideas into high-retention content.</p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button onClick={() => onAction('generator')} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 group/btn"><Zap size={20} className="fill-current" />Generate Video<ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" /></button>
            <button onClick={() => onAction('audit')} className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"><Eye size={20} />Audit content</button>
          </div>
        </div>
      </Card>
      
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2"><h3 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="text-purple-500" size={20} />Performance Snapshot</h3><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">vs. Previous Week</span></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[ { label: "Total Views", value: "142.8K", previous: "126.9K", trend: 12.5, positive: true }, { label: "Engagement Rate", value: "8.42%", previous: "8.27%", trend: 1.8, positive: true }, { label: "Viral Reach", value: "64.2K", previous: "67.0K", trend: -4.2, positive: false } ].map((metric, i) => (
            <Card key={i} className="flex flex-col justify-between py-8 hover:border-zinc-700 group transition-all">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 group-hover:text-purple-400 transition-colors">{metric.label}</p>
              <div className="space-y-2">
                <div className="flex items-end justify-between"><span className="text-4xl font-black tracking-tight">{metric.value}</span><div className={`flex items-center gap-1 text-sm font-bold ${metric.positive ? 'text-emerald-500' : 'text-rose-500'}`}>{metric.positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}<span>{Math.abs(metric.trend)}%</span></div></div>
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider pt-2 border-t border-white/5"><span>Previous</span><span className="text-zinc-400">{metric.previous}</span></div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2"><h3 className="text-xl font-bold">Recent Creations</h3><button onClick={() => onAction('calendar')} className="text-xs font-bold text-purple-400 uppercase tracking-widest hover:text-purple-300">View Pipeline</button></div>
        <div className="grid gap-4">
          {ideas.length > 0 ? ideas.map((idea) => (
            <Card key={idea.id} className="p-4 flex flex-col md:flex-row items-center gap-6 group/item hover:bg-zinc-900/20">
              <div className="w-full md:w-20 aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden border border-white/5 relative flex-shrink-0"><img src={`https://picsum.photos/seed/${idea.id}/200/360`} className="w-full h-full object-cover opacity-50" /><div className="absolute inset-0 flex items-center justify-center"><Play size={20} className="text-white/40" /></div></div>
              <div className="flex-1 space-y-1 w-full text-left">
                <div className="flex items-center gap-2"><Badge color={idea.status === 'ready' ? 'green' : 'blue'}>{idea.status}</Badge><div className="flex gap-1"><Instagram size={12} className="text-zinc-600" /><Youtube size={12} className="text-zinc-600" /></div></div>
                <h4 className="font-bold text-lg">{idea.title}</h4>
                <p className="text-zinc-500 text-sm italic line-clamp-1">"{idea.hook}"</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto md:opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button onClick={() => onDeleteIdea(idea.id)} className="p-3 bg-zinc-900 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                <button className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"><Copy size={16} /></button>
                <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm">Open</button>
              </div>
            </Card>
          )) : (
            <Card className="p-16 text-center space-y-4 border-dashed border-2 bg-transparent border-zinc-800"><div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700"><PenTool size={24} /></div><div><h4 className="text-lg font-bold">No saved content yet.</h4><p className="text-zinc-500 text-sm">Start by generating some viral hooks or scripts.</p></div><button onClick={() => onAction('hooks')} className="px-8 py-3 bg-purple-600 rounded-xl font-bold">Start Creating</button></Card>
          )}
        </div>
      </section>
    </div>
  );
};

function AuditView() {
  const [file, setFile] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (re) => setFile(re.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await analyzeMedia(file, 'image/png');
      setAnalysis(result || 'No analysis available.');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="space-y-6 flex flex-col justify-center items-center border-dashed border-2 border-zinc-800 bg-transparent min-h-[400px]">
          {file ? (
            <div className="relative group w-full h-full flex flex-col items-center">
              <img src={file} className="max-h-[300px] rounded-xl shadow-2xl mb-4" />
              <button onClick={() => setFile(null)} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-rose-500 transition-colors"><X size={16} /></button>
              <button onClick={handleAnalyze} disabled={loading} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40">
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Eye size={20} />} Run AI Audit
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-600"><Upload size={24} /></div>
              <div><h4 className="font-bold text-lg">Drop thumbnail or frame</h4><p className="text-zinc-500 text-sm">Upload media for viral potential audit</p></div>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-sm">Select File</button>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleUpload} />
            </div>
          )}
        </Card>
        <Card className="min-h-[400px] flex flex-col bg-[#151518]/50 overflow-hidden border-zinc-800">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between"><h3 className="font-bold text-zinc-400">Audit Results</h3>{analysis && <Badge color="green">Complete</Badge>}</div>
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {analysis ? <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap animate-fade-in">{analysis}</div> : <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center"><Sparkles size={48} className="mb-4" /><p>Your audit analysis will appear here after processing.</p></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CoachView() {
  const [chat, setChat] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveActive, setLiveActive] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(new Array(10).fill(10));
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chat]);

  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      let nextStartTime = 0;
      const sources = new Set<AudioBufferSourceNode>();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setLiveActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              // Update visual waveform
              const avg = inputData.reduce((a, b) => a + Math.abs(b), 0) / l;
              setWaveform(prev => [...prev.slice(1), 5 + avg * 100]);
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64Audio) {
              nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTime);
              nextStartTime += buffer.duration;
              sources.add(source);
            }
            if (msg.serverContent?.interrupted) {
              sources.forEach(s => s.stop());
              sources.clear();
              nextStartTime = 0;
            }
          },
          onclose: () => setLiveActive(false),
          onerror: (e) => { console.error(e); setLiveActive(false); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "You are a world-class viral growth consultant. Use deep reasoning to provide strategy. Keep responses concise and energetic."
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e) { console.error("Live failed", e); }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
    setLiveActive(false);
  };

  const handleSend = async () => {
    if (!input) return;
    const msg = input; setInput('');
    setChat(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const response = await complexCoachAdvice([], msg);
      setChat(prev => [...prev, { role: 'ai', text: response || 'No response.' }]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 flex flex-col h-[70vh]">
      <Card className="flex-1 flex flex-col overflow-hidden p-0 border-zinc-800 relative">
        <div className="p-6 border-b border-zinc-800 bg-[#151518] flex items-center justify-between">
           <h3 className="font-bold text-lg">Growth Consultant</h3>
           <div className="flex items-center gap-4">
              {!liveActive ? (
                <button onClick={startLiveSession} className="px-4 py-2 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-purple-600 hover:text-white transition-all">
                  <Mic size={14} /> Live Session
                </button>
              ) : (
                <button onClick={stopLiveSession} className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-rose-500 hover:text-white transition-all">
                  <StopCircle size={14} /> Stop Session
                </button>
              )}
           </div>
        </div>

        {liveActive && (
          <div className="absolute inset-0 z-20 bg-[#0A0A0B]/90 backdrop-blur-xl flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-purple-600 flex items-center justify-center text-white relative z-10 shadow-2xl shadow-purple-600/40">
                <Mic size={48} />
              </div>
              <div className="absolute inset-0 bg-purple-600 rounded-full pulse-ring" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-xl font-black text-white">Live Strategy Session</h4>
              <p className="text-zinc-500">I'm listening. Ask anything about your content growth.</p>
            </div>
            <div className="flex items-end gap-1 h-12">
              {waveform.map((h, i) => (
                <div key={i} className="w-2 bg-purple-500 rounded-full waveform-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
            <button onClick={stopLiveSession} className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-xl shadow-rose-900/20 transition-all">End Session</button>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-start"><div className="max-w-[80%] px-5 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300">Hello! I'm your viral growth coach. How can I help you dominate the algorithm today?</div></div>
          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-5 py-3 rounded-2xl ${m.role === 'user' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>{m.text}</div>
            </div>
          ))}
          {loading && <div className="text-zinc-600 text-sm italic animate-pulse">Coach is thinking...</div>}
        </div>
        <div className="p-6 border-t border-zinc-800 bg-[#151518] flex gap-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask for strategy, analytics analysis, or trend alerts..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all" />
          <button onClick={handleSend} disabled={loading} className="bg-purple-600 hover:bg-purple-500 p-3 rounded-xl transition-all shadow-lg shadow-purple-600/20"><ArrowRight /></button>
        </div>
      </Card>
    </div>
  );
}

// --- Landing Page & Onboarding Views ---

const LandingPage = ({ onStart, onLogin }: { onStart: () => void, onLogin: () => void }) => (
  <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700">
    <div className="bg-purple-600 p-4 rounded-3xl shadow-2xl shadow-purple-600/20 mb-4 animate-bounce">
      <Zap size={48} className="text-white fill-white" />
    </div>
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-tight">
        Master the <br /><span className="text-purple-500">Algorithm.</span>
      </h1>
      <p className="text-zinc-400 text-xl font-medium">
        The all-in-one AI content engine for creators who want to go viral on TikTok, Reels, and Shorts.
      </p>
    </div>
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
      <button onClick={onStart} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-600/30 active:scale-95">Get Started Free</button>
      <button onClick={onLogin} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all active:scale-95">Log In</button>
    </div>
  </div>
);

const Onboarding = ({ step, initialProfile, onNext, onComplete }: { step: number, initialProfile: UserProfile, onNext: () => void, onComplete: (p: UserProfile) => void }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const platforms: Platform[] = ['TikTok', 'Instagram', 'YouTube'];
  const niches: Niche[] = ['AI', 'Finance', 'Fitness', 'Motivation', 'Education', 'Ecommerce', 'Tech', 'Lifestyle'];
  const creatorTypes: CreatorType[] = ['Personal Brand', 'Business', 'Coach', 'Influencer', 'Faceless Channel'];

  const togglePlatform = (p: Platform) => {
    setProfile(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(item => item !== p) : [...prev.platforms, p]
    }));
  };

  const toggleNiche = (n: Niche) => {
    setProfile(prev => ({
      ...prev,
      niche: prev.niche.includes(n) ? prev.niche.filter(item => item !== n) : [...prev.niche, n]
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 text-center">
            <h2 className="text-4xl font-black">Welcome to ViralFlow</h2>
            <p className="text-zinc-500 text-lg">Let's set up your creator command center in 30 seconds.</p>
            <button onClick={onNext} className="px-12 py-4 bg-purple-600 rounded-2xl font-black">Let's Go</button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2"><h2 className="text-3xl font-black">Which platforms?</h2><p className="text-zinc-500">Where do you want to dominate?</p></div>
            <div className="grid grid-cols-3 gap-4">
              {platforms.map(p => (
                <button key={p} onClick={() => togglePlatform(p)} className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${profile.platforms.includes(p) ? 'border-purple-500 bg-purple-600/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}>
                  {p === 'Instagram' ? <Instagram /> : p === 'YouTube' ? <Youtube /> : <Smartphone />}
                  <span className="font-bold">{p}</span>
                </button>
              ))}
            </div>
            <button disabled={profile.platforms.length === 0} onClick={onNext} className="w-full py-4 bg-purple-600 rounded-2xl font-black disabled:opacity-50">Next</button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2"><h2 className="text-3xl font-black">What's your style?</h2><p className="text-zinc-500">Define your creator archetype.</p></div>
            <div className="grid gap-3">
              {creatorTypes.map(t => (
                <button key={t} onClick={() => setProfile({...profile, creatorType: t})} className={`p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${profile.creatorType === t ? 'border-purple-500 bg-purple-600/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}>
                  <span className="font-bold">{t}</span>
                  {profile.creatorType === t && <CheckCircle2 className="text-purple-500" size={18} />}
                </button>
              ))}
            </div>
            <button onClick={onNext} className="w-full py-4 bg-purple-600 rounded-2xl font-black">Next</button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2"><h2 className="text-3xl font-black">Choose your niche</h2><p className="text-zinc-500">Pick up to 3 topics you focus on.</p></div>
            <div className="grid grid-cols-2 gap-3">
              {niches.map(n => (
                <button key={n} onClick={() => toggleNiche(n)} className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${profile.niche.includes(n) ? 'border-purple-500 bg-purple-600/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}>
                  <div className={`w-3 h-3 rounded-full ${profile.niche.includes(n) ? 'bg-purple-500' : 'bg-zinc-800'}`} />
                  <span className="font-bold text-sm">{n}</span>
                </button>
              ))}
            </div>
            <button disabled={profile.niche.length === 0} onClick={onNext} className="w-full py-4 bg-purple-600 rounded-2xl font-black disabled:opacity-50">Almost Done</button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500"><Check size={40} /></div>
            <h2 className="text-4xl font-black">Ready to scale!</h2>
            <p className="text-zinc-500">Your profile is optimized. Let's create your first viral video.</p>
            <button onClick={() => onComplete(profile)} className="w-full py-4 bg-purple-600 rounded-2xl font-black">Enter Dashboard</button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-10">
        <div className="flex justify-center gap-2 mb-10">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-purple-600' : i < step ? 'w-4 bg-zinc-700' : 'w-2 bg-zinc-900'}`} />
          ))}
        </div>
        {renderStep()}
      </Card>
    </div>
  );
};

// --- Content Creation Views ---

const HookGeneratorView = ({ userProfile, onSaveIdea }: { userProfile: UserProfile, onSaveIdea: (idea: any) => void }) => {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState<Niche>(userProfile.niche[0] || 'AI');
  const [loading, setLoading] = useState(false);
  const [hooks, setHooks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const { results, sources: s } = await generateHooksWithSearch(topic, niche);
      setHooks(results);
      setSources(s);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="p-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Video Topic or Keyword</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., How to start an AI business in 2024" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 focus:border-purple-500 outline-none text-lg font-medium transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Niche</label>
            <select value={niche} onChange={e => setNiche(e.target.value as Niche)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 focus:border-purple-500 outline-none text-lg font-medium">
              {['AI', 'Finance', 'Fitness', 'Motivation', 'Education', 'Ecommerce', 'Tech', 'Lifestyle'].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading || !topic} className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-lg transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-3">
          {loading ? <RefreshCw className="animate-spin" /> : <Sparkles className="fill-current" />}
          {loading ? 'Analyzing Trends...' : 'Generate Viral Hooks'}
        </button>
      </Card>

      {hooks.length > 0 && (
        <div className="grid gap-6">
          {hooks.map((hook, i) => (
            <Card key={i} className="group hover:border-purple-500/50 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge color="purple">{hook.type}</Badge>
                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm"><Flame size={14} /> {hook.viralityScore}% Viral Potential</div>
                  </div>
                  <p className="text-xl font-bold leading-relaxed">"{hook.text}"</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onSaveIdea({ title: topic, hook: hook.text, viralityScore: hook.viralityScore, status: 'idea' })} className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-bold border border-white/5 transition-all flex items-center gap-2"><Plus size={18} /> Save Idea</button>
                  <button className="p-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-lg shadow-purple-900/20"><ArrowRight size={20} /></button>
                </div>
              </div>
            </Card>
          ))}
          {sources.length > 0 && (
            <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
               <p className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><Globe size={14} /> Research Citations</p>
               <div className="flex flex-wrap gap-2">
                 {sources.map((s: any, idx) => (
                   <a key={idx} href={s.web?.uri} target="_blank" rel="noreferrer" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/5 px-3 py-1.5 rounded-full border border-purple-500/10">
                     {s.web?.title || 'Source'} <ExternalLink size={10} />
                   </a>
                 ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ScriptBuilderView = ({ onSaveIdea }: { onSaveIdea: (idea: any) => void }) => {
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [archetype, setArchetype] = useState<ScriptArchetype>('Storyteller');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title || !hook) return;
    setLoading(true);
    try {
      const result = await generateScript(title, hook, archetype);
      setScript(result || '');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const archetypes: ScriptArchetype[] = ['Storyteller', 'Tutorial', 'Myth-Buster', 'Listicle', 'POV'];

  return (
    <div className="grid md:grid-cols-5 gap-8 animate-in fade-in duration-500">
      <div className="md:col-span-2 space-y-6">
        <Card className="space-y-6">
          <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Video Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., The secret to 10k followers" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none" /></div>
          <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Starting Hook</label><textarea value={hook} onChange={e => setHook(e.target.value)} rows={3} placeholder="Paste your hook here..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none resize-none" /></div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Script Archetype</label>
            <div className="grid grid-cols-2 gap-2">
               {archetypes.map(a => (
                 <button key={a} onClick={() => setArchetype(a)} className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${archetype === a ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{a}</button>
               ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading || !title || !hook} className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-900/20">
            {loading ? <RefreshCw className="animate-spin" /> : <PenTool size={20} />}
            {loading ? 'Reasoning with Pro...' : 'Build Full Script'}
          </button>
        </Card>
        {script && (
          <button onClick={() => onSaveIdea({ title, hook, script, archetype, status: 'scripted', viralityScore: 90 })} className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
            <Save size={20} /> Save to Content Flow
          </button>
        )}
      </div>
      <div className="md:col-span-3">
        <Card className="h-full min-h-[500px] flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between"><div className="flex items-center gap-2"><Smartphone size={16} className="text-zinc-500" /><span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Retention Script Editor</span></div>{script && <Badge color="green">AI Draft Ready</Badge>}</div>
          <div className="flex-1 p-8 overflow-y-auto whitespace-pre-wrap font-medium leading-relaxed text-zinc-300">
            {script ? script : <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-4"><div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center"><PenTool size={32} /></div><p>Select an archetype and build your script <br />using Gemini 3 Pro Reasoning.</p></div>}
          </div>
          {script && <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex justify-end gap-3"><button className="p-3 text-zinc-500 hover:text-white transition-colors"><Copy size={18} /></button><button className="p-3 text-zinc-500 hover:text-white transition-colors"><RefreshCw size={18} /></button></div>}
        </Card>
      </div>
    </div>
  );
};

const VideoGeneratorView = () => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }

    setGenerating(true);
    setVideoUrl(null);
    setStatusMessage('Initializing Veo Video Engine...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution,
          aspectRatio
        }
      });

      const messages = [
        "Analyzing prompt semantics...",
        "Rendering temporal coherence...",
        "Optimizing lighting and motion...",
        "Finalizing cinematic textures...",
        "Synthesizing viral aesthetics..."
      ];
      let msgIdx = 0;

      while (!operation.done) {
        setStatusMessage(messages[msgIdx % messages.length]);
        msgIdx++;
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
        await (window as any).aistudio.openSelectKey();
      }
    } finally {
      setGenerating(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Video Generation Prompt</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder="Describe your viral video scene... e.g., A cinematic wide shot of a futuristic city with neon lights and flying cars." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Resolution</label>
                  <select value={resolution} onChange={e => setResolution(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none">
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Aspect Ratio</label>
                  <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none">
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                  </select>
               </div>
            </div>
            <div className="p-4 bg-purple-600/10 border border-purple-500/20 rounded-xl flex gap-3">
              <CreditCard className="text-purple-400 shrink-0" size={20} />
              <p className="text-xs text-zinc-300">Veo models require a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-purple-400 font-bold underline" rel="noreferrer">paid API key</a>. You'll be prompted to select one if needed.</p>
            </div>
            <button onClick={handleGenerate} disabled={generating || !prompt} className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-black text-lg transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-3">
              {generating ? <Loader2 className="animate-spin" /> : <Layers size={20} />}
              {generating ? 'Engine Running...' : 'Generate with Veo 3.1'}
            </button>
          </Card>
        </div>

        <Card className="min-h-[500px] flex flex-col justify-center items-center relative overflow-hidden bg-black/40">
           {generating ? (
             <div className="text-center space-y-8 animate-in fade-in duration-500">
                <div className="relative">
                   <div className="w-24 h-24 rounded-full border-4 border-zinc-800 border-t-purple-600 animate-spin mx-auto" />
                   <Layers className="absolute inset-0 m-auto text-purple-600" size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">{statusMessage}</h4>
                  <p className="text-zinc-500 text-sm">High-quality video generation typically takes a few minutes.</p>
                </div>
                <div className="w-48 h-1.5 bg-zinc-900 rounded-full overflow-hidden mx-auto">
                   <div className="h-full bg-purple-600 animate-pulse w-full" />
                </div>
             </div>
           ) : videoUrl ? (
             <div className="w-full h-full flex flex-col p-4 space-y-4">
                <div className="flex-1 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <video src={videoUrl} controls className="max-h-full max-w-full" autoPlay loop />
                </div>
                <div className="flex justify-between items-center px-2">
                  <Badge color="green">Generation Complete</Badge>
                  <a href={videoUrl} download="viralflow_video.mp4" className="text-sm font-bold text-purple-400 hover:text-purple-300 flex items-center gap-2"><Upload size={16} /> Download MP4</a>
                </div>
             </div>
           ) : (
             <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
                  <Video size={40} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">No video generated</h4>
                  <p className="text-zinc-500 text-sm">Use the prompt builder to start the engine.</p>
                </div>
             </div>
           )}
        </Card>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'loading' | 'landing' | 'auth' | 'app'>('loading');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [currentSubView, setCurrentSubView] = useState('dashboard');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);

  const fetchUserData = async (uid: string) => {
    try {
      const profile = await getProfile(uid);
      // Wrapped in a catch to avoid hanging the app if Firestore index is missing
      const userIdeas = await getIdeas(uid).catch(err => {
        console.warn("Firestore could not fetch ideas (likely missing index). Proceeding with empty list.", err);
        return [];
      });
      setIdeas(userIdeas);
      return profile;
    } catch (e) {
      console.error("Error fetching user data:", e);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await fetchUserData(user.uid);
        if (profile && profile.platforms && profile.platforms.length > 0) {
          setUserProfile(profile);
          setView('app');
          setCurrentSubView('dashboard');
        } else {
          setUserProfile(profile || { name: user.displayName || 'Creator', platforms: [], creatorType: 'Personal Brand', niche: [], plan: 'Starter' });
          setView('app');
          setOnboardingStep(0);
        }
      } else { 
        setView('landing'); 
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => { await logoutUser(); setUserProfile(null); setIdeas([]); setView('landing'); setOnboardingStep(0); };
  const handleOnboardingComplete = async (profile: UserProfile) => { if (auth.currentUser) { await saveProfile(auth.currentUser.uid, profile); setUserProfile(profile); setOnboardingStep(5); } };
  const handlePlanSelect = async (plan: SubscriptionPlan) => { if (auth.currentUser && userProfile) { const updated = { ...userProfile, plan }; await updateProfile(auth.currentUser.uid, { plan }); setUserProfile(updated); } };
  const handleDeleteIdea = async (id: string) => { if (auth.currentUser) { await deleteIdea(auth.currentUser.uid, id); setIdeas(prev => prev.filter(i => i.id !== id)); } };
  const handleSaveIdea = async (idea: Omit<VideoIdea, 'id'>) => { if (auth.currentUser) { const id = await addIdea(auth.currentUser.uid, idea); setIdeas(prev => [{...idea, id}, ...prev]); } };

  if (view === 'loading') return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={48} /></div>;
  if (view === 'landing') return <LandingPage onStart={() => { setAuthMode('signup'); setView('auth'); }} onLogin={() => { setAuthMode('login'); setView('auth'); }} />;
  if (view === 'auth') return <AuthView mode={authMode} onSwitch={setAuthMode} onSuccess={() => { /* State listener handles redirection */ }} />;
  if (view === 'app' && onboardingStep < 5 && userProfile && (!userProfile.platforms || userProfile.platforms.length === 0)) return <Onboarding step={onboardingStep} initialProfile={userProfile} onNext={() => setOnboardingStep(prev => prev + 1)} onComplete={handleOnboardingComplete} />;

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-white overflow-hidden">
      <aside className="w-64 border-r border-[#26262B] flex flex-col p-4 sticky top-0 h-screen bg-[#0A0A0B]">
        <div className="flex items-center gap-2 px-4 py-6 mb-4"><div className="bg-purple-600 p-1.5 rounded-lg shadow-lg shadow-purple-600/20"><Zap size={24} className="text-white fill-white" /></div><h1 className="text-xl font-extrabold tracking-tight">VIRAL<span className="text-purple-500">FLOW</span></h1></div>
        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentSubView === 'dashboard'} onClick={() => setCurrentSubView('dashboard')} />
          <SidebarItem icon={Calendar} label="Content Flow" active={currentSubView === 'calendar'} onClick={() => setCurrentSubView('calendar')} />
          <SidebarItem icon={Sparkles} label="Hook Generator" active={currentSubView === 'hooks'} onClick={() => setCurrentSubView('hooks')} />
          <SidebarItem icon={PenTool} label="Script Builder" active={currentSubView === 'scripts'} onClick={() => setCurrentSubView('scripts')} />
          <SidebarItem icon={Eye} label="Studio Audit" active={currentSubView === 'audit'} onClick={() => setCurrentSubView('audit')} />
          <SidebarItem icon={Video} label="Video Engine" active={currentSubView === 'generator'} onClick={() => setCurrentSubView('generator')} />
          <SidebarItem icon={MessageSquare} label="Growth Coach" active={currentSubView === 'coach'} onClick={() => setCurrentSubView('coach')} />
        </nav>
        <div className="mt-auto pt-6 border-t border-[#26262B] space-y-1">
          <SidebarItem icon={Settings} label="Settings" active={currentSubView === 'settings'} onClick={() => setCurrentSubView('settings')} />
          <div className="px-4 py-4 mt-2 rounded-2xl bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/20"><p className="text-xs text-purple-300 font-semibold mb-2 uppercase">Plan Status</p><p className="text-sm text-zinc-300 mb-3">{userProfile?.plan || 'Starter'}</p><div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-purple-600 w-[100%]"></div></div></div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex flex-col bg-[#0A0A0B]/80 backdrop-blur-md border-b border-[#26262B]">
          {currentSubView === 'dashboard' && <TrendTicker niche={userProfile?.niche[0] || 'AI'} />}
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4"><div><h2 className="text-lg font-bold capitalize">{currentSubView.replace('-', ' ')}</h2><p className="text-xs text-zinc-500">Welcome back, {userProfile?.name || 'Creator'}</p></div>{userProfile?.plan && userProfile.plan !== 'Starter' && <Badge color="purple">{userProfile.plan}</Badge>}</div>
            <div className="flex items-center gap-4"><Badge color="zinc">Credits Unlimited</Badge>{(!userProfile?.plan || userProfile.plan === 'Starter') && (<button onClick={() => setCurrentSubView('pricing')} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-purple-900/20">Upgrade</button>)}</div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {userProfile && currentSubView === 'dashboard' && <DashboardView userProfile={userProfile} ideas={ideas} onDeleteIdea={handleDeleteIdea} onAction={setCurrentSubView} />}
          {currentSubView === 'calendar' && <CalendarFlowView ideas={ideas} onAction={setCurrentSubView} />}
          {currentSubView === 'hooks' && <HookGeneratorView userProfile={userProfile} onSaveIdea={handleSaveIdea} />}
          {currentSubView === 'scripts' && <ScriptBuilderView onSaveIdea={handleSaveIdea} />}
          {currentSubView === 'audit' && <AuditView />}
          {currentSubView === 'generator' && <VideoGeneratorView />}
          {currentSubView === 'coach' && <CoachView />}
          {currentSubView === 'settings' && <SettingsView profile={userProfile} onUpdateProfile={setUserProfile} onLogout={handleLogout} />}
          {currentSubView === 'pricing' && <PricingView currentPlan={userProfile?.plan} onPlanSelect={handlePlanSelect} />}
        </div>
      </main>
    </div>
  );
}
