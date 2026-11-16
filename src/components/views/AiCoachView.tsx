import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  Zap,
  Brain,
  Shield,
  Activity,
  Award,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { User, AcademyStats } from '../../types/index.ts';

export type AssistantRole = 'coach' | 'performance' | 'operations';
export type GeminiModel = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: AssistantRole;
}

interface Props {
  currentUser: User | null;
  stats: AcademyStats | null;
  onNavigateTab?: (tab: any) => void;
}

const ROLE_METADATA: Record<
  AssistantRole,
  {
    title: string;
    subtitle: string;
    badge: string;
    icon: React.ElementType;
    color: string;
    description: string;
    starters: string[];
  }
> = {
  coach: {
    title: 'Cricket Academy Coach & Advisor',
    subtitle: 'Batting, bowling, fielding technique & net practice drills',
    badge: 'Technical & Match Tactics',
    icon: Award,
    color: 'emerald',
    description: 'Expert technical advisor for stance, strokeplay, seam/spin release, wicketkeeping and drill plans.',
    starters: [
      'Design a 45-min bowling drill for U-14 fast bowlers',
      'How to correct a batsman falling over against incoming swing?',
      'Best slip catching & reflex drills for juniors',
      'Grip and seam position tips for outswing on hard wickets',
    ],
  },
  performance: {
    title: 'Player Performance & Training Consultant',
    subtitle: 'Conditioning, injury prevention, workload & match fitness',
    badge: 'Athletic High-Performance',
    icon: Activity,
    color: 'amber',
    description: 'Strength & conditioning routines, pace bowling workload safety, and warm weather hydration protocols.',
    starters: [
      'Weekly fitness routine for U-16 pace bowlers',
      'Pre-match warm-up sequence for hot Tamil Nadu weather',
      'How to prevent lower-back stress fractures in junior bowlers',
      'Core stability and rotational power drills for power hitting',
    ],
  },
  operations: {
    title: 'Academy Operations & Rules Assistant',
    subtitle: 'Fee policies, attendance rules, parent alerts & logistics',
    badge: 'Admin & Operations',
    icon: Shield,
    color: 'blue',
    description: 'Academy regulations, attendance criteria for tournaments, fee reminder templates, and safety checklists.',
    starters: [
      'Draft a polite WhatsApp fee reminder for parents',
      'Standard match-day kit & safety gear inspection checklist',
      'Draft attendance rules for tournament squad eligibility',
      'Post-monsoon turf and matting pitch maintenance checklist',
    ],
  },
};

const MODEL_OPTIONS: Array<{
  id: GeminiModel;
  name: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Fast & Reliable (Recommended)',
    description: 'Lowest latency, high availability, and rapid cricket coaching drills',
    icon: Zap,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Deep Intelligence',
    description: 'Advanced reasoning, comprehensive match analysis, and tactics',
    icon: Sparkles,
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    badge: 'Complex Reasoning (Paid Tier)',
    description: 'Deep analytical thinking for advanced match strategies and bio-mechanics',
    icon: Brain,
  },
];

export const AiCoachView: React.FC<Props> = ({ currentUser, stats }) => {
  const [selectedRole, setSelectedRole] = useState<AssistantRole>('coach');
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-3.1-flash-lite');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Initial greeting based on role
  const getInitialMessages = (role: AssistantRole): ChatMessage[] => {
    const coachNameClean = currentUser?.name
      ? currentUser.name.replace(/^Coach\s+/i, '').split(' ')[0]
      : 'Jagadeesh';
    const batchInfo = currentUser?.assignedBatches?.length
      ? ` and your assigned squads: **${currentUser.assignedBatches.join(', ')}**`
      : '';

    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `Welcome Coach ${coachNameClean}! I am your **${ROLE_METADATA[role].title}** for School of Cricket Academy (SCA), Gummudipoondi.\n\nI have real-time visibility into the academy's current records (${stats?.totalStudents ?? 16} players across ${stats?.batchesCount ?? 4} batches, ${stats?.todayAttendance?.rate ?? 75}% attendance today)${batchInfo}.\n\nHow can I assist your coaching or academy management today? Choose a suggested question below or type your query!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleUsed: role,
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages('coach'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // When role changes, add an announcement if thread is fresh or update context
  const handleRoleChange = (newRole: AssistantRole) => {
    if (newRole === selectedRole) return;
    setSelectedRole(newRole);
    setErrorNotice(null);

    // If only welcome message exists, reset to new role's welcome
    if (messages.length <= 1) {
      setMessages(getInitialMessages(newRole));
    } else {
      // Append a system transition message
      setMessages((prev) => [
        ...prev,
        {
          id: `role-switch-${Date.now()}`,
          role: 'assistant',
          content: `Switched mode to **${ROLE_METADATA[newRole].title}**.\n\n*${ROLE_METADATA[newRole].description}* How would you like to proceed?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
          roleUsed: newRole,
        },
      ]);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear current conversation thread and start a fresh session?')) {
      setMessages(getInitialMessages(selectedRole));
      setErrorNotice(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setErrorNotice(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistically update conversation thread
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setLoading(true);

    try {
      // Send conversation to backend Gemini proxy
      // Map to payload format for Gemini API
      const apiMessages = newHistory
        .filter((m) => !m.id.startsWith('role-switch')) // Filter local transitions
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.sendChatMessage(apiMessages, selectedRole, selectedModel);

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
        roleUsed: selectedRole,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg = err.message || 'Failed to get a response from Gemini';
      setErrorNotice(errMsg);

      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to complete response**: ${errMsg}.\n\n*Tip: If you selected Gemini 4 Argon, note that complex reasoning models may require a paid API key tier. You can switch to **Gemini 3.8 Flash** using the model selector above.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        roleUsed: selectedRole,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple Markdown Formatter for Assistant replies
  const renderFormattedContent = (content: string) => {
    const paragraphs = content.split('\n\n');

    return (
      <div className="space-y-2.5 text-sm leading-relaxed">
        {paragraphs.map((para, idx) => {
          // Check for bullet lists
          if (para.includes('\n* ') || para.includes('\n- ') || para.startsWith('* ') || para.startsWith('- ')) {
            const lines = para.split('\n');
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1.5 my-1.5 text-slate-800">
                {lines.map((line, lIdx) => {
                  const cleaned = line.replace(/^[\*\-]\s+/, '');
                  return <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(cleaned) }} />;
                })}
              </ul>
            );
          }

          // Check for numbered lists
          if (/^\d+\.\s/.test(para) || para.includes('\n1. ')) {
            const lines = para.split('\n');
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1.5 my-1.5 text-slate-800">
                {lines.map((line, lIdx) => {
                  const cleaned = line.replace(/^\d+\.\s+/, '');
                  return <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(cleaned) }} />;
                })}
              </ol>
            );
          }

          // Check for blockquote or tip
          if (para.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-amber-500 pl-3 py-1 my-2 bg-amber-50/60 rounded-r text-slate-700 italic text-xs"
                dangerouslySetInnerHTML={{ __html: formatInline(para.replace(/^>\s+/, '')) }}
              />
            );
          }

          // Regular paragraph
          return (
            <p
              key={idx}
              className="text-slate-800"
              dangerouslySetInnerHTML={{ __html: formatInline(para) }}
            />
          );
        })}
      </div>
    );
  };

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#1E3A5F]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono border border-slate-200">$1</code>');
  };

  const currentRoleInfo = ROLE_METADATA[selectedRole];

  return (
    <div className="space-y-4">
      {/* Top Banner / Role & Model Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/assets/aistudio/image_ea7312de.png"
                alt="SCA Cricket Academy"
                className="w-12 h-12 rounded-full object-cover border border-amber-500/40 shadow-xs bg-white"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                <Sparkles className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-[#1E3A5F] tracking-tight">SCA Cricket AI Advisor</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                  Gemini API
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Multi-turn tactical intelligence &amp; academy operations consultant
              </p>
            </div>
          </div>

          {/* Model Selector & Clear Button */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as GeminiModel)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A5F]/20 cursor-pointer min-h-[38px]"
                title="Select Gemini Model"
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Thread */}
            <button
              onClick={handleClearChat}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="mt-3.5 pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Specialist Role
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Active: <strong className="text-[#1E3A5F]">{currentRoleInfo.title}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(Object.keys(ROLE_METADATA) as AssistantRole[]).map((roleKey) => {
              const meta = ROLE_METADATA[roleKey];
              const isSelected = selectedRole === roleKey;
              const IconComp = meta.icon;

              return (
                <button
                  key={roleKey}
                  onClick={() => handleRoleChange(roleKey)}
                  className={`text-left p-3 rounded-xl border transition flex items-start gap-2.5 min-h-[56px] ${
                    isSelected
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 shadow-xs'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {meta.title}
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 line-clamp-1 ${
                        isSelected ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {meta.badge}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Chat Thread Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[560px] sm:h-[620px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                {isUser ? (
                  <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs mt-1">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                ) : (
                  <img
                    src="/assets/aistudio/image_ea7312de.png"
                    alt="SCA AI"
                    className="w-8 h-8 rounded-full object-cover border border-amber-500/40 shrink-0 shadow-xs bg-white mt-1"
                  />
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm relative group shadow-2xs ${
                    isUser
                      ? 'bg-[#1E3A5F] text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {/* Header info for assistant */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 text-[10px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                        <Sparkles className="w-3 h-3" />
                        {message.roleUsed ? ROLE_METADATA[message.roleUsed].title : 'SCA Advisor'}
                      </span>
                      <div className="flex items-center gap-2">
                        {message.modelUsed && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {message.modelUsed.replace('gemini-', '')}
                          </span>
                        )}
                        <span>{message.timestamp}</span>
                      </div>
                    </div>
                  )}

                  {/* Body Text */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                  ) : (
                    renderFormattedContent(message.content)
                  )}

                  {/* Copy Button & Timestamp for User */}
                  <div className="mt-2 pt-1 flex items-center justify-between text-[10px]">
                    {isUser ? (
                      <span className="text-white/60 ml-auto">{message.timestamp}</span>
                    ) : (
                      <button
                        onClick={() => handleCopy(message.id, message.content)}
                        className="text-slate-400 hover:text-slate-700 transition flex items-center gap-1 ml-auto pt-1 font-medium min-h-[24px]"
                        title="Copy response"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy response</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking / Loading Bubble */}
          {loading && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <img
                src="/assets/aistudio/image_ea7312de.png"
                alt="SCA AI"
                className="w-8 h-8 rounded-full object-cover border border-amber-500/40 shrink-0 shadow-xs bg-white mt-1 animate-pulse"
              />
              <div className="rounded-2xl rounded-tl-xs p-4 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A5F]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span>SCA AI Coach is thinking with {selectedModel}...</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#1E3A5F] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2.5 sm:px-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <HelpCircle className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Recommended {currentRoleInfo.badge} Questions
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {currentRoleInfo.starters.map((starter, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(starter)}
                disabled={loading}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition shrink-0 shadow-2xs hover:border-slate-300 active:scale-98 disabled:opacity-50"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        {/* Input Controls Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 rounded-b-2xl">
          {errorNotice && (
            <div className="mb-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="truncate">{errorNotice}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${currentRoleInfo.title} (e.g. drills, rules, fitness)...`}
                rows={1}
                disabled={loading}
                className="w-full resize-none py-2.5 px-3.5 pr-4 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/15 text-sm sm:text-base leading-relaxed bg-white text-slate-900 placeholder:text-slate-400 max-h-32 shadow-2xs"
                style={{ fontSize: '16px' }} // 16px ensures mobile iOS does not trigger auto-zoom
              />
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="h-11 px-4 rounded-xl bg-[#1E3A5F] hover:bg-[#152843] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-1.5 transition shadow-xs min-h-[44px]"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Grounding: Live SCA DB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
