import React, { useState } from 'react';
import {
  Bell,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { NotificationSettings } from '../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings | null;
  onSaveSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  onRunAutomatedScan: () => Promise<{ processed: number; sent: number; message: string }>;
}

export const NotificationSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onRunAutomatedScan,
}) => {
  const [autoEnabled, setAutoEnabled] = useState(settings?.autoFeeRemindersEnabled ?? true);
  const [upcomingDays, setUpcomingDays] = useState(settings?.upcomingDaysBefore ?? 3);
  const [overdueDays, setOverdueDays] = useState(settings?.overdueFrequencyDays ?? 3);
  const [upiId, setUpiId] = useState(settings?.upiId || 'vijaykumarmm30@okicici');
  const [upiNumber, setUpiNumber] = useState(settings?.upiNumber || '6380449589');
  const [helplinePhone, setHelplinePhone] = useState(settings?.helplinePhone || '+91 63804 49589');
  const [templateUpcoming, setTemplateUpcoming] = useState(
    settings?.templateUpcoming ||
      'Dear Parent, fee reminder of ₹{amount} for {student_name} ({batch}) is due on {due_date}. Please pay via UPI to {upi_id} (UPI Number: 6380449589). Helpline: +91 63804 49589.'
  );
  const [templateOverdue, setTemplateOverdue] = useState(
    settings?.templateOverdue ||
      'URGENT: Fee payment of ₹{amount} for {student_name} ({batch}) is overdue. Please settle today via UPI ({upi_id} / 6380449589) or cash at academy. Helpline: +91 63804 49589.'
  );

  const [saving, setSaving] = useState(false);
  const [runningScan, setRunningScan] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await onSaveSettings({
        autoFeeRemindersEnabled: autoEnabled,
        upcomingDaysBefore: Number(upcomingDays),
        overdueFrequencyDays: Number(overdueDays),
        upiId: upiId.trim(),
        upiNumber: upiNumber.trim(),
        helplinePhone: helplinePhone.trim(),
        templateUpcoming: templateUpcoming.trim(),
        templateOverdue: templateOverdue.trim(),
      });
      setSuccessMsg('Notification reminder rules updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerScan = async () => {
    setRunningScan(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const result = await onRunAutomatedScan();
      setSuccessMsg(
        `Automated scan completed! ${result.sent} notifications sent across ${result.processed} fee records.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Automated scan failed';
      setErrorMsg(msg);
    } finally {
      setRunningScan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Automated Reminder Settings</h3>
              <p className="text-[11px] text-slate-500">Configure fee reminder triggers &amp; message templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Master Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Automated Fee Reminders</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Automatically dispatch push &amp; WhatsApp reminders for upcoming and overdue fees
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoEnabled(!autoEnabled)}
              className={`w-12 h-7 rounded-full transition p-1 flex items-center ${
                autoEnabled ? 'bg-[#16A34A] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Timing Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="block font-semibold text-slate-700">
                Upcoming Reminder Window
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={upcomingDays}
                  onChange={(e) => setUpcomingDays(Number(e.target.value))}
                  className="w-16 bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 text-center font-bold text-sm"
                />
                <span className="text-slate-500">days before due date</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="block font-semibold text-slate-700">
                Overdue Follow-up Interval
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={overdueDays}
                  onChange={(e) => setOverdueDays(Number(e.target.value))}
                  className="w-16 bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 text-center font-bold text-sm"
                />
                <span className="text-slate-500">days interval</span>
              </div>
            </div>
          </div>

          {/* Academy UPI & Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Academy Official UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. vijaykumarmm30@okicici"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 font-mono text-xs focus:outline-none focus:border-[#1E3A5F]"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                UPI Number (GPay / PhonePe)
              </label>
              <input
                type="text"
                value={upiNumber}
                onChange={(e) => setUpiNumber(e.target.value)}
                placeholder="e.g. 6380449589"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 font-mono text-xs focus:outline-none focus:border-[#1E3A5F]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Official Helpline / Contact Number
            </label>
            <input
              type="text"
              value={helplinePhone}
              onChange={(e) => setHelplinePhone(e.target.value)}
              placeholder="e.g. +91 63804 49589"
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#1E3A5F]"
            />
          </div>

          {/* Message Template: Upcoming */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Upcoming Fee Reminder Template
              </label>
              <span className="text-[10px] text-amber-700 font-mono">
                &#123;student_name&#125;, &#123;amount&#125;, &#123;due_date&#125;, &#123;upi_id&#125;
              </span>
            </div>
            <textarea
              rows={2}
              value={templateUpcoming}
              onChange={(e) => setTemplateUpcoming(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 focus:outline-none focus:border-[#1E3A5F] resize-none text-xs"
            />
          </div>

          {/* Message Template: Overdue */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Overdue Payment Notice Template
              </label>
              <span className="text-[10px] text-[#DC2626] font-mono">
                &#123;student_name&#125;, &#123;amount&#125;, &#123;batch&#125;, &#123;upi_id&#125;
              </span>
            </div>
            <textarea
              rows={2}
              value={templateOverdue}
              onChange={(e) => setTemplateOverdue(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-3 focus:outline-none focus:border-[#1E3A5F] resize-none text-xs"
            />
          </div>

          {/* Trigger Automated Scan Now Banner */}
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block">Run Automated Scan Engine Now</span>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Scans fee records immediately and queues push reminders for overdue accounts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTriggerScan}
              disabled={runningScan}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 min-h-[40px] disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningScan ? 'animate-spin' : ''}`} />
              <span>{runningScan ? 'Scanning...' : 'Run Scan'}</span>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
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
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
