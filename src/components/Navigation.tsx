import React from 'react';
import {
  Users,
  CreditCard,
  Menu,
  ShieldCheck,
  UserCheck,
  Download,
  WifiOff,
  Lock,
  Bell,
  ChevronDown,
  Home,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { User } from '../types/index.ts';

export type TabType = 'dashboard' | 'students' | 'attendance' | 'fees' | 'more' | 'ai-coach';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser: User | null;
  onOpenRoleSwitcher: () => void;
  onOpenPWAInstall: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  isOnline: boolean;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  onTabChange,
  currentUser,
  onOpenRoleSwitcher,
  onOpenPWAInstall,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  isOnline,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const rawName = currentUser?.name || 'User';
  const cleanName = rawName.replace(/^Coach\s+/i, '');
  const firstName = cleanName.split(' ')[0] || rawName;
  const initial = firstName.charAt(0).toUpperCase() || 'U';

  return (
    <>
      {/* ================= MOBILE HEADER (Exact to Mockup) ================= */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
        {/* Brand Shield & Title */}
        <div className="flex items-center gap-2.5">
          {/* SCA Official Emblem Logo */}
          <div className="relative shrink-0">
            <img
              src="/assets/aistudio/image_ea7312de.png"
              alt="School of Cricket Academy (SCA) Gummudipoondi"
              className="w-10 h-10 rounded-full object-cover shadow-xs border border-amber-500/30 bg-white"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base text-[#1E3A5F] tracking-tight leading-tight">
                SCA Cricket
              </h1>
              {!isOnline && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 border border-red-200 font-medium">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Academy Management</p>
          </div>
        </div>

        {/* Right Header: AI Coach + Notification Bell + User Profile Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Coach Quick Launcher */}
          <button
            onClick={() => onTabChange('ai-coach')}
            className={`px-2.5 py-1.5 rounded-full border transition flex items-center gap-1 min-h-[36px] ${
              activeTab === 'ai-coach'
                ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
            title="SCA AI Cricket & Operations Coach"
            aria-label="SCA AI Coach"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] font-black tracking-tight">AI Coach</span>
          </button>

          {/* Notification Bell */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-center relative min-h-[36px]"
              title="Notifications & Fee Reminders"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute 1 top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white shadow-xs" />
              )}
            </button>
          )}

          {/* User Profile Menu (Avatar + Name + Role + Chevron) */}
          <button
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full hover:bg-slate-100 transition border border-transparent hover:border-slate-200 min-h-[38px]"
            title="Switch User / Role"
            aria-label="Switch User / Role"
          >
            <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {initial}
            </div>
            <div className="text-left hidden xs:block">
              <span className="block text-xs font-bold text-slate-900 leading-tight truncate max-w-[65px]">
                {firstName}
              </span>
              <span className="block text-[10px] text-slate-500 capitalize leading-tight">
                {currentUser?.role || 'User'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAVIGATION (Exact to Mockup) ================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {/* 1. Dashboard / Home */}
          <button
            onClick={() => onTabChange('dashboard')}
            className="relative flex flex-col items-center justify-center h-full transition min-h-[44px]"
          >
            <Home
              className={`w-5 h-5 transition ${
                activeTab === 'dashboard' ? 'text-amber-500 fill-amber-500/20' : 'text-slate-500'
              }`}
            />
            <span
              className={`text-[10px] font-semibold tracking-tight mt-0.5 ${
                activeTab === 'dashboard' ? 'text-amber-600 font-bold' : 'text-slate-500'
              }`}
            >
              Home
            </span>
            {activeTab === 'dashboard' && (
              <span className="absolute bottom-0 w-8 h-[3px] bg-amber-500 rounded-full" />
            )}
          </button>

          {/* 2. Students */}
          <button
            onClick={() => onTabChange('students')}
            className="relative flex flex-col items-center justify-center h-full transition min-h-[44px]"
          >
            <Users
              className={`w-5 h-5 transition ${
                activeTab === 'students' ? 'text-[#1E3A5F]' : 'text-slate-500'
              }`}
            />
            <span
              className={`text-[10px] font-semibold tracking-tight mt-0.5 ${
                activeTab === 'students' ? 'text-[#1E3A5F] font-bold' : 'text-slate-500'
              }`}
            >
              Students
            </span>
            {activeTab === 'students' && (
              <span className="absolute bottom-0 w-8 h-[3px] bg-[#1E3A5F] rounded-full" />
            )}
          </button>

          {/* 3. Attendance */}
          <button
            onClick={() => onTabChange('attendance')}
            className="relative flex flex-col items-center justify-center h-full transition min-h-[44px]"
          >
            <CalendarCheck
              className={`w-5 h-5 transition ${
                activeTab === 'attendance' ? 'text-[#16A34A]' : 'text-slate-500'
              }`}
            />
            <span
              className={`text-[10px] font-semibold tracking-tight mt-0.5 ${
                activeTab === 'attendance' ? 'text-[#16A34A] font-bold' : 'text-slate-500'
              }`}
            >
              Attend
            </span>
            {activeTab === 'attendance' && (
              <span className="absolute bottom-0 w-8 h-[3px] bg-[#16A34A] rounded-full" />
            )}
          </button>

          {/* 4. Fees */}
          <button
            onClick={() => onTabChange('fees')}
            className="relative flex flex-col items-center justify-center h-full transition min-h-[44px]"
          >
            <CreditCard
              className={`w-5 h-5 transition ${
                activeTab === 'fees' ? 'text-[#1E3A5F]' : 'text-slate-500'
              }`}
            />
            <span
              className={`text-[10px] font-semibold tracking-tight mt-0.5 flex items-center gap-0.5 ${
                activeTab === 'fees' ? 'text-[#1E3A5F] font-bold' : 'text-slate-500'
              }`}
            >
              Fees {!isAdmin && <Lock className="w-2.5 h-2.5 text-slate-400" />}
            </span>
            {activeTab === 'fees' && (
              <span className="absolute bottom-0 w-8 h-[3px] bg-[#1E3A5F] rounded-full" />
            )}
          </button>

          {/* 5. More */}
          <button
            onClick={() => onTabChange('more')}
            className="relative flex flex-col items-center justify-center h-full transition min-h-[44px]"
          >
            <Menu
              className={`w-5 h-5 transition ${
                activeTab === 'more' ? 'text-[#1E3A5F]' : 'text-slate-500'
              }`}
            />
            <span
              className={`text-[10px] font-semibold tracking-tight mt-0.5 ${
                activeTab === 'more' ? 'text-[#1E3A5F] font-bold' : 'text-slate-500'
              }`}
            >
              More
            </span>
            {activeTab === 'more' && (
              <span className="absolute bottom-0 w-8 h-[3px] bg-[#1E3A5F] rounded-full" />
            )}
          </button>
        </div>
      </nav>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 select-none shadow-xs">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <img
            src="/assets/aistudio/image_ea7312de.png"
            alt="School of Cricket Academy (SCA) Gummudipoondi"
            className="w-12 h-12 rounded-full object-cover shadow-xs border border-amber-500/40 bg-white shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm text-[#1E3A5F] tracking-tight leading-tight truncate">
              School of Cricket Academy
            </h1>
            <p className="text-[11px] text-amber-600 font-bold truncate">SCA • Gummudipoondi</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Primary
          </div>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition min-h-[44px] ${
              activeTab === 'dashboard'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            Dashboard
          </button>

          <button
            onClick={() => onTabChange('students')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition min-h-[44px] ${
              activeTab === 'students'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Students Directory
          </button>

          <button
            onClick={() => onTabChange('attendance')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition min-h-[44px] ${
              activeTab === 'attendance'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-4 h-4 shrink-0" />
              Mark Attendance
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>

          <button
            onClick={() => onTabChange('fees')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition min-h-[44px] ${
              activeTab === 'fees'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 shrink-0" />
              Fee Ledger
            </div>
            {!isAdmin && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" /> Admin
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('ai-coach')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition min-h-[44px] ${
              activeTab === 'ai-coach'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              <span>AI Coach &amp; Advisor</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
              Gemini
            </span>
          </button>

          <div className="pt-4 px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Academy Tools
          </div>

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Fee Reminders &amp; Alerts</span>
              </div>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => onTabChange('more')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition min-h-[44px] ${
              activeTab === 'more'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Menu className="w-4 h-4 shrink-0" />
            Reports, Sheets &amp; Backup
          </button>

          <button
            onClick={onOpenPWAInstall}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition min-h-[44px]"
          >
            <Download className="w-4 h-4 shrink-0 text-amber-500" />
            Install App / Offline
          </button>
        </div>

        {/* Current User Card & Role Switcher */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onOpenRoleSwitcher}
            className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-left transition shadow-xs"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {initial}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                  <span>{currentUser?.role} Account</span>
                  <span className="text-amber-600 font-semibold">• Switch</span>
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </aside>
    </>
  );
};
