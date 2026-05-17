import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Search, Terminal as TerminalIcon, Database, Activity, AlertCircle, CheckCircle2, Clock, Zap, XCircle, Radar } from 'lucide-react';
import { InvestigationState, ChatMessage, PathwayStatus } from './types';
import { processInvestigationUpdate } from './services/geminiService';

// --- Sub-components (Local for now, can be extracted later) ---

const Terminal = ({ messages, onSendMessage, isLoading, suggestedQuestions }: { 
  messages: ChatMessage[], 
  onSendMessage: (msg: string) => void, 
  isLoading: boolean,
  suggestedQuestions: string[]
}) => {
  const [input, setInput] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full border border-border bg-panel/50 rounded-lg overflow-hidden font-mono text-sm shadow-xl">
      <div className="bg-border px-4 py-2 flex items-center gap-2 border-b border-border">
        <TerminalIcon size={14} className="text-brand-green" />
        <span className="text-xs uppercase tracking-widest font-bold">Investigation Console_</span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded ${
              msg.role === 'user' 
                ? 'bg-brand-blue/10 border border-brand-blue/30 text-brand-blue' 
                : 'bg-brand-green/5 border border-brand-green/20 text-gray-300'
            }`}>
              <span className="text-[10px] uppercase block mb-1 opacity-50">
                {msg.role === 'user' ? 'Investigator' : 'Sentinel_OS'} | {msg.timestamp}
              </span>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-2 text-brand-green animate-pulse">
            <span>[WAIT]</span>
            <span>Processing intelligence vectors...</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-black/40">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => { setInput(q); }}
              className="text-[10px] uppercase border border-gray-700 px-2 py-1 rounded hover:border-brand-green hover:text-brand-green transition-colors bg-white/5"
            >
              + {q}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="relative">
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="ENTER VECTOR COMMAND..."
            className="w-full bg-black border border-border p-3 rounded font-mono text-sm focus:outline-none focus:border-brand-green focus:glow-border-green transition-all uppercase placeholder:opacity-30"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-3 text-brand-green disabled:opacity-30"
          >
            <Search size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ state }: { state: InvestigationState }) => {
  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Target Profile Card */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
        <div className="bg-panel/40 border border-border p-6 rounded-lg technical-grid relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
            <Shield size={64} />
          </div>
          <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-brand-green mb-4 flex items-center gap-2">
            <Database size={14} /> Subject_Profile
          </h2>
          <div className="relative z-10">
            <h1 className="text-4xl font-mono font-bold glow-green mb-1 truncate">{state.targetName || "UNDEFINED"}</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
          
          <div className="mt-8 space-y-4">
            <div>
              <div className="flex justify-between text-[10px] uppercase mb-1 font-bold">
                <span>Intelligence Completion</span>
                <span className="text-brand-green">{state.completionPercent}%</span>
              </div>
              <div className="h-1 bg-gray-900 w-full rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${state.completionPercent}%` }}
                  className="h-full bg-brand-green shadow-[0_0_8px_rgba(0,255,65,0.6)]"
                />
              </div>
            </div>
            
            <div className="p-3 bg-black/40 border-l-2 border-brand-green rounded-r">
               <h3 className="text-[10px] uppercase font-bold text-gray-400 mb-1">Judging_Matrix_Assessment</h3>
               <p className="text-xs italic text-gray-300 leading-relaxed">
                 "{state.judgmentReasoning || "Waiting for target initialization..."}"
               </p>
            </div>
          </div>
        </div>

        {/* Pathways Status */}
        <div className="flex-1 bg-panel/40 border border-border p-4 rounded-lg flex flex-col">
          <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4 flex items-center gap-2">
            <Activity size={14} /> Intelligence_Pathways
          </h2>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {state.pathways.map((path) => {
              const Icon = path.status === PathwayStatus.COMPLETED ? CheckCircle2 :
                          path.status === PathwayStatus.ACTIVE ? Radar :
                          path.status === PathwayStatus.FAILED ? XCircle : Clock;
              
              const statusColor = path.status === PathwayStatus.COMPLETED ? 'text-brand-green' :
                                 path.status === PathwayStatus.ACTIVE ? 'text-brand-blue' :
                                 path.status === PathwayStatus.FAILED ? 'text-brand-red' : 'text-gray-600';

              const bgColor = path.status === PathwayStatus.COMPLETED ? 'bg-brand-green/20' :
                              path.status === PathwayStatus.ACTIVE ? 'bg-brand-blue/20' :
                              path.status === PathwayStatus.FAILED ? 'bg-brand-red/20' : 'bg-gray-800/40';

              const progressWidth = path.status === PathwayStatus.COMPLETED ? '100%' :
                                   path.status === PathwayStatus.ACTIVE ? '65%' :
                                   path.status === PathwayStatus.FAILED ? '100%' : '15%';

              return (
                <div key={path.id} className="p-3 bg-white/5 border border-white/5 rounded-lg group hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${bgColor} ${statusColor}`}>
                        <Icon size={14} className={path.status === PathwayStatus.ACTIVE ? 'animate-spin-slow' : ''} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-gray-200">{path.name}</span>
                        <span className="text-[8px] uppercase text-gray-500 tracking-tighter">{path.description}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[9px] font-bold uppercase ${statusColor}`}>
                        {path.status}
                      </span>
                      <span className="text-[8px] font-mono text-gray-500">{path.findingsCount} FINDINGS</span>
                    </div>
                  </div>
                  
                  {/* Miniature Progress Bar */}
                  <div className="h-1 bg-black/40 w-full rounded-full overflow-hidden mt-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: progressWidth }}
                      className={`h-full transition-all duration-1000 ${
                        path.status === PathwayStatus.COMPLETED ? 'bg-brand-green' :
                        path.status === PathwayStatus.ACTIVE ? 'bg-brand-blue' :
                        path.status === PathwayStatus.FAILED ? 'bg-brand-red' : 'bg-gray-700'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Intelligence View */}
      <div className="col-span-12 lg:col-span-8 flex flex-col">
        <div className="flex-1 bg-panel/40 border border-border rounded-lg p-2 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-black/20">
            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <AlertCircle size={14} className="text-brand-blue" />
               Raw_Intelligence_Feed
            </span>
            <span className="text-[10px] font-mono opacity-40 uppercase">CONFIDENTIAL // TOP SECRET</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 content-start">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="text-gray-500 uppercase border-b border-border">
                  <th className="py-2 px-4 font-normal">Category</th>
                  <th className="py-2 px-4 font-normal">Intelligence Vector</th>
                  <th className="py-2 px-4 font-normal">Conf</th>
                  <th className="py-2 px-4 font-normal">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.intelPoints.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center opacity-20 uppercase tracking-[0.5em]">No Intelligence Logged</td>
                  </tr>
                ) : (
                  state.intelPoints.map((point) => (
                    <motion.tr 
                      key={point.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <span className="bg-brand-blue/10 border border-brand-blue/30 text-brand-blue px-2 py-0.5 rounded text-[10px] uppercase">
                          {point.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[9px] uppercase mb-1">{point.label}</span>
                          <span className="text-gray-200 group-hover:text-brand-green transition-colors">{point.value}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={point.confidence > 0.8 ? 'text-brand-green' : 'text-gray-500'}>
                          {(point.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 opacity-40 group-hover:opacity-80 transition-opacity">
                        {point.source || "UNKNOWN"}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [targetQuery, setTargetQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<InvestigationState>({
    targetName: '',
    intelPoints: [],
    pathways: [],
    completionPercent: 0,
    judgmentReasoning: '',
    isComplete: false,
    suggestedQuestions: []
  });

  const handleStartInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const { state: newState, chatResponse } = await processInvestigationUpdate(state, [], targetQuery);
      setState(newState);
      setMessages([{
        role: 'assistant',
        content: chatResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setIsInitialized(true);
    } catch (err) {
      console.error(err);
      setError('Investigation Failed: Intelligence vectors could not be initialized. Please try a different target.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (input: string) => {
    const newUserMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    
    try {
      // Map ChatMessage to history format for Gemini
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { state: newState, chatResponse } = await processInvestigationUpdate(state, history, input);
      
      setState(newState);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: chatResponse,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="scanline" />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full technical-grid" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-brand-green/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-brand-blue/10 blur-[150px] rounded-full" />
      </div>

      <header className="relative z-10 border-b border-border bg-black/60 backdrop-blur-md px-6 py-4 flex justify-between items-center h-[72px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-green/20 border border-brand-green/40 flex items-center justify-center rounded glow-border-green">
            <Shield className="text-brand-green" size={24} />
          </div>
          <div>
            <h1 className="font-mono font-bold tracking-tighter text-xl text-white">SENTINEL_<span className="text-brand-green font-bold">OSINT</span></h1>
            <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-gray-500 font-bold">
              <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
              SYSTEM_ONLINE // V2.4.0_STABLE
            </div>
          </div>
        </div>
        
        {isInitialized && (
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-gray-500">Subject</span>
              <span className="font-mono text-sm uppercase text-brand-green tracking-widest">{state.targetName}</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-[10px] uppercase font-bold text-gray-500">Security_Score</span>
               <span className="font-mono text-sm uppercase text-brand-blue">CLASSIFIED</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 relative z-10 p-4 lg:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isInitialized ? (
            <motion.div 
              key="init"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full flex items-center justify-center"
            >
              <div className="max-w-xl w-full text-center space-y-8">
                <div className="space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    <Shield size={120} className="text-white/10" />
                  </motion.div>
                  <h2 className="text-5xl font-mono font-bold uppercase tracking-tight text-white italic">Initialize_Investigation</h2>
                  <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Identify your target vector to begin intelligence decryption.</p>
                </div>

                <form onSubmit={handleStartInvestigation} className="relative group">
                  <div className="absolute -inset-1 bg-brand-green/20 blur-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <input 
                    autoFocus
                    type="text" 
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    disabled={isLoading}
                    placeholder={isLoading ? "SCANNING ENTIRE WEB..." : "ENTER FULL NAME, ORGANIZATION OR ALIAS..."}
                    className={`relative w-full bg-black border p-6 rounded-lg font-mono text-xl uppercase tracking-wider focus:outline-none transition-all text-center text-brand-green placeholder:opacity-20 ${error ? 'border-brand-red' : 'border-border focus:border-brand-green'}`}
                  />
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="mt-4 text-brand-red font-mono text-xs uppercase flex items-center justify-center gap-2"
                    >
                      <AlertCircle size={14} /> {error}
                    </motion.div>
                  )}
                  <div className="absolute bottom-2 right-2 text-[8px] font-bold text-gray-500 font-mono">
                    {isLoading ? "ESTABLISHING ENCRYPTED LINK..." : "PRESS ENTER TO RUN AUTO-SCRAPER"}
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col lg:flex-row gap-6"
            >
              <div className="flex-1 min-h-0">
                 <Dashboard state={state} />
              </div>
              <div className="w-full lg:w-[450px] shrink-0 h-full">
                 <Terminal 
                   messages={messages} 
                   onSendMessage={handleSendMessage} 
                   isLoading={isLoading} 
                   suggestedQuestions={state.suggestedQuestions}
                 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-border bg-black/40 px-6 py-2 flex justify-between items-center text-[8px] font-mono text-gray-500 uppercase tracking-widest">
         <div className="flex gap-4">
           <span>Lat: {Math.random() * 180 - 90}</span>
           <span>Long: {Math.random() * 360 - 180}</span>
           <span>Pck: {Math.floor(Math.random() * 10000)}B/s</span>
         </div>
         <div className="flex items-center gap-2">
           {state.isComplete ? (
             <span className="flex items-center gap-1 text-brand-green"><CheckCircle2 size={10} /> INVESTIGATION_COMPLETE</span>
           ) : (
             <span className="flex items-center gap-1 animate-pulse text-brand-blue"><AlertCircle size={10} /> GATHERING_IN_PROGRESS</span>
           )}
           <span>|</span>
           <span>© 2025 SENTINEL SYSTEMS CORP.</span>
         </div>
      </footer>
    </div>
  );
}
