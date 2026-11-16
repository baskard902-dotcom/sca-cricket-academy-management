import React, { useState } from 'react';
import { User } from '../types/index.ts';
import {
  ShieldCheck,
  UserCheck,
  X,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onLogin?: (nameOrUsername: string, password: string) => Promise<void>;
  onLogout?: () => Promise<void>;
}

// Preset coach credentials for fast filling
const PRESET_COACHES = [
  {
    coachNumber: 1,
    name: 'Jagadeesh',
    fullName: 'Coach Jagadeesh',
    username: 'jagadeesh',
    password: 'jaga@12',
    role: 'coach' as const,
    batches: 'Morning U-12 & Morning U-14',
    badge: 'Coach 1',
    color: 'emerald',
  },
  {
    coachNumber: 2,
    name: 'Baskar',
    fullName: 'Coach Baskar',
    username: 'baskar',
    password: 'baskar@12',
    role: 'coach' as const,
    batches: 'Morning U-14 & Evening U-16',
    badge: 'Coach 2',
    color: 'blue',
  },
  {
    coachNumber: 3,
    name: 'Vijay',
    fullName: 'Coach Vijay',
    username: 'vijay',
    password: 'vijay@12',
    role: 'coach' as const,
    batches: 'Evening U-16 & Evening Elite U-19',
    badge: 'Coach 3',
    color: 'indigo',
  },
  {
    coachNumber: 4,
    name: 'Gokul',
    fullName: 'Coach Gokul',
    username: 'gokul',
    password: 'gokul@12',
    role: 'coach' as const,
    batches: 'Evening Elite U-19 & Morning U-12',
    badge: 'Coach 4',
    color: 'amber',
  },
  {
    coachNumber: 0,
    name: 'Admin',
    fullName: 'Academy Administrator',
    username: 'admin',
    password: 'admin@12',
    role: 'admin' as const,
    batches: 'All Academy Batches (Full Access)',
    badge: 'Admin',
    color: 'navy',
  },
];

export const RoleSwitcherModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSelectUser,
  onLogin,
  onLogout,
}) => {
  const [coachName, setCoachName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'directory'>('login');

  if (!isOpen) return null;

  // Handle form submission
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachName.trim()) {
      setErrorMessage('Please enter your Coach Name or Username');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (onLogin) {
        await onLogin(coachName.trim(), password.trim());
      } else {
        // Fallback: match in allUsers
        const matched = allUsers.find(
          (u) =>
            u.username?.toLowerCase() === coachName.trim().toLowerCase() ||
            u.name.toLowerCase().includes(coachName.trim().toLowerCase())
        );
        if (matched) {
          onSelectUser(matched);
        } else {
          throw new Error('Coach not found');
        }
      }
      setSuccessMessage(`Logged in successfully as ${coachName.trim()}!`);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid Coach Name or Password';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick 1-tap select and login
  const handleQuickSelectCoach = async (preset: typeof PRESET_COACHES[0]) => {
    setCoachName(preset.name);
    setPassword(preset.password);
    setErrorMessage(null);
    setSubmitting(true);

    try {
      if (onLogin) {
        await onLogin(preset.username, preset.password);
      } else {
        const matched = allUsers.find(
          (u) =>
            u.username === preset.username ||
            u.name.toLowerCase().includes(preset.name.toLowerCase())
        );
        if (matched) onSelectUser(matched);
      }
      setSuccessMessage(`Logged in as ${preset.fullName}!`);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillCredentials = (preset: typeof PRESET_COACHES[0]) => {
    setCoachName(preset.name);
    setPassword(preset.password);
    setActiveTab('login');
    setErrorMessage(null);
  };

  const handleLogoutClick = async () => {
    if (onLogout) {
      await onLogout();
    }
    setCoachName('');
    setPassword('');
    setErrorMessage(null);
    setSuccessMessage('Logged out successfully');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-2xl text-slate-900 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <img
                src="/assets/aistudio/image_ea7312de.png"
                alt="SCA Cricket Academy"
                className="w-9 h-9 rounded-full object-cover border border-amber-500/40 bg-white"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1E3A5F] leading-tight">
                Coach &amp; Admin Portal Access
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                School of Cricket Academy (SCA) • Gummudipoondi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Session Bar */}
        {currentUser && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Active: {currentUser.name}
                </span>
                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                  {currentUser.role}
                </span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={handleLogoutClick}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline px-2 py-1"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            )}
          </div>
        )}

        {/* Tabs: Login Form vs Coach Cards */}
        <div className="flex gap-1 mt-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-[#1E3A5F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Login with Name &amp; Password</span>
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-white text-[#1E3A5F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Coaches (1-Tap Access)</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="mt-3 overflow-y-auto space-y-3 flex-1 pr-0.5">
          {activeTab === 'login' ? (
            <div>
              {/* Quick Preset Selector Buttons */}
              <div className="mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Quick Select Coach:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COACHES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleFillCredentials(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                        coachName.toLowerCase() === preset.name.toLowerCase()
                          ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="text-[10px] opacity-75 font-normal">({preset.badge})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmitLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coach Name / Username
                  </label>
                  <input
                    type="text"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    placeholder="e.g. Jagadeesh, Baskar, Vijay, Gokul, or Admin"
                    autoComplete="username"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm bg-white text-slate-900 min-h-[44px]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts exact name (e.g. &apos;Jagadeesh&apos;) or username (case-insensitive).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter coach password"
                      autoComplete="current-password"
                      className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent text-sm bg-white text-slate-900 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Configured passwords: Jagadeesh: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">jaga@12</code>, Baskar: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">baskar@12</code>, Vijay: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">vijay@12</code>, Gokul: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">gokul@12</code>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs min-h-[46px] disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{submitting ? 'Authenticating Coach...' : 'Log In to Academy Portal'}</span>
                </button>
              </form>
            </div>
          ) : (
            /* 1-Tap Directory Tab */
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Click any coach below to immediately log in and activate their squad batches:
              </p>
              {PRESET_COACHES.map((preset) => {
                const isActive =
                  currentUser?.name.toLowerCase().includes(preset.name.toLowerCase()) ||
                  (preset.role === 'admin' && currentUser?.role === 'admin');

                return (
                  <div
                    key={preset.name}
                    className={`p-3 rounded-xl border transition flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-50/70 border-amber-400 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          preset.role === 'admin'
                            ? 'bg-[#1E3A5F] text-amber-400'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {preset.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">{preset.fullName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                              preset.role === 'admin'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {preset.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>Batches: {preset.batches}</span>
                          <span className="text-slate-400">•</span>
                          <span>
                            Pass: <code className="font-mono font-bold text-slate-700">{preset.password}</code>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span className="hidden xs:inline">Active</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickSelectCoach(preset)}
                          disabled={submitting}
                          className="px-3 py-1.5 rounded-lg bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs min-h-[36px]"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Login</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            SCA Gummudipoondi • Secure RBAC System
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[38px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
