
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Sparkles, PenTool, Video, Calendar, BarChart3, MessageSquare, Settings, Plus,
  ChevronRight, TrendingUp, TrendingDown, Clock, CheckCircle2, Instagram, Youtube, Smartphone, Zap, Star, Search,
  Type as TypeIcon, Image as ImageIcon, Wand2, Mic, StopCircle, RefreshCw, ExternalLink, BrainCircuit,
  Save, Copy, Wand, ArrowRight, Play, Check, Menu, X, Globe, Layers, Rocket, Flame, LayoutGrid, Timer, CreditCard, User, LogOut
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

// Internal modules
import { Platform, CreatorType, Niche, UserProfile, VideoIdea } from './types';
import { 
  generateHooksWithSearch, 
  generateProImage, 
  editImageWithFlash, 
  complexCoachAdvice,
  analyzeMedia,
  generateScript
} from './geminiService';

// --- Helper Functions ---
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

// --- View Components ---

const PricingView = () => {
  const plans = [
    {
      name: "Starter",
      price: "0",
      description: "For creators just starting their journey.",
      features: ["3 Videos / month", "Gemini 3 Flash access", "Basic Hook Generator", "Community Support"],
      cta: "Current Plan",
      current: true
    },
    {
      name: "Pro",
      price: "49",
      description: "The complete viral content engine.",
      features: ["Unlimited Videos", "Gemini 3 Pro Reasoning", "4K Image Generation", "Auto-Scheduling", "Growth Coach Access"],
      cta: "Upgrade to Pro",
      highlight: true
    },
    {
      name: "Studio",
      price: "199",
      description: "Scalable content for teams and brands.",
      features: ["Multiple Accounts", "API Access", "Dedicated Growth Strategist", "Custom AI Fine-tuning", "Priority Processing"],
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black">Choose your viral engine.</h2>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto">Scale your reach with more processing power and advanced AI models.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, i) => (
          <Card key={i} className={`flex flex-col justify-between p-8 space-y-8 relative ${plan.highlight ? 'border-purple-500 bg-purple-600/5' : ''}`}>
            {plan.highlight && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-zinc-500 text-sm mt-1">{plan.description}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">${plan.price}</span>
                <span className="text-zinc-500 font-bold">/mo</span>
              </div>
              <div className="space-y-3 pt-4">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <button className={`w-full py-4 rounded-xl font-black transition-all ${plan.current ? 'bg-zinc-800 text-zinc-500 cursor-default' : plan.highlight ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30' : 'bg-white/5 hover:bg-white/10'}`}>
              {plan.cta}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
};

const SettingsView = ({ profile, onUpdateProfile, onLogout }: { profile: UserProfile | null, onUpdateProfile: (p: UserProfile) => void, onLogout: () => void }) => {
  const [formData, setFormData] = useState<UserProfile>(profile || { name: '', platforms: [], creatorType: 'Personal Brand', niche: [] });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const platformsList: Platform[] = ['TikTok', 'Instagram', 'YouTube'];
  const nichesList: Niche[] = ['AI', 'Finance', 'Fitness', 'Motivation', 'Education', 'Ecommerce', 'Tech', 'Lifestyle'];

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">Creator Profile</h2>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-bold hover:bg-rose-500 hover:text-white transition-all">
          <LogOut size={18} /> Log Out
        </button>
      </div>

      <div className="grid gap-8">
        <Card className="space-y-6">
          <div className="flex items-center gap-4 border-b border-[#26262B] pb-6">
            <div className="w-20 h-20 rounded-3xl bg-purple-600 flex items-center justify-center text-white text-3xl font-black">
              {formData.name.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="text-xl font-bold">{formData.name || 'Set your name'}</h3>
              <p className="text-zinc-500 text-sm">{formData.creatorType} • {formData.niche.join(', ') || 'No niche set'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Display Name</label>
              <input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Creator Type</label>
              <select 
                value={formData.creatorType}
                onChange={e => setFormData({...formData, creatorType: e.target.value as CreatorType})}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none"
              >
                {['Personal Brand', 'Business', 'Coach', 'Influencer', 'Faceless Channel'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card className="space-y-6">
          <h3 className="text-xl font-bold">Channels & Niche</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase">Active Platforms</label>
              <div className="flex gap-3">
                {platformsList.map(p => (
                  <button 
                    key={p}
                    onClick={() => {
                      const next = formData.platforms.includes(p) ? formData.platforms.filter(x => x !== p) : [...formData.platforms, p];
                      setFormData({...formData, platforms: next});
                    }}
                    className={`px-4 py-2 rounded-xl border-2 transition-all font-bold ${formData.platforms.includes(p) ? 'border-purple-600 bg-purple-600/10 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 uppercase">Primary Niches</label>
              <div className="flex flex-wrap gap-2">
                {nichesList.map(n => (
                  <button 
                    key={n}
                    onClick={() => {
                      const next = formData.niche.includes(n) ? formData.niche.filter(x => x !== n) : [...formData.niche, n];
                      setFormData({...formData, niche: next});
                    }}
                    className={`px-3 py-1.5 rounded-full border-2 text-xs transition-all font-bold ${formData.niche.includes(n) ? 'border-purple-600 bg-purple-600/10 text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <button onClick={handleSave} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-black transition-all flex items-center gap-2">
            {isSaved ? <Check size={20} /> : <Save size={20} />}
            {isSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ ideas, onAction }: { ideas: VideoIdea[], onAction: (view: string) => void }) => {
  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* SECTION 1 — PRIMARY ACTION */}
      <Card className="relative overflow-hidden group border-purple-500/20 bg-gradient-to-br from-[#1A1A1E] to-purple-950/20 p-10 md:p-14">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] -z-10 group-hover:bg-purple-600/20 transition-all"></div>
        <div className="max-w-xl space-y-6">
          <Badge color="purple">Direct Content Access</Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Create your next <br />viral video
          </h1>
          <p className="text-zinc-400 text-lg font-medium">
            Optimized for TikTok, Reels & Shorts. Use Gemini 3 to turn ideas into high-retention content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button 
              onClick={() => onAction('generator')}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 group/btn"
            >
              <Zap size={20} className="fill-current" />
              Generate Video
              <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
              <Star size={20} /> Use trending format
            </button>
          </div>
        </div>
      </Card>

      {/* PERFORMANCE SNAPSHOT */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="text-purple-500" size={20} />
            Performance Snapshot
          </h3>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">vs. Previous Week</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Views", value: "142.8K", trend: 12.5, positive: true },
            { label: "Engagement Rate", value: "8.42%", trend: 1.8, positive: true },
            { label: "Viral Reach", value: "64.2K", trend: -4.2, positive: false },
          ].map((metric, i) => (
            <Card key={i} className="flex flex-col justify-between py-8">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">{metric.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black tracking-tight">{metric.value}</span>
                <div className={`flex items-center gap-1 text-sm font-bold ${metric.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {metric.positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{Math.abs(metric.trend)}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* SECTION 2 — TODAY’S CONTENT PLAN */}
        <Card className="flex flex-col justify-between border-emerald-500/10 bg-gradient-to-br from-[#151518] to-emerald-950/5">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-emerald-500" size={20} />
                Today’s Plan
              </h3>
              <Badge color="green">Perfect Timing</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Platform</p>
                <div className="flex items-center gap-2 text-white font-bold">
                  <Instagram size={16} className="text-pink-500" /> Reels
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hook Style</p>
                <div className="flex items-center gap-2 text-white font-bold">
                  <Search size={16} className="text-blue-500" /> Narrative
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Best Time</p>
                <div className="flex items-center gap-2 text-white font-bold">
                  <Clock size={16} className="text-yellow-500" /> 6:15 PM
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onAction('hooks')}
            className="w-full mt-8 py-4 bg-zinc-800 hover:bg-emerald-600 hover:bg-opacity-20 text-white font-bold rounded-xl border border-zinc-700 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2"
          >
            Create today’s video
          </button>
        </Card>

        {/* SECTION 5 — PROGRESS & MOTIVATION */}
        <Card className="flex flex-col justify-between border-blue-500/10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Flame className="text-orange-500" size={20} />
                Creator Momentum
              </h3>
              <div className="flex items-center gap-1 text-orange-400 font-black text-xs">
                3 DAY STREAK
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-zinc-400">Videos this week</span>
                <span className="text-white">4 / 7</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 w-[57%] rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]"></div>
              </div>
            </div>
            <p className="text-zinc-500 text-sm italic font-medium">
              “Creators who post daily grow 3× faster. You're halfway to your weekly goal!”
            </p>
          </div>
        </Card>
      </div>

      {/* SECTION 4 — RECENT CONTENT */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold px-2">Recent Content</h3>
        <div className="grid gap-4">
          {ideas.length > 0 ? ideas.map((idea) => (
            <Card key={idea.id} className="p-4 flex flex-col md:flex-row items-center gap-6 hover:bg-zinc-900/20">
              <div className="w-full md:w-20 aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden border border-white/5 relative flex-shrink-0">
                <img src={`https://picsum.photos/seed/${idea.id}/200/360`} className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Play size={20} className="text-white/40" />
                </div>
              </div>
              <div className="flex-1 space-y-1 w-full text-left">
                <div className="flex items-center gap-2">
                   <Badge color={idea.status === 'ready' ? 'green' : 'blue'}>{idea.status}</Badge>
                   <div className="flex gap-1">
                      <Instagram size={12} className="text-zinc-600" />
                      <Youtube size={12} className="text-zinc-600" />
                   </div>
                </div>
                <h4 className="font-bold text-lg">{idea.title}</h4>
                <p className="text-zinc-500 text-sm italic truncate">"{idea.hook}"</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"><Copy size={16} /></button>
                <button className="flex-1 md:flex-none p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"><PenTool size={16} /></button>
                <button className="flex-1 md:flex-none px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm">Schedule</button>
              </div>
            </Card>
          )) : (
            <Card className="p-20 text-center space-y-4 border-dashed border-2 bg-transparent border-zinc-800">
              <Rocket size={48} className="mx-auto text-zinc-700" />
              <div className="space-y-2">
                <h4 className="text-xl font-bold">Your content engine is ready.</h4>
                <p className="text-zinc-500">Let’s create your first viral video together.</p>
              </div>
              <button onClick={() => onAction('hooks')} className="px-8 py-3 bg-purple-600 rounded-xl font-black">Generate First Video</button>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

// --- Landing Page Component ---

const LandingPage = ({ onStart, onLogin }: { onStart: () => void, onLogin: () => void }) => {
  return (
    <div className="bg-[#0A0A0B] text-white selection:bg-purple-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 p-1.5 rounded-lg shadow-lg shadow-purple-600/20">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">ViralFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Login</button>
            <button onClick={onStart} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-purple-600/20 active:scale-95">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden min-h-screen">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <Badge color="purple">Alpha 2.0 Now Live</Badge>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.1]">
            Create viral short-form <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">content — automatically.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Hooks. Scripts. Videos. Posted. <br className="hidden md:block" />
            The AI engine built for the next generation of creators.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={onStart} className="w-full sm:w-auto px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-2xl transition-all shadow-2xl shadow-purple-600/40 transform hover:scale-105 active:scale-95">
              Start Creating Free
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xl rounded-2xl transition-all flex items-center justify-center gap-3">
              <Play size={20} className="fill-current" /> Watch Demo
            </button>
          </div>

          <div id="pricing" className="pt-40 pb-20">
            <h2 className="text-4xl font-black mb-12">Simple pricing for serious reach.</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="text-left p-10 space-y-6">
                <h3 className="text-2xl font-bold">Free Plan</h3>
                <div className="text-4xl font-black">$0<span className="text-zinc-500 text-lg">/mo</span></div>
                <ul className="space-y-3">
                  {['3 Videos / month', 'Basic Gemini access', 'Community tools'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500" /> {f}</li>
                  ))}
                </ul>
                <button onClick={onStart} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold">Get Started</button>
              </Card>
              <Card className="text-left p-10 space-y-6 border-purple-500 bg-purple-600/5">
                <h3 className="text-2xl font-bold">Pro Plan</h3>
                <div className="text-4xl font-black">$49<span className="text-zinc-500 text-lg">/mo</span></div>
                <ul className="space-y-3">
                  {['Unlimited Videos', 'Gemini 3 Pro Reasoning', 'Growth Consultant', '4K Rendering'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500" /> {f}</li>
                  ))}
                </ul>
                <button onClick={onStart} className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-black shadow-lg shadow-purple-600/30">Upgrade Now</button>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Onboarding Logic ---

function Onboarding({ step, onNext, onComplete }: any) {
  const [form, setForm] = useState<UserProfile>({ 
    name: '', 
    platforms: [], 
    creatorType: 'Personal Brand', 
    niche: [] 
  });
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedHooks, setGeneratedHooks] = useState<any[]>([]);
  const [selectedHook, setSelectedHook] = useState<any>(null);

  useEffect(() => {
    if (step === 4) {
      const timer = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= 3) {
            clearInterval(timer);
            generateHooks();
            return 3;
          }
          return prev + 1;
        });
      }, 1200);
      return () => clearInterval(timer);
    }
  }, [step]);

  const generateHooks = async () => {
    try {
      const nicheStr = form.niche.length > 0 ? form.niche[0] : "AI";
      const { results } = await generateHooksWithSearch("Viral tips", nicheStr);
      setGeneratedHooks(results);
      onNext();
    } catch (e) {
      setGeneratedHooks([
        { text: "Why 99% of people fail at " + (form.niche[0] || "AI"), viralityScore: 94, type: "Curiosity" },
        { text: "The secret tool for " + (form.niche[0] || "creators") + " in 2024", viralityScore: 88, type: "Value" },
        { text: "Stop scrolling if you want to master " + (form.niche[0] || "your niche"), viralityScore: 91, type: "Hook" }
      ]);
      onNext();
    }
  };

  const platforms = [
    { id: 'TikTok', icon: Smartphone, label: 'TikTok' },
    { id: 'Instagram', icon: Instagram, label: 'Instagram Reels' },
    { id: 'YouTube', icon: Youtube, label: 'YouTube Shorts' }
  ];

  const niches: Niche[] = ['AI', 'Finance', 'Fitness', 'Motivation', 'Education', 'Ecommerce', 'Tech', 'Lifestyle'];

  const containerClass = "min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500";
  const innerClass = "w-full max-w-xl space-y-8";

  if (step === 0) return (
    <div className={containerClass}>
      <div className="text-center space-y-10">
        <div className="inline-block bg-purple-600 p-8 rounded-[40px] shadow-2xl shadow-purple-600/30 animate-bounce">
          <Rocket size={80} className="text-white fill-white" />
        </div>
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter">ViralFlow</h1>
          <p className="text-3xl font-bold text-zinc-400">Welcome to the future <br />of content creation.</p>
        </div>
        <div className="space-y-4">
          <input 
            placeholder="What's your creator name?" 
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full bg-[#151518] border border-[#26262B] rounded-2xl px-6 py-5 text-xl text-center focus:border-purple-500 outline-none"
          />
          <button onClick={onNext} disabled={!form.name} className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white font-black text-2xl rounded-3xl transition-all shadow-xl shadow-purple-600/20 disabled:opacity-50">
            Let's Go
          </button>
        </div>
      </div>
    </div>
  );

  if (step === 1) return (
    <div className={containerClass}>
      <div className={innerClass}>
        <div className="space-y-2">
          <Badge color="purple">Step 1 of 3</Badge>
          <h2 className="text-4xl font-black">Where do you post?</h2>
          <p className="text-zinc-500">Select all your active channels.</p>
        </div>
        <div className="grid gap-4">
          {platforms.map(p => (
            <button 
              key={p.id}
              onClick={() => {
                const current = form.platforms as string[];
                const next = current.includes(p.id) ? current.filter(x => x !== p.id) : [...current, p.id];
                setForm({...form, platforms: next as Platform[]});
              }}
              className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${form.platforms.includes(p.id as Platform) ? 'border-purple-600 bg-purple-600/10' : 'border-[#26262B] bg-[#151518] hover:border-zinc-700'}`}
            >
              <div className="flex items-center gap-4">
                <p.icon size={24} className={form.platforms.includes(p.id as Platform) ? 'text-purple-400' : 'text-zinc-500'} />
                <span className="text-xl font-bold">{p.label}</span>
              </div>
              {form.platforms.includes(p.id as Platform) && <CheckCircle2 className="text-purple-500" />}
            </button>
          ))}
        </div>
        <button onClick={onNext} disabled={form.platforms.length === 0} className="w-full py-5 bg-purple-600 disabled:bg-zinc-800 disabled:text-zinc-600 hover:bg-purple-500 text-white font-black text-xl rounded-2xl transition-all">Continue</button>
      </div>
    </div>
  );

  if (step === 3) return (
    <div className={containerClass}>
      <div className={innerClass}>
        <div className="space-y-2">
          <Badge color="purple">Step 2 of 3</Badge>
          <h2 className="text-4xl font-black">Pick your niche.</h2>
          <p className="text-zinc-500">This helps Gemini optimize your hooks.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {niches.map(n => (
            <button key={n} onClick={() => {
              const current = form.niche;
              const next = current.includes(n) ? current.filter(x => x !== n) : [...current, n];
              setForm({...form, niche: next});
            }} className={`px-6 py-3 rounded-full border-2 transition-all font-bold ${form.niche.includes(n) ? 'border-purple-600 bg-purple-600 text-white' : 'border-[#26262B] bg-[#151518] text-zinc-400'}`}>{n}</button>
          ))}
        </div>
        <button onClick={onNext} disabled={form.niche.length === 0} className="w-full py-5 bg-purple-600 disabled:bg-zinc-800 hover:bg-purple-500 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-purple-600/20">Analyze Viral Potential</button>
      </div>
    </div>
  );

  if (step === 4) return (
    <div className={containerClass}>
      <div className="text-center space-y-12 w-full max-sm mx-auto">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-purple-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-purple-500"><Sparkles /></div>
        </div>
        <h2 className="text-2xl font-bold">Scanning current trends...</h2>
      </div>
    </div>
  );

  if (step === 5) return (
    <div className={containerClass}>
      <div className={innerClass}>
        <h2 className="text-4xl font-black">Success! Your engine is tuned.</h2>
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Check size={32} />
          </div>
          <p className="text-xl font-bold">Creator Profile Created</p>
          <p className="text-zinc-500">Your custom AI model is now ready to generate content optimized for your niche.</p>
        </Card>
        <button onClick={() => onComplete(form)} className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xl rounded-2xl transition-all">Go to Dashboard</button>
      </div>
    </div>
  );

  // Skip step 2 (Creator Type) to make it faster as per "minimal thinking" principle
  if (step === 2) { onNext(); return null; }

  return null;
}

// --- Main Application ---

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [currentSubView, setCurrentSubView] = useState('dashboard');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ideas] = useState<VideoIdea[]>([
    { id: '1', title: 'The Future of AI Tools', hook: 'AI is changing everything...', viralityScore: 92, status: 'ready' },
    { id: '2', title: 'Why 90% of Creators Fail', hook: 'Stop posting daily until you see this...', viralityScore: 88, status: 'scripted' },
  ]);

  const handleStart = () => {
    if (userProfile) setView('app');
    else {
      setView('app');
      setOnboardingStep(0);
    }
  };

  const handleLogin = () => {
    // Simulating login: if profile exists, skip onboarding
    if (userProfile) {
      setView('app');
      setCurrentSubView('dashboard');
    } else {
      handleStart();
    }
  };

  const handleLogout = () => {
    // Keep profile in state for demo purposes, just go back to landing
    setView('landing');
  };

  if (view === 'landing') return <LandingPage onStart={handleStart} onLogin={handleLogin} />;

  if (onboardingStep < 9 && !userProfile) return (
    <Onboarding 
      step={onboardingStep} 
      onNext={() => setOnboardingStep(prev => prev + 1)} 
      onComplete={(profile: UserProfile) => { 
        setUserProfile(profile); 
        setOnboardingStep(9); 
      }} 
    />
  );

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-white overflow-hidden">
      <aside className="w-64 border-r border-[#26262B] flex flex-col p-4 sticky top-0 h-screen bg-[#0A0A0B]">
        <div className="flex items-center gap-2 px-4 py-6 mb-4">
          <div className="bg-purple-600 p-1.5 rounded-lg shadow-lg shadow-purple-600/20"><Zap size={24} className="text-white fill-white" /></div>
          <h1 className="text-xl font-extrabold tracking-tight">VIRAL<span className="text-purple-500">FLOW</span></h1>
        </div>
        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentSubView === 'dashboard'} onClick={() => setCurrentSubView('dashboard')} />
          <SidebarItem icon={Sparkles} label="Hook Generator" active={currentSubView === 'hooks'} onClick={() => setCurrentSubView('hooks')} />
          <SidebarItem icon={PenTool} label="Script Builder" active={currentSubView === 'scripts'} onClick={() => setCurrentSubView('scripts')} />
          <SidebarItem icon={Video} label="Video Engine" active={currentSubView === 'generator'} onClick={() => setCurrentSubView('generator')} />
          <SidebarItem icon={CreditCard} label="Subscription" active={currentSubView === 'pricing'} onClick={() => setCurrentSubView('pricing')} />
          <SidebarItem icon={MessageSquare} label="Growth Coach" active={currentSubView === 'coach'} onClick={() => setCurrentSubView('coach')} />
        </nav>
        <div className="mt-auto pt-6 border-t border-[#26262B] space-y-1">
          <SidebarItem icon={Settings} label="Settings" active={currentSubView === 'settings'} onClick={() => setCurrentSubView('settings')} />
          <div className="px-4 py-4 mt-2 rounded-2xl bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/20">
            <p className="text-xs text-purple-300 font-semibold mb-2 uppercase">Credits Available</p>
            <p className="text-sm text-zinc-300 mb-3">1,420 Tokens</p>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[60%]"></div></div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-[#26262B]">
          <div><h2 className="text-lg font-bold capitalize">{currentSubView.replace('-', ' ')}</h2><p className="text-xs text-zinc-500">Welcome back, {userProfile?.name || 'Creator'}</p></div>
          <div className="flex items-center gap-4">
            <Badge color="zinc">1,420 Tokens Left</Badge>
            <button onClick={() => setCurrentSubView('pricing')} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-purple-900/20">Upgrade</button>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">
          {currentSubView === 'dashboard' && <DashboardView ideas={ideas} onAction={setCurrentSubView} />}
          {currentSubView === 'hooks' && <HookGeneratorView userProfile={userProfile} />}
          {currentSubView === 'scripts' && <ScriptBuilderView />}
          {currentSubView === 'generator' && <VideoGeneratorView />}
          {currentSubView === 'coach' && <CoachView />}
          {currentSubView === 'settings' && <SettingsView profile={userProfile} onUpdateProfile={setUserProfile} onLogout={handleLogout} />}
          {currentSubView === 'pricing' && <PricingView />}
        </div>
      </main>
    </div>
  );
}

// --- View Implementations ---

function HookGeneratorView({ userProfile }: { userProfile: UserProfile | null }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const niche = userProfile?.niche[0] || 'AI';
      const { results, sources } = await generateHooksWithSearch(topic, niche);
      setResults(results);
      setSources(sources);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2"><Globe className="text-purple-400" size={20} /> Search-Grounded Hooks</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What's your video about?" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none" />
          <button onClick={handleGenerate} disabled={loading} className="bg-purple-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 min-w-[140px]">{loading ? <RefreshCw className="animate-spin" size={18} /> : <Wand2 size={18} />} Generate</button>
        </div>
      </Card>
      <div className="grid md:grid-cols-3 gap-6">
        {results.map((h, i) => (
          <Card key={i} className="space-y-4 border-zinc-800 hover:border-purple-500/30 transition-all">
            <div className="flex justify-between"><Badge color="blue">{h.type}</Badge><div className="text-purple-400 font-bold text-xs flex items-center gap-1"><TrendingUp size={12} /> {h.viralityScore}%</div></div>
            <p className="text-lg font-bold italic text-zinc-200">"{h.text}"</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ScriptBuilderView() {
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title || !hook) return;
    setLoading(true);
    try {
      const result = await generateScript(title, hook);
      setScript(result || '');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 space-y-6">
          <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Video Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 5 AI tools" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none" /></div>
          <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase">Starting Hook</label><textarea value={hook} onChange={(e) => setHook(e.target.value)} placeholder="The first 3-5 seconds..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 h-32 resize-none focus:border-purple-500 outline-none" /></div>
          <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-purple-600 rounded-xl font-black flex items-center justify-center gap-2">{loading ? <RefreshCw className="animate-spin" size={20} /> : <PenTool size={20} />} Write Script</button>
        </Card>
        <Card className="md:col-span-2 min-h-[500px] flex flex-col border-zinc-800 bg-black/40">
          <h3 className="font-bold text-zinc-400 mb-6">Retention Script</h3>
          {script ? <div className="font-medium text-zinc-300 leading-relaxed whitespace-pre-wrap">{script}</div> : <div className="flex-1 flex flex-col items-center justify-center text-zinc-600"><BrainCircuit size={48} className="mb-4" /><p>Script will appear here</p></div>}
        </Card>
      </div>
    </div>
  );
}

function VideoGeneratorView() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [selectedPreset, setSelectedPreset] = useState('tiktok');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const ratioOptions = [
    { id: 'tiktok', label: 'TikTok', icon: Smartphone, ratio: '9:16' },
    { id: 'reels', label: 'Reels', icon: Instagram, ratio: '9:16' },
    { id: 'shorts', label: 'Shorts', icon: Youtube, ratio: '9:16' },
    { id: 'wide', label: 'Wide', icon: Youtube, ratio: '16:9' },
    { id: 'square', label: 'Square', icon: Instagram, ratio: '1:1' },
  ];

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const result = await generateProImage(prompt, aspectRatio, "1K");
      setImage(result);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Visual Prompt</label>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)} 
              placeholder="Describe the scene..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 h-40 resize-none focus:border-purple-500 outline-none" 
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
              <LayoutGrid size={14} /> Platform Preset
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ratioOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setAspectRatio(opt.ratio);
                    setSelectedPreset(opt.id);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                    selectedPreset === opt.id 
                      ? 'border-purple-600 bg-purple-600/10 text-white' 
                      : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <opt.icon size={20} className={selectedPreset === opt.id ? 'text-purple-400' : 'text-zinc-600'} />
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-tight">{opt.label}</p>
                    <p className="text-[8px] font-bold opacity-50">{opt.ratio}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-purple-600 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-purple-900/30">
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <ImageIcon size={20} />} Generate Visual
          </button>
        </Card>
        <Card className="md:col-span-2 min-h-[500px] flex items-center justify-center bg-zinc-950 overflow-hidden relative">
          {image ? (
            <img src={image} className="max-h-full rounded-lg shadow-2xl" />
          ) : (
            <div className="text-center text-zinc-600">
              <ImageIcon size={48} className="mx-auto mb-4" />
              <p>Visual will appear here</p>
            </div>
          )}
          {/* Visual Indicator in Mockup */}
          {image && (
            <div className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
               <Badge color="purple">{selectedPreset.toUpperCase()}</Badge>
               <span className="text-[10px] font-bold text-zinc-400">{aspectRatio}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function CoachView() {
  const [chat, setChat] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input) return;
    const msg = input;
    setInput('');
    setChat(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const response = await complexCoachAdvice([], msg);
      setChat(prev => [...prev, { role: 'ai', text: response || 'No response.' }]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 flex flex-col h-[70vh]">
      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="p-6 border-b border-zinc-800 bg-[#151518]"><h3 className="font-bold text-lg">Growth Consultant</h3></div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-5 py-3 rounded-2xl ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>{m.text}</div>
            </div>
          ))}
          {loading && <div className="text-zinc-600 italic">Coach is thinking...</div>}
        </div>
        <div className="p-6 border-t border-zinc-800 bg-[#151518] flex gap-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask for advice..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none" />
          <button onClick={handleSend} disabled={loading} className="bg-purple-600 p-3 rounded-xl"><ArrowRight /></button>
        </div>
      </Card>
    </div>
  );
}
