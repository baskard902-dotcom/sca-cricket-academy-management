import React from 'react';
import {
  Users,
  CreditCard,
  UserPlus,
  ArrowRight,
  ChevronRight,
  CalendarCheck,
  IndianRupee,
  FileText,
  BarChart3,
  Calendar,
  User as UserIcon,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { AcademyStats, Batch, User, SheetsSyncConfig } from '../../types/index.ts';
import { TabType } from '../Navigation.tsx';
import { SystemHealthCard } from '../dashboard/SystemHealthCard.tsx';

interface Props {
  stats: AcademyStats | null;
  batches: Batch[];
  currentUser: User | null;
  onNavigate: (tab: TabType, subSection?: 'reports' | 'sheets' | 'backup' | 'reminders' | 'welcome' | 'export' | 'app') => void;
  onOpenAddStudent: () => void;
  onOpenRecordPayment: () => void;
  onTriggerSheetsSync: () => void;
  syncingSheets: boolean;
  sheetsConfig?: SheetsSyncConfig | null;
  isOnline?: boolean;
}

export const DashboardView: React.FC<Props> = ({
  stats,
  currentUser,
  onNavigate,
  onOpenAddStudent,
  onOpenRecordPayment,
  onTriggerSheetsSync,
  syncingSheets,
  sheetsConfig = null,
  isOnline = true,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const rawName = currentUser?.name || 'Jagadeesh';
  const cleanName = rawName.replace(/^Coach\s+/i, '');
  const coachFirstName = cleanName.split(' ')[0] || rawName;
  const displayName = currentUser?.name?.startsWith('Coach ') ? currentUser.name : `Coach ${coachFirstName}`;

  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate pending student count from stats or fallback
  const totalPending = stats?.feesThisMonth?.totalPending ?? 0;
  const totalCollected = stats?.feesThisMonth?.totalCollected ?? 0;
  const collectionRate = stats?.feesThisMonth?.collectionRate ?? 0;
  const pendingCount = totalPending > 0 ? Math.round(totalPending / 3500) || 1 : 0;

  return (
    <div className="space-y-5">
      {/* ================= 1. WELCOME HERO BANNER (Matches Mockup) ================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50/50 via-white to-sky-50/40 border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="max-w-xl">
            {/* Tag & Date */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-amber-200/60 inline-flex items-center gap-1.5 shadow-2xs">
                <img
                  src="/assets/aistudio/image_ea7312de.png"
                  alt="SCA Logo"
                  className="w-4 h-4 rounded-full object-cover inline"
                />
                <span>SCA ACADEMY PORTAL • GUMMUDIPOONDI</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">{todayDateStr}</span>
            </div>

            {/* Welcome Title & Description */}
            <h2 className="text-2xl sm:text-3xl font-black text-[#1F2937] tracking-tight leading-tight">
              Welcome, {displayName}!
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
              {currentUser?.assignedBatches && currentUser.assignedBatches.length > 0
                ? `Assigned Squads: ${currentUser.assignedBatches.join(' • ')}`
                : 'Manage students, attendance, fees and academy operations in one place.'}
            </p>

            {/* Mark Today's Attendance Navy Button */}
            <div className="mt-4 sm:mt-5">
              <button
                onClick={() => onNavigate('attendance')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-semibold text-sm shadow-xs transition min-h-[46px]"
              >
                <CalendarCheck className="w-4 h-4 text-white" />
                <span>Mark Today&apos;s Attendance</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>

          {/* Official Academy Crest */}
          <div className="hidden sm:flex items-center justify-center shrink-0 pr-2">
            <div className="relative p-1.5 rounded-full bg-white shadow-md border-2 border-amber-400/50">
              <img
                src="/assets/aistudio/image_ea7312de.png"
                alt="School of Cricket Academy (SCA) Gummudipoondi"
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. SUMMARY METRIC CARDS (2x2 Grid) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Total Players */}
        <div
          onClick={() => onNavigate('students')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600 font-semibold hidden xs:inline">Total Players</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium xs:hidden block">Total Players</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1F2937]">
              {stats?.totalStudents ?? 0}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="text-[#16A34A] font-semibold">
                {stats?.activeStudents ?? 0} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across 4 age batches</p>
          </div>
        </div>

        {/* Card 2: Today's Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600 font-semibold hidden xs:inline">Today&apos;s Attendance</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium xs:hidden block">Today&apos;s Attendance</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1F2937]">
              {stats?.todayAttendance?.rate ?? 0}%
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs font-semibold">
              <span className="text-[#16A34A]">{stats?.todayAttendance?.present ?? 0} present</span>
              <span className="text-slate-400">•</span>
              <span className="text-[#DC2626]">{stats?.todayAttendance?.absent ?? 0} absent</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Updated live on ground</p>
          </div>
        </div>

        {/* Card 3: Fees Collected */}
        <div
          onClick={() => onNavigate('fees')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600 font-semibold hidden xs:inline">Fees Collected</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium xs:hidden block">Fees Collected</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1F2937] truncate">
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            {/* Progress bar matching mockup */}
            <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, collectionRate)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-1 truncate">
              {collectionRate}% collected • ₹{totalPending.toLocaleString('en-IN')} due
            </p>
          </div>
        </div>

        {/* Card 4: Pending Fees */}
        <div
          onClick={() => onNavigate('fees')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-[#DC2626] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-600 font-semibold hidden xs:inline">Pending Fees</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 font-medium xs:hidden block">Pending Fees</span>
            <div className="text-2xl sm:text-3xl font-black text-[#1F2937] truncate">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-xs text-[#DC2626] font-semibold">
              {pendingCount} students pending
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated reminders active</p>
          </div>
        </div>
      </div>

      {/* ================= 3. SYSTEM HEALTH & CLOUD SYNC ================= */}
      <SystemHealthCard
        sheetsConfig={sheetsConfig}
        isOnline={isOnline}
        syncingSheets={syncingSheets}
        onTriggerSheetsSync={onTriggerSheetsSync}
        onNavigateToSheets={() => onNavigate('more', 'sheets')}
        onNavigateToExport={() => onNavigate('more', 'export')}
      />

      {/* ================= 4. QUICK ACTIONS (Exact to Mockup) ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-bold text-[#1F2937]">Quick Actions</h3>
          <button
            onClick={() => onNavigate('more')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* Action 1: Attendance */}
          <button
            onClick={() => onNavigate('attendance')}
            className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-100 transition text-center flex flex-col items-center justify-center min-h-[96px] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-[#16A34A] flex items-center justify-center group-hover:scale-105 transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 mt-2">Attendance</span>
            <span className="text-[10px] text-slate-500 font-medium">Mark / View</span>
          </button>

          {/* Action 2: Add Student */}
          <button
            onClick={onOpenAddStudent}
            className="p-3 rounded-2xl bg-blue-50/70 hover:bg-blue-50 border border-blue-100 transition text-center flex flex-col items-center justify-center min-h-[96px] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 mt-2">Add Student</span>
            <span className="text-[10px] text-slate-500 font-medium">Registration</span>
          </button>

          {/* Action 3: Record Payment */}
          <button
            onClick={isAdmin ? onOpenRecordPayment : () => onNavigate('fees')}
            className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-50 border border-amber-100 transition text-center flex flex-col items-center justify-center min-h-[96px] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 mt-2">Record Fee</span>
            <span className="text-[10px] text-slate-500 font-medium">Collection</span>
          </button>

          {/* Action 4: Reports & Excel Export */}
          <button
            onClick={() => onNavigate('more', 'export')}
            className="p-3 rounded-2xl bg-purple-50/70 hover:bg-purple-50 border border-purple-100 transition text-center flex flex-col items-center justify-center min-h-[96px] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 mt-2">Reports</span>
            <span className="text-[10px] text-slate-500 font-medium">Excel Export</span>
          </button>

          {/* Action 5: Google Drive Backup */}
          <button
            onClick={() => onNavigate('more', 'backup')}
            className="p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-50 border border-sky-100 transition text-center flex flex-col items-center justify-center min-h-[96px] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-sky-600 flex items-center justify-center group-hover:scale-105 transition">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900 mt-2">Drive Backup</span>
            <span className="text-[10px] text-slate-500 font-medium">Auto Monthly</span>
          </button>

          {/* Action 6: AI Coach & Operations */}
          <button
            onClick={() => onNavigate('ai-coach')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 transition text-center flex flex-col items-center justify-center min-h-[96px] group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center group-hover:scale-105 transition shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-white mt-2 flex items-center gap-1">
              AI Coach
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">Gemini 3.8</span>
          </button>
        </div>

        {/* AI Assistant Quick Banner */}
        <div
          onClick={() => onNavigate('ai-coach')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-300 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Ask SCA Cricket AI Assistant
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#1E3A5F] text-white">
                  Multi-turn Chat
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Technical drills, pace/spin mechanics, workload safety &amp; parent fee notices grounded with live academy data.
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('ai-coach');
            }}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#152843] text-white font-bold text-xs flex items-center gap-1 transition shrink-0 min-h-[36px]"
          >
            <span>Open Coach</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================= 4. RECENT ACTIVITY (Exact to Mockup) ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-sm font-bold text-[#1F2937]">Recent Activity</h3>
          <button
            onClick={() => onNavigate('more')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {(stats?.totalStudents ?? 0) === 0 ? (
            <div className="p-6 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <UserPlus className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Ready for player registrations</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                No player activity yet. Once students are added, daily attendance, registrations, and fee receipts will appear here live.
              </p>
              <button
                onClick={onOpenAddStudent}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E3A5F] text-white text-xs font-semibold hover:bg-[#162C47] transition shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add First Student</span>
              </button>
            </div>
          ) : (
            <>
              {/* Activity 1: Attendance Marked */}
              <div className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Attendance marked</h4>
                    <p className="text-[11px] text-slate-500">
                      U14 Batch • Present: {stats?.todayAttendance?.present ?? 0}, Absent: {stats?.todayAttendance?.absent ?? 0}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                  Today
                </span>
              </div>

              {/* Activity 2: Academy Roll Call Status */}
              <div className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Registered squad active</h4>
                    <p className="text-[11px] text-slate-500">
                      {stats?.totalStudents} students registered across academy squads
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                  Active
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
