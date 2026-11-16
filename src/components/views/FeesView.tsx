import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldAlert,
  Receipt,
  X,
  PlusCircle,
  History,
  Bell,
  MessageCircle,
  Play,
  Settings,
} from 'lucide-react';
import { FeeRecord, Batch, User, PaymentMode, NotificationItem, Student } from '../../types/index.ts';

interface Props {
  fees: FeeRecord[];
  students?: Student[];
  batches: Batch[];
  currentUser: User | null;
  onOpenRoleSwitcher: () => void;
  onRecordPayment: (
    studentId: string,
    monthYear: string,
    payment: {
      amount: number;
      mode: PaymentMode;
      referenceNo: string;
      notes?: string;
    }
  ) => Promise<any>;
  isRecordPaymentOpen: boolean;
  setIsRecordPaymentOpen: (open: boolean) => void;
  onSendFeeReminder?: (
    studentId: string,
    monthYear: string
  ) => Promise<{ success: boolean; notification: NotificationItem; message: string }>;
  onOpenNotificationSettings?: () => void;
  onRunAutomatedScan?: () => Promise<{ processed: number; sent: number; message: string }>;
}

export const FeesView: React.FC<Props> = ({
  fees,
  students = [],
  batches,
  currentUser,
  onOpenRoleSwitcher,
  onRecordPayment,
  isRecordPaymentOpen,
  setIsRecordPaymentOpen,
  onSendFeeReminder,
  onOpenNotificationSettings,
  onRunAutomatedScan,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Filters
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Recording Modal State
  const [targetFeeRecord, setTargetFeeRecord] = useState<FeeRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [recordedReceiptLink, setRecordedReceiptLink] = useState<string | null>(null);

  // History view modal
  const [historyRecord, setHistoryRecord] = useState<FeeRecord | null>(null);

  // Reminder states
  const [sendingReminderStudentId, setSendingReminderStudentId] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<{
    studentId: string;
    message: string;
    waLink?: string;
  } | null>(null);
  const [runningAutomatedScan, setRunningAutomatedScan] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  const handleSendReminder = async (studentId: string, monthYear: string) => {
    if (!onSendFeeReminder) return;
    setSendingReminderStudentId(studentId);
    try {
      const res = await onSendFeeReminder(studentId, monthYear);
      setReminderToast({
        studentId,
        message: res.message || 'Fee reminder dispatched!',
        waLink: res.notification.whatsappLink,
      });
      setTimeout(() => {
        setReminderToast((prev) => (prev?.studentId === studentId ? null : prev));
      }, 7000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reminder';
      setReminderToast({ studentId, message: msg });
    } finally {
      setSendingReminderStudentId(null);
    }
  };

  const handleRunScan = async () => {
    if (!onRunAutomatedScan) return;
    setRunningAutomatedScan(true);
    setScanToast(null);
    try {
      const res = await onRunAutomatedScan();
      setScanToast(res.message);
      setTimeout(() => setScanToast(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Automated scan failed';
      setScanToast(msg);
    } finally {
      setRunningAutomatedScan(false);
    }
  };

  // Filtered fee records
  const filteredFees = useMemo(() => {
    return fees.filter((f) => {
      if (f.monthYear !== selectedMonth) return false;

      if (selectedBatch !== 'all' && f.batch !== selectedBatch) return false;

      if (selectedStatus !== 'all' && f.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          f.studentName.toLowerCase().includes(q) ||
          f.studentId.toLowerCase().includes(q) ||
          f.batch.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [fees, selectedMonth, selectedBatch, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const totalBilled = filteredFees.reduce((sum, f) => sum + f.monthlyFee, 0);
  const totalCollected = filteredFees.reduce((sum, f) => sum + f.amountPaid, 0);
  const totalPending = filteredFees.reduce((sum, f) => sum + f.balance, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Open Payment Modal
  const handleOpenRecordPayment = (record: FeeRecord) => {
    setTargetFeeRecord(record);
    setPaymentAmount(record.balance > 0 ? record.balance : record.monthlyFee);
    setPaymentMode('UPI');
    setPaymentRef(`UPI/SCA/${Date.now().toString().slice(-6)}`);
    setPaymentNotes('');
    setPaymentError(null);
    setPaymentSuccess(null);
    setRecordedReceiptLink(null);
    setIsRecordPaymentOpen(true);
  };

  // Auto-initialize targetFeeRecord when opened externally (e.g. from Dashboard Quick Action)
  React.useEffect(() => {
    if (isRecordPaymentOpen && !targetFeeRecord) {
      const pendingRecord = filteredFees.find((f) => f.balance > 0) || filteredFees[0] || fees[0];
      if (pendingRecord) {
        handleOpenRecordPayment(pendingRecord);
      } else if (students.length > 0) {
        const s = students[0];
        setTargetFeeRecord({
          id: `fee_${s.id}_${selectedMonth}`,
          studentId: s.id,
          studentName: s.name,
          batch: s.batch,
          monthYear: selectedMonth,
          monthlyFee: s.monthlyFee || 1500,
          amountPaid: 0,
          balance: s.monthlyFee || 1500,
          status: 'pending',
          dueDate: `${selectedMonth}-10`,
          lastPaymentDate: null,
          payments: [],
        });
        setPaymentAmount(s.monthlyFee || 1500);
        setPaymentMode('UPI');
        setPaymentRef(`UPI/SCA/${Date.now().toString().slice(-6)}`);
      }
    }
  }, [isRecordPaymentOpen, targetFeeRecord, filteredFees, fees, students, selectedMonth]);

  const handleClosePaymentModal = () => {
    setIsRecordPaymentOpen(false);
    setTargetFeeRecord(null);
    setRecordedReceiptLink(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFeeRecord) return;
    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than ₹0');
      return;
    }

    setSubmittingPayment(true);
    setPaymentError(null);

    try {
      const res = await onRecordPayment(targetFeeRecord.studentId, targetFeeRecord.monthYear, {
        amount: Number(paymentAmount),
        mode: paymentMode,
        referenceNo: paymentRef.trim() || `TXN-${Date.now()}`,
        notes: paymentNotes.trim(),
      });
      setPaymentSuccess(`Successfully recorded ₹${paymentAmount.toLocaleString('en-IN')} payment!`);
      if (res?.receiptWhatsappLink) {
        setRecordedReceiptLink(res.receiptWhatsappLink);
      } else {
        setTimeout(() => {
          handleClosePaymentModal();
        }, 1200);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record payment';
      setPaymentError(message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // ================= ROLE-BASED ACCESS CONTROL SHIELD =================
  if (!isAdmin) {
    return (
      <div className="py-12 px-4 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">Financial Records Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            In accordance with Academy Governance &amp; Security Policy, monthly fee ledgers, payment collection records, and revenue totals are strictly restricted to Academy Administrators.
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl text-left space-y-1.5 text-xs text-slate-700 shadow-xs">
          <p className="font-bold text-slate-900">Active Account: {currentUser?.name}</p>
          <p className="text-slate-500">
            Permission: Coach access granted for Attendance Marking and Squad Profiles.
          </p>
        </div>

        <button
          onClick={onOpenRoleSwitcher}
          className="w-full py-3 px-4 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-xs shadow-xs transition min-h-[44px]"
        >
          Switch to Admin Account (Academy Admin)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header & Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#1F2937] tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-600" />
              Monthly Fee Ledger
            </h2>
            <p className="text-xs text-[#64748B]">
              Track fee collections, partial payments, and overdue balances in INR (₹)
            </p>
          </div>

          {/* Month Selector & Quick Record Fee */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#1E3A5F] min-h-[38px] font-semibold"
              >
                <option value="2027-01">January 2027</option>
                <option value="2026-12">December 2026 (Next Month)</option>
                <option value="2026-11">November 2026 (Current)</option>
                <option value="2026-10">October 2026</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
              </select>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  const pendingRecord = filteredFees.find((f) => f.balance > 0) || filteredFees[0] || fees[0];
                  if (pendingRecord) {
                    handleOpenRecordPayment(pendingRecord);
                  } else {
                    setIsRecordPaymentOpen(true);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-xs flex items-center gap-1.5 transition min-h-[38px] shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record Fee</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-200">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Billed
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900">
              ₹{totalBilled.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] text-[#16A34A] uppercase tracking-wider block font-semibold">
              Collected
            </span>
            <span className="text-base sm:text-lg font-black text-[#16A34A]">
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block">{collectionRate}% rate</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-[10px] text-[#D97706] uppercase tracking-wider block font-semibold">
              Pending Due
            </span>
            <span className="text-base sm:text-lg font-black text-[#D97706]">
              ₹{totalPending.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Automated Fee Reminders Bar */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900">Automated Push &amp; WhatsApp Reminders</span>
              <p className="text-[10px] text-slate-500">
                Pushes notifications 3 days before due date &amp; every 3 days for overdue accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRunAutomatedScan && (
              <button
                type="button"
                onClick={handleRunScan}
                disabled={runningAutomatedScan}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition min-h-[36px] disabled:opacity-50"
              >
                <Play className={`w-3 h-3 ${runningAutomatedScan ? 'animate-spin' : ''}`} />
                <span>{runningAutomatedScan ? 'Scanning...' : 'Scan & Remind'}</span>
              </button>
            )}

            {onOpenNotificationSettings && (
              <button
                type="button"
                onClick={onOpenNotificationSettings}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition min-h-[36px]"
                title="Configure Reminder Rules & Templates"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Rules</span>
              </button>
            )}
          </div>
        </div>

        {scanToast && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span>{scanToast}</span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search student or registration ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 text-base sm:text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-[#1E3A5F] min-h-[40px]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Batch filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              <button
                onClick={() => setSelectedBatch('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[34px] ${
                  selectedBatch === 'all'
                    ? 'bg-[#1E3A5F] text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Batches
              </button>
              {batches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatch(b.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[34px] ${
                    selectedBatch === b.name
                      ? 'bg-[#1E3A5F] text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['all', 'paid', 'partial', 'overdue', 'pending'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition min-h-[28px] ${
                    selectedStatus === st
                      ? 'bg-[#1E3A5F] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= FEE LIST: LIGHT CARDS ================= */}
      {fees.length === 0 ? (
        <div className="py-14 px-4 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <IndianRupee className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Fee Records Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Fee ledgers will automatically generate when students are registered with their monthly academy fee amount.
          </p>
        </div>
      ) : filteredFees.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-white border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">No fee records found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFees.map((fee) => {
            const pctPaid = fee.monthlyFee > 0 ? Math.min(100, Math.round((fee.amountPaid / fee.monthlyFee) * 100)) : 0;
            const isPaid = fee.status === 'paid';
            const isPartial = fee.status === 'partial';
            const isOverdue = fee.status === 'overdue';

            return (
              <div
                key={fee.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{fee.studentName}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {fee.studentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{fee.batch}</p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${
                      isPaid
                        ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                        : isPartial
                        ? 'bg-sky-50 text-[#2563EB] border border-sky-200'
                        : isOverdue
                        ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                        : 'bg-amber-50 text-[#D97706] border border-amber-200'
                    }`}
                  >
                    {fee.status}
                  </span>
                </div>

                {/* Amount breakdown */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Monthly Fee</span>
                    <span className="font-bold text-slate-900">₹{fee.monthlyFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#16A34A] block">Paid</span>
                    <span className="font-bold text-[#16A34A]">₹{fee.amountPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#D97706] block">Balance Due</span>
                    <span className="font-bold text-[#D97706]">₹{fee.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isPaid ? 'bg-[#16A34A]' : isPartial ? 'bg-amber-500' : 'bg-[#DC2626]'
                    }`}
                    style={{ width: `${pctPaid}%` }}
                  />
                </div>

                {/* Bottom Actions: Record Payment & History */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500">
                    {fee.lastPaymentDate ? (
                      <span>Last paid: {fee.lastPaymentDate}</span>
                    ) : (
                      <span>Due: {fee.dueDate}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Send Reminder button if balance > 0 */}
                    {fee.balance > 0 && onSendFeeReminder && (
                      <button
                        onClick={() => handleSendReminder(fee.studentId, fee.monthYear)}
                        disabled={sendingReminderStudentId === fee.studentId}
                        className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-[#D97706] border border-amber-200 flex items-center gap-1 min-h-[40px] transition disabled:opacity-50"
                        title="Send Fee Reminder via Push & WhatsApp"
                      >
                        <Bell className={`w-3.5 h-3.5 ${sendingReminderStudentId === fee.studentId ? 'animate-bounce' : ''}`} />
                        <span>{sendingReminderStudentId === fee.studentId ? 'Sending...' : 'Remind'}</span>
                      </button>
                    )}

                    {/* Send WhatsApp Payment Receipt if fee is paid or partial */}
                    {fee.amountPaid > 0 && (() => {
                      const student = students.find((s) => s.id === fee.studentId);
                      const parentPhone = student?.guardianPhone?.replace(/\D/g, '') || '';
                      if (!parentPhone) return null;

                      const latestPayment = fee.payments && fee.payments.length > 0
                        ? fee.payments[fee.payments.length - 1]
                        : null;
                      const refNo = latestPayment?.referenceNo || `SCA-REC-${fee.id}`;
                      const pMode = latestPayment?.mode || 'UPI';
                      const pDate = latestPayment?.date || fee.lastPaymentDate || fee.monthYear;
                      const pAmt = latestPayment?.amount || fee.amountPaid;

                      const receiptMsg = `✅ *SCA CRICKET ACADEMY - PAYMENT RECEIPT* 🏏\n\nDear Parent,\nThank you! We have received your payment for *${fee.studentName}*.\n\n📋 *Receipt Summary:*\n• Receipt No: *${refNo}*\n• Student: *${fee.studentName}* (${fee.studentId})\n• Batch: *${fee.batch}*\n• Month: *${fee.monthYear}*\n• Amount Paid: *₹${pAmt.toLocaleString('en-IN')}*\n• Mode: *${pMode}*\n• Date: *${pDate}*\n• Remaining Balance: *₹${fee.balance.toLocaleString('en-IN')}*\n• Status: *${fee.status.toUpperCase()}*\n\n📞 *Helpline / Queries:* +91 63804 49589\nThank you for choosing SCA Cricket Academy! 🏆`;
                      const waReceiptLink = `https://api.whatsapp.com/send?phone=${parentPhone}&text=${encodeURIComponent(receiptMsg)}`;

                      return (
                        <a
                          href={waReceiptLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] text-xs font-bold flex items-center gap-1 min-h-[40px] border border-emerald-200 transition"
                          title="Send Official Receipt to Parent via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Receipt</span>
                        </a>
                      );
                    })()}

                    {fee.payments.length > 0 && (
                      <button
                        onClick={() => setHistoryRecord(fee)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 min-h-[40px] border border-slate-200"
                        title="View Payment Receipts"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>History ({fee.payments.length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenRecordPayment(fee)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition min-h-[40px] ${
                        isPaid
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          : 'bg-[#1E3A5F] hover:bg-[#162C47] text-white font-extrabold'
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{isPaid ? 'Add Receipt' : 'Record Payment'}</span>
                    </button>
                  </div>
                </div>

                {/* Reminder Toast & WhatsApp quick action */}
                {reminderToast?.studentId === fee.studentId && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <span className="truncate">{reminderToast.message}</span>
                    </div>
                    {reminderToast.waLink && (
                      <a
                        href={reminderToast.waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp Parent</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= RECORD PAYMENT MODAL ================= */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Record Fee Payment</h3>
              </div>
              <button
                onClick={handleClosePaymentModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-4 space-y-3.5">
              {paymentSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span className="font-semibold">{paymentSuccess}</span>
                </div>
              )}

              {recordedReceiptLink && (
                <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300 text-center space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Recorded! WhatsApp Receipt Ready</span>
                  </div>
                  <a
                    href={recordedReceiptLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs shadow-sm transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Receipt via WhatsApp</span>
                  </a>
                </div>
              )}

              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Student Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student / Player <span className="text-red-500">*</span>
                </label>
                {students.length > 0 ? (
                  <select
                    value={targetFeeRecord?.studentId || ''}
                    onChange={(e) => {
                      const sId = e.target.value;
                      if (!sId) {
                        setTargetFeeRecord(null);
                        return;
                      }
                      const matched = fees.find((f) => f.studentId === sId && f.monthYear === selectedMonth);
                      if (matched) {
                        handleOpenRecordPayment(matched);
                      } else {
                        const st = students.find((s) => s.id === sId);
                        if (st) {
                          const newRec: FeeRecord = {
                            id: `fee_${st.id}_${selectedMonth}`,
                            studentId: st.id,
                            studentName: st.name,
                            batch: st.batch,
                            monthYear: selectedMonth,
                            monthlyFee: st.monthlyFee || 1500,
                            amountPaid: 0,
                            balance: st.monthlyFee || 1500,
                            status: 'pending',
                            dueDate: `${selectedMonth}-10`,
                            lastPaymentDate: null,
                            payments: [],
                          };
                          setTargetFeeRecord(newRec);
                          setPaymentAmount(newRec.balance);
                          setPaymentMode('UPI');
                          setPaymentRef(`UPI/SCA/${Date.now().toString().slice(-6)}`);
                        }
                      }
                    }}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1E3A5F] font-semibold"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((st) => {
                      const f = fees.find((fee) => fee.studentId === st.id && fee.monthYear === selectedMonth);
                      const bal = f ? f.balance : (st.monthlyFee || 1500);
                      return (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.id}) • {st.batch} {bal > 0 ? `(Pending ₹${bal.toLocaleString('en-IN')})` : '(Paid)'}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900">
                    {targetFeeRecord ? `${targetFeeRecord.studentName} (${targetFeeRecord.studentId})` : 'No students found'}
                  </div>
                )}
              </div>

              {/* Student Summary Info */}
              {targetFeeRecord && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Player:</span>
                    <span className="font-bold text-slate-900">{targetFeeRecord.studentName} ({targetFeeRecord.studentId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Month / Batch:</span>
                    <span className="text-slate-700">{targetFeeRecord.monthYear} • {targetFeeRecord.batch}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold">
                    <span className="text-slate-500">Current Outstanding Balance:</span>
                    <span className="text-[#D97706] font-black">₹{targetFeeRecord.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Payment Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (₹ INR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F] font-bold"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-slate-500">Quick Fill:</span>
                  {(targetFeeRecord?.balance ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => targetFeeRecord && setPaymentAmount(targetFeeRecord.balance)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-amber-800 hover:bg-slate-200 font-semibold border border-slate-200"
                    >
                      Full Balance (₹{targetFeeRecord?.balance})
                    </button>
                  )}
                  {(targetFeeRecord?.balance ?? 0) > 1000 && (
                    <button
                      type="button"
                      onClick={() => targetFeeRecord && setPaymentAmount(Math.floor(targetFeeRecord.balance / 2))}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    >
                      Half (₹{Math.floor((targetFeeRecord?.balance ?? 0) / 2)})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['UPI', 'Cash', 'Bank Transfer', 'Cheque'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center min-h-[40px] ${
                        paymentMode === mode
                          ? 'bg-[#1E3A5F] text-white font-black'
                          : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Ref / Receipt No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference No / Receipt ID
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI/261029/987654"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F] font-mono text-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Remarks / Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid by father via Google Pay"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#1E3A5F] text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClosePaymentModal}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment || !targetFeeRecord || paymentAmount <= 0}
                  className="px-6 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-extrabold text-xs shadow-xs transition min-h-[44px] disabled:opacity-50"
                >
                  {submittingPayment ? 'Saving Receipt...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PAYMENT HISTORY MODAL ================= */}
      {historyRecord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Payment Ledger History</h3>
                  <p className="text-[11px] text-slate-500">{historyRecord.studentName} ({historyRecord.studentId})</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryRecord(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {historyRecord.payments.map((p) => (
                <div
                  key={p.paymentId}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#16A34A] text-sm">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        {p.mode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.referenceNo}</p>
                    {p.notes && <p className="text-[11px] text-slate-600 italic mt-0.5">&quot;{p.notes}&quot;</p>}
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <p>{p.date}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.recordedBy}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setHistoryRecord(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
