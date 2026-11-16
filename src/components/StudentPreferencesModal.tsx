import React, { useState } from 'react';
import {
  Bell,
  X,
  Save,
  CheckCircle2,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import { Student, NotificationPreferences } from '../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSavePreferences: (studentId: string, prefs: NotificationPreferences) => Promise<void>;
}

export const StudentPreferencesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  onSavePreferences,
}) => {
  const defaultPrefs: NotificationPreferences = {
    pushEnabled: true,
    whatsappEnabled: true,
    overdueAlerts: true,
    upcomingDueDateAlerts: true,
    attendanceAlerts: true,
  };

  const initial = student?.notificationPreferences || defaultPrefs;

  const [pushEnabled, setPushEnabled] = useState(initial.pushEnabled);
  const [whatsappEnabled, setWhatsappEnabled] = useState(initial.whatsappEnabled);
  const [overdueAlerts, setOverdueAlerts] = useState(initial.overdueAlerts);
  const [upcomingDueDateAlerts, setUpcomingDueDateAlerts] = useState(initial.upcomingDueDateAlerts);
  const [attendanceAlerts, setAttendanceAlerts] = useState(initial.attendanceAlerts);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      await onSavePreferences(student.id, {
        pushEnabled,
        whatsappEnabled,
        overdueAlerts,
        upcomingDueDateAlerts,
        attendanceAlerts,
      });
      setSuccessMsg('Parent notification preferences saved!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Notification Preferences</h3>
              <p className="text-[11px] text-slate-500">
                {student.name} ({student.id}) • Parent: {student.guardianName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <p className="text-slate-600 text-[11px] leading-relaxed">
            Customize which automated reminders are delivered for this player&apos;s parents via mobile push and WhatsApp to{' '}
            <strong className="text-slate-900">{student.guardianPhone}</strong>:
          </p>

          {/* Toggle 1: Push Notifications */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <div>
                <span className="font-semibold text-slate-900 block">Device Push Notifications</span>
                <span className="text-[10px] text-slate-500">Receive in-app &amp; OS banner alerts</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-11 h-6 rounded-full transition p-0.5 flex items-center ${
                pushEnabled ? 'bg-[#1E3A5F] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Toggle 2: WhatsApp Messages */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-[#16A34A]" />
              <div>
                <span className="font-semibold text-slate-900 block">WhatsApp Reminders</span>
                <span className="text-[10px] text-slate-500">Direct WhatsApp reminders to guardian phone</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWhatsappEnabled(!whatsappEnabled)}
              className={`w-11 h-6 rounded-full transition p-0.5 flex items-center ${
                whatsappEnabled ? 'bg-[#16A34A] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Reminder Categories
            </span>

            {/* Sub-toggle: Overdue */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
              <span className="text-slate-700">Overdue Fee Payment Reminders</span>
              <input
                type="checkbox"
                checked={overdueAlerts}
                onChange={(e) => setOverdueAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#1E3A5F] rounded"
              />
            </label>

            {/* Sub-toggle: Upcoming */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
              <span className="text-slate-700">Upcoming Due Date Notices</span>
              <input
                type="checkbox"
                checked={upcomingDueDateAlerts}
                onChange={(e) => setUpcomingDueDateAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#1E3A5F] rounded"
              />
            </label>

            {/* Sub-toggle: Attendance */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
              <span className="text-slate-700">Daily Attendance Updates</span>
              <input
                type="checkbox"
                checked={attendanceAlerts}
                onChange={(e) => setAttendanceAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#1E3A5F] rounded"
              />
            </label>
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
