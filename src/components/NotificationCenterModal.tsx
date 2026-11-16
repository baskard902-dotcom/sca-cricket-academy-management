import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  AlertCircle,
  Calendar,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  BellRing,
  Receipt,
  AlertTriangle,
  PartyPopper,
} from 'lucide-react';
import { NotificationItem } from '../types/index.ts';
import { usePushNotifications } from '../hooks/usePushNotifications.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onNavigateToFees?: () => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigateToFees,
}) => {
  const { isSupported, isGranted, permission, requestPermission } = usePushNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'fee_overdue' | 'fee_upcoming'>('all');
  const [requesting, setRequesting] = useState(false);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'fee_overdue') return n.type === 'fee_overdue';
    if (filter === 'fee_upcoming') return n.type === 'fee_upcoming';
    return true;
  });

  const handleEnablePush = async () => {
    setRequesting(true);
    try {
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Notifications &amp; Reminders</h3>
              <p className="text-[11px] text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread reminders` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser Push Permission Banner */}
        {isSupported && !isGranted && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {permission === 'denied'
                  ? 'Push notifications are blocked in browser settings'
                  : 'Enable browser push for real-time overdue alerts'}
              </span>
            </div>
            {permission !== 'denied' && (
              <button
                onClick={handleEnablePush}
                disabled={requesting}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 transition"
              >
                {requesting ? 'Enabling...' : 'Enable Push'}
              </button>
            )}
          </div>
        )}

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filter === 'all'
                ? 'bg-[#1E3A5F] text-white font-bold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filter === 'unread'
                ? 'bg-[#1E3A5F] text-white font-bold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('fee_overdue')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filter === 'fee_overdue'
                ? 'bg-[#DC2626] text-white font-bold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Overdue Fees
          </button>
          <button
            onClick={() => setFilter('fee_upcoming')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filter === 'fee_upcoming'
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Upcoming Due
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No notifications in this filter</p>
              <p className="text-xs text-slate-500">Automated fee reminders will appear here when triggered.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isOverdue = item.type === 'fee_overdue';
              const isUpcoming = item.type === 'fee_upcoming';
              const isReceipt = item.type === 'payment_receipt';
              const isAttendance = item.type === 'attendance_alert';
              const isWelcome = item.type === 'welcome_message';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition space-y-2 shadow-xs ${
                    !item.read
                      ? isOverdue || isAttendance
                        ? 'bg-rose-50/40 border-rose-200'
                        : isReceipt || isWelcome
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-amber-50/30 border-amber-200'
                      : 'bg-slate-50/80 border-slate-200 opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isOverdue ? (
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#DC2626] flex items-center justify-center shrink-0 border border-rose-200">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : isAttendance ? (
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#DC2626] flex items-center justify-center shrink-0 border border-rose-200">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : isReceipt ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0 border border-emerald-200">
                          <Receipt className="w-4 h-4" />
                        </div>
                      ) : isWelcome ? (
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
                          <PartyPopper className="w-4 h-4" />
                        </div>
                      ) : isUpcoming ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0 border border-amber-200">
                          <Calendar className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                          <Bell className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 tracking-tight">{item.title}</h4>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {!item.read && (
                      <button
                        onClick={() => onMarkRead(item.id)}
                        className="text-[10px] text-[#1E3A5F] hover:underline font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed pl-9 whitespace-pre-line font-sans bg-white/70 p-3 rounded-xl border border-slate-200/80 my-1 shadow-2xs">
                    {item.body}
                  </div>

                  {/* Actions Row */}
                  {(item.whatsappLink || item.amount) && (
                    <div className="pt-2 pl-9 flex flex-wrap items-center gap-2">
                      {item.whatsappLink && (
                        <a
                          href={item.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition min-h-[34px]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Send WhatsApp to Parent</span>
                        </a>
                      )}

                      {onNavigateToFees && item.amount && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigateToFees();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition min-h-[34px] border border-slate-200"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>View in Fee Ledger</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>Automated engine scans overdue fees daily</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
