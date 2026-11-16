import React, { useState, useEffect, useCallback } from 'react';
import { Navigation, TabType } from './components/Navigation.tsx';
import { DashboardView } from './components/views/DashboardView.tsx';
import { AttendanceView } from './components/views/AttendanceView.tsx';
import { StudentsView } from './components/views/StudentsView.tsx';
import { FeesView } from './components/views/FeesView.tsx';
import { MoreView } from './components/views/MoreView.tsx';
import { AiCoachView } from './components/views/AiCoachView.tsx';
import { RoleSwitcherModal } from './components/RoleSwitcherModal.tsx';
import { PWAInstallModal } from './components/PWAInstallModal.tsx';
import { NotificationCenterModal } from './components/NotificationCenterModal.tsx';
import { NotificationSettingsModal } from './components/NotificationSettingsModal.tsx';
import { StudentPreferencesModal } from './components/StudentPreferencesModal.tsx';
import { useOnlineStatus } from './hooks/useOnlineStatus.ts';
import { usePushNotifications } from './hooks/usePushNotifications.ts';
import { api } from './services/api.ts';
import {
  Student,
  Batch,
  FeeRecord,
  AcademyStats,
  SheetsSyncConfig,
  User,
  PaymentMode,
  NotificationItem,
  NotificationSettings,
  NotificationPreferences,
} from './types/index.ts';
import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();
  const { triggerLocalNotification } = usePushNotifications();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [moreSubSection, setMoreSubSection] = useState<'reports' | 'sheets' | 'backup' | 'reminders' | 'welcome' | 'export' | 'app'>('reports');

  const handleNavigate = (tab: TabType, subSection?: 'reports' | 'sheets' | 'backup' | 'reminders' | 'welcome' | 'export' | 'app') => {
    setActiveTab(tab);
    if (tab === 'more') {
      setMoreSubSection(subSection || 'reports');
    }
  };

  // User / Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Academy Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [stats, setStats] = useState<AcademyStats | null>(null);
  const [sheetsConfig, setSheetsConfig] = useState<SheetsSyncConfig | null>(null);

  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);

  // Loading & Sync States
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingSheets, setSyncingSheets] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isPWAModalOpen, setIsPWAModalOpen] = useState<boolean>(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState<boolean>(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);
  const [isNotificationSettingsModalOpen, setIsNotificationSettingsModalOpen] = useState<boolean>(false);
  const [studentForPreferences, setStudentForPreferences] = useState<Student | null>(null);

  // Fetch all academy data
  const loadData = useCallback(async () => {
    try {
      setGlobalError(null);
      const [meRes, batchesRes, studentsRes, reportsRes, sheetsRes, notifsRes, notifSettingsRes] =
        await Promise.all([
          api.getMe(),
          api.getBatches(),
          api.getStudents(),
          api.getReports(),
          api.getSheetsConfig(),
          api.getNotifications(),
          api.getNotificationSettings(),
        ]);

      setCurrentUser(meRes.user);
      setAllUsers(meRes.allUsers);
      setBatches(batchesRes);
      setStudents(studentsRes);
      setStats(reportsRes);
      setSheetsConfig(sheetsRes);
      setNotifications(notifsRes);
      setNotificationSettings(notifSettingsRes);

      // Fees are strictly loaded only if Admin
      if (meRes.user.role === 'admin') {
        try {
          const feesRes = await api.getFees();
          setFees(feesRes);
        } catch {
          setFees([]);
        }
      } else {
        setFees([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load academy data:', err);
      const msg = err instanceof Error ? err.message : 'Network error loading data';
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check URL parameters for section navigation
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('tab') === 'more') {
      setActiveTab('more');
      const section = searchParams.get('section');
      if (section === 'backup') {
        setMoreSubSection('backup');
      }
    }

    // Load stored authentication role if present
    api.loadStoredAuth();
    loadData();
  }, [loadData]);

  // Handle Switch User / Role
  const handleSelectUser = async (user: User) => {
    try {
      setLoading(true);
      const updatedUser = await api.switchRole(user.id);
      setCurrentUser(updatedUser);
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to switch role:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Login with Name & Password
  const handleLogin = async (nameOrUsername: string, password: string) => {
    try {
      setLoading(true);
      const user = await api.login(nameOrUsername, password);
      setCurrentUser(user);
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await api.logout();
      await loadData();
    } finally {
      setLoading(false);
    }
  };

  // Student Operations
  const handleAddStudent = async (data: Omit<Student, 'id'>) => {
    const res = await api.addStudent(data);
    await loadData();
    return res;
  };

  const handleUpdateStudent = async (id: string, data: Partial<Student>) => {
    await api.updateStudent(id, data);
    await loadData();
  };

  const handleDeleteStudent = async (id: string) => {
    await api.deleteStudent(id);
    await loadData();
  };

  // Fee Operations
  const handleRecordPayment = async (
    studentId: string,
    monthYear: string,
    payment: {
      amount: number;
      mode: PaymentMode;
      referenceNo: string;
      notes?: string;
    }
  ) => {
    const res = await api.recordPayment(studentId, monthYear, payment);
    await loadData();
    return res;
  };

  // Notification Operations
  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (stats) {
      setStats({
        ...stats,
        unreadNotificationsCount: Math.max(0, (stats.unreadNotificationsCount || 1) - 1),
      });
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (stats) {
      setStats({
        ...stats,
        unreadNotificationsCount: 0,
      });
    }
  };

  const handleSaveNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    const updated = await api.updateNotificationSettings(settings);
    setNotificationSettings(updated);
  };

  const handleRunAutomatedScan = async () => {
    const res = await api.runAutomatedFeeReminders();
    if (res.sent > 0 && res.notifications?.[0]) {
      triggerLocalNotification(res.notifications[0].title, {
        body: res.notifications[0].body,
      });
    }
    await loadData();
    return { processed: res.processed, sent: res.sent, message: res.message };
  };

  const handleSendIndividualReminder = async (studentId: string, monthYear: string) => {
    const res = await api.sendManualFeeReminder(studentId, monthYear);
    triggerLocalNotification(res.notification.title, {
      body: res.notification.body,
    });
    await loadData();
    return res;
  };

  const handleSaveStudentPreferences = async (
    studentId: string,
    prefs: NotificationPreferences
  ) => {
    await api.updateStudentNotificationPreferences(studentId, prefs);
    await loadData();
  };

  // Google Sheets Operations
  const handleTriggerSheetsSync = async () => {
    setSyncingSheets(true);
    try {
      await api.triggerSheetsSync();
      const updatedConfig = await api.getSheetsConfig();
      setSheetsConfig(updatedConfig);
    } finally {
      setSyncingSheets(false);
    }
  };

  const unreadCount = stats?.unreadNotificationsCount ?? notifications.filter((n) => !n.read).length;

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full p-1 bg-white shadow-md mb-3 border border-amber-400/60 flex items-center justify-center">
          <img
            src="/assets/aistudio/image_ea7312de.png"
            alt="School of Cricket Academy (SCA) Gummudipoondi"
            className="w-full h-full rounded-full object-cover animate-pulse"
          />
        </div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">School of Cricket Academy (SCA)</h2>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
          Loading squad &amp; academy operations...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#1F2937] flex flex-col md:flex-row antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. Static assets remain accessible.</span>
        </div>
      )}

      {/* Navigation (Sidebar on Desktop, Header + Bottom bar on Mobile) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
        onOpenPWAInstall={() => setIsPWAModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        unreadNotificationsCount={unreadCount}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto p-3 sm:p-5 md:p-8 pb-safe-nav">
          {globalError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{globalError}</span>
              </div>
              <button
                onClick={loadData}
                className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              batches={batches}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onOpenAddStudent={() => {
                setActiveTab('students');
                setIsAddStudentModalOpen(true);
              }}
              onOpenRecordPayment={() => {
                setActiveTab('fees');
                setIsRecordPaymentModalOpen(true);
              }}
              onTriggerSheetsSync={handleTriggerSheetsSync}
              syncingSheets={syncingSheets}
              sheetsConfig={sheetsConfig}
              isOnline={isOnline}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              batches={batches}
              currentUser={currentUser}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              isAddModalOpen={isAddStudentModalOpen}
              setIsAddModalOpen={setIsAddStudentModalOpen}
              onOpenPreferences={(student) => setStudentForPreferences(student)}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              students={students}
              batches={batches}
              currentUser={currentUser}
              onRefreshData={loadData}
            />
          )}

          {activeTab === 'fees' && (
            <FeesView
              fees={fees}
              students={students}
              batches={batches}
              currentUser={currentUser}
              onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
              onRecordPayment={handleRecordPayment}
              isRecordPaymentOpen={isRecordPaymentModalOpen}
              setIsRecordPaymentOpen={setIsRecordPaymentModalOpen}
              onSendFeeReminder={handleSendIndividualReminder}
              onOpenNotificationSettings={() => setIsNotificationSettingsModalOpen(true)}
              onRunAutomatedScan={handleRunAutomatedScan}
            />
          )}

          {activeTab === 'more' && (
            <MoreView
              currentUser={currentUser}
              batches={batches}
              students={students}
              fees={fees}
              stats={stats}
              sheetsConfig={sheetsConfig}
              initialSection={moreSubSection}
              onTriggerSheetsSync={handleTriggerSheetsSync}
              syncingSheets={syncingSheets}
              onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
              onOpenPWAInstall={() => setIsPWAModalOpen(true)}
              onRestoreBackupSuccess={loadData}
              onOpenNotifications={() => setIsNotificationsModalOpen(true)}
              onOpenNotificationSettings={() => setIsNotificationSettingsModalOpen(true)}
              onRunAutomatedScan={handleRunAutomatedScan}
              notificationSettings={notificationSettings}
              unreadNotificationsCount={unreadCount}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'ai-coach' && (
            <AiCoachView
              currentUser={currentUser}
              stats={stats}
              onNavigateTab={setActiveTab}
            />
          )}
        </div>
      </main>

      {/* Global Modals */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <PWAInstallModal
        isOpen={isPWAModalOpen}
        onClose={() => setIsPWAModalOpen(false)}
      />

      <NotificationCenterModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigateToFees={() => setActiveTab('fees')}
      />

      <NotificationSettingsModal
        isOpen={isNotificationSettingsModalOpen}
        onClose={() => setIsNotificationSettingsModalOpen(false)}
        settings={notificationSettings}
        onSaveSettings={handleSaveNotificationSettings}
        onRunAutomatedScan={handleRunAutomatedScan}
      />

      <StudentPreferencesModal
        isOpen={!!studentForPreferences}
        onClose={() => setStudentForPreferences(null)}
        student={studentForPreferences}
        onSavePreferences={handleSaveStudentPreferences}
      />
    </div>
  );
}
