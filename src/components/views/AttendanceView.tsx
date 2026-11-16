import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Info,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { Student, Batch, AttendanceRecord, User } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface Props {
  students: Student[];
  batches: Batch[];
  currentUser: User | null;
  onRefreshData?: () => void;
}

export const AttendanceView: React.FC<Props> = ({
  students,
  batches,
  currentUser,
  onRefreshData,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedBatch, setSelectedBatch] = useState<string>(
    currentUser?.assignedBatches?.[0] || batches[0]?.name || 'Evening Batch'
  );

  // Status mapping: studentId -> 'present' | 'absent' | 'late'
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [loadingExisting, setLoadingExisting] = useState<boolean>(false);
  const [isExistingRecord, setIsExistingRecord] = useState<boolean>(false);
  const [lastMarkedInfo, setLastMarkedInfo] = useState<string | null>(null);

  // Saving state
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedAbsentList, setSavedAbsentList] = useState<
    Array<{ studentId: string; studentName: string; guardianPhone: string; whatsappLink: string }>
  >([]);
  const [savedLowAttList, setSavedLowAttList] = useState<
    Array<{ studentId: string; studentName: string; attendanceRate: number; guardianPhone: string; whatsappLink: string }>
  >([]);

  // Filter students belonging to the selected batch
  const batchStudents = useMemo(() => {
    return students.filter((s) => s.batch === selectedBatch && s.active);
  }, [students, selectedBatch]);

  // Load existing attendance for date + batch
  useEffect(() => {
    let isMounted = true;
    async function loadBatchAttendance() {
      setLoadingExisting(true);
      setErrorMessage(null);
      setSaveSuccessMessage(null);
      try {
        const records: AttendanceRecord[] = await api.getAttendance(selectedDate, selectedBatch);
        if (!isMounted) return;

        if (records.length > 0) {
          setIsExistingRecord(true);
          setLastMarkedInfo(
            `Marked by ${records[0].markedBy} at ${new Date(records[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          );
          const map: Record<string, 'present' | 'absent' | 'late'> = {};
          records.forEach((r) => {
            map[r.studentId] = r.status;
          });
          // Ensure all active batch students have an entry
          batchStudents.forEach((s) => {
            if (!map[s.id]) map[s.id] = 'present';
          });
          setAttendanceMap(map);
        } else {
          setIsExistingRecord(false);
          setLastMarkedInfo(null);
          // Default all active players to 'present' for fast 1-tap submission
          const map: Record<string, 'present' | 'absent' | 'late'> = {};
          batchStudents.forEach((s) => {
            map[s.id] = 'present';
          });
          setAttendanceMap(map);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Could not check existing attendance';
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) setLoadingExisting(false);
      }
    }

    loadBatchAttendance();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedBatch, batchStudents]);

  // Bulk actions
  const handleSelectAllPresent = () => {
    const nextMap: Record<string, 'present' | 'absent' | 'late'> = {};
    batchStudents.forEach((s) => {
      nextMap[s.id] = 'present';
    });
    setAttendanceMap(nextMap);
  };

  const handleSelectAllAbsent = () => {
    const nextMap: Record<string, 'present' | 'absent' | 'late'> = {};
    batchStudents.forEach((s) => {
      nextMap[s.id] = 'absent';
    });
    setAttendanceMap(nextMap);
  };

  const setStudentStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Metrics
  const presentCount = Object.values(attendanceMap).filter((st) => st === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((st) => st === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter((st) => st === 'late').length;
  const total = batchStudents.length;
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (saving || batchStudents.length === 0) return;
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    const records = batchStudents.map((s) => ({
      studentId: s.id,
      status: attendanceMap[s.id] || 'present',
    }));

    try {
      const res = await api.saveAttendance(selectedDate, selectedBatch, records);
      setIsExistingRecord(true);
      setSaveSuccessMessage(
        `${res.isUpdate ? 'Updated' : 'Saved'} attendance for ${res.savedCount} players (${presentCount} Present)`
      );
      if (res.absentStudents && res.absentStudents.length > 0) {
        setSavedAbsentList(res.absentStudents);
      } else {
        setSavedAbsentList([]);
      }
      if (res.lowAttendanceStudents && res.lowAttendanceStudents.length > 0) {
        setSavedLowAttList(res.lowAttendanceStudents);
      } else {
        setSavedLowAttList([]);
      }
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save attendance';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#1F2937] tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#16A34A]" />
              Mark Squad Attendance
            </h2>
            <p className="text-xs text-[#64748B]">
              High-speed daily roll call for coaches on ground
            </p>
          </div>

          {/* Quick Date Picker & Chips */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[38px] ${
                selectedDate === todayStr
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Today
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#1E3A5F] min-h-[38px]"
            />
          </div>
        </div>

        {/* Batch Selector Carousel/Tabs */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Training Batch
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            {batches.map((b) => {
              const isSelected = selectedBatch === b.name;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatch(b.name)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 min-h-[44px] ${
                    isSelected
                      ? 'bg-[#1E3A5F] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  <span>{b.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {students.filter((s) => s.batch === b.name && s.active).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notice of Existing Record */}
        {isExistingRecord && (
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs text-sky-800">
            <div className="flex items-center gap-2 truncate">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="truncate">
                Attendance was already taken for this batch on {selectedDate}.
              </span>
            </div>
            {lastMarkedInfo && (
              <span className="text-[10px] text-sky-700 shrink-0 hidden sm:inline font-medium">
                {lastMarkedInfo}
              </span>
            )}
          </div>
        )}

        {/* Feedback Messages */}
        {saveSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
        )}

        {/* Instant WhatsApp Absent Alerts Dispatcher Card */}
        {savedAbsentList.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50/90 border border-rose-200 text-xs text-rose-900 space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Absent Players ({savedAbsentList.length}) - Send Instant WhatsApp Alerts to Parents:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {savedAbsentList.map((st) => (
                <div key={st.studentId} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-rose-200 shadow-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{st.studentName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{st.guardianPhone}</span>
                  </div>
                  <a
                    href={st.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-[11px] shadow-xs transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Attendance Notice Dispatcher Card */}
        {savedLowAttList.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Low Attendance Warning (&lt;75%) - Send Improvement Notice via WhatsApp:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {savedLowAttList.map((st) => (
                <div key={st.studentId} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200 shadow-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{st.studentName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold">{st.attendanceRate}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{st.guardianPhone}</span>
                  </div>
                  <a
                    href={st.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-[11px] shadow-xs transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send Notice</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Summary Counts & Bulk Actions */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-600">
              Total: <strong className="text-slate-900">{total}</strong>
            </span>
            <span className="text-[#16A34A] font-bold">
              ✓ {presentCount} Present
            </span>
            <span className="text-[#DC2626] font-bold">
              ✗ {absentCount} Absent
            </span>
            {lateCount > 0 && (
              <span className="text-[#D97706] font-bold">
                ⏰ {lateCount} Late
              </span>
            )}
            <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-800 font-extrabold">
              {attendanceRate}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllPresent}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition min-h-[40px]"
            >
              All Present (✓)
            </button>
            <button
              onClick={handleSelectAllAbsent}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition min-h-[40px]"
            >
              All Absent (✗)
            </button>
          </div>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="space-y-2.5">
        {loadingExisting ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <p className="text-xs font-medium">Loading batch attendance records...</p>
          </div>
        ) : batchStudents.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-white border border-slate-200">
            <p className="text-sm font-semibold text-slate-800">No active students in this batch.</p>
            <p className="text-xs text-slate-500 mt-1">
              Add players to &quot;{selectedBatch}&quot; from the Students tab.
            </p>
          </div>
        ) : (
          batchStudents.map((student, index) => {
            const currentStatus = attendanceMap[student.id] || 'present';

            return (
              <div
                key={student.id}
                className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  currentStatus === 'present'
                    ? 'bg-white border-slate-200 hover:border-emerald-300'
                    : currentStatus === 'absent'
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      currentStatus === 'present'
                        ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                        : currentStatus === 'absent'
                        ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                        : 'bg-amber-50 text-[#D97706] border border-amber-200'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 tracking-tight">
                        {student.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium border border-slate-200">
                        {student.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{student.role}</span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400 font-medium">{student.bloodGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Status Selection Buttons & WhatsApp Alert */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                  <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center">
                    {/* Present Button */}
                    <button
                      type="button"
                      onClick={() => setStudentStatus(student.id, 'present')}
                      className={`h-12 sm:h-10 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        currentStatus === 'present'
                          ? 'bg-[#16A34A] text-white shadow-xs font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      aria-label={`Mark ${student.name} Present`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Present</span>
                    </button>

                    {/* Absent Button */}
                    <button
                      type="button"
                      onClick={() => setStudentStatus(student.id, 'absent')}
                      className={`h-12 sm:h-10 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        currentStatus === 'absent'
                          ? 'bg-[#DC2626] text-white shadow-xs font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                      aria-label={`Mark ${student.name} Absent`}
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Absent</span>
                    </button>

                    {/* Late Button */}
                    <button
                      type="button"
                      onClick={() => setStudentStatus(student.id, 'late')}
                      className={`h-12 sm:h-10 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                        currentStatus === 'late'
                          ? 'bg-[#D97706] text-white shadow-xs font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                      aria-label={`Mark ${student.name} Late`}
                    >
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Late</span>
                    </button>
                  </div>

                  {/* Instant WhatsApp Alert to Parent if Absent */}
                  {currentStatus === 'absent' && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=${student.guardianPhone.replace(/\D/g, '')}&text=${encodeURIComponent(
                        [
                          `🏏 *SCA CRICKET ACADEMY*`,
                          `━━━━━━━━━━━━━━━━━━━━━━`,
                          `🚨 *ATTENDANCE ALERT: ABSENT*`,
                          `━━━━━━━━━━━━━━━━━━━━━━`,
                          ``,
                          `Dear Parent / Guardian,`,
                          ``,
                          `This is an official notification to inform you that your child was marked *ABSENT* for today's training session:`,
                          ``,
                          `📋 *Session Details:*`,
                          `• *Student Name:* ${student.name}`,
                          `• *Student ID:* ${student.id}`,
                          `• *Batch:* ${selectedBatch} (04:30 PM - 07:00 PM)`,
                          `• *Date:* ${selectedDate}`,
                          `• *Marked By:* ${currentUser?.name || 'Academy Coach'}`,
                          `• *Attendance Status:* ❌ ABSENT`,
                          ``,
                          `⚠️ *Important Safety Notice:*`,
                          `If this absence was unplanned or if your child had left home for academy practice, please contact coaching staff immediately for their safety.`,
                          ``,
                          `📞 *Academy Helpline:* +91 63804 49589`,
                          `📍 *Venue:* SCA Cricket Academy Grounds`,
                          `━━━━━━━━━━━━━━━━━━━━━━`,
                          `_SCA Academy Management System_ 🏏`,
                        ].join('\n')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-xl font-bold text-xs bg-[#25D366] hover:bg-[#1EBE5D] text-white flex items-center justify-center gap-1.5 transition shadow-xs whitespace-nowrap"
                      title="Send Instant WhatsApp Absent Alert to Parent"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>WhatsApp Alert</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating / Sticky Save Attendance Bar */}
      {batchStudents.length > 0 && (
        <div className="sticky bottom-16 md:bottom-4 z-30 pt-2">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3">
            <div className="text-xs text-slate-600 pl-1">
              <span className="font-bold text-slate-900 block">{selectedBatch}</span>
              <p className="text-[11px] text-slate-500">
                {presentCount} Present, {absentCount} Absent
              </p>
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] active:scale-98 text-white font-bold text-sm shadow-md transition min-h-[48px] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Attendance</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
