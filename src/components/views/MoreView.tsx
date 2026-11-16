import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  HardDrive,
  Settings,
  Users,
  Smartphone,
  Bell,
  Play,
  Copy,
  ExternalLink,
  Search,
  Check,
  IndianRupee,
  Layers,
  Eye,
  CalendarCheck,
  Sparkles,
  PartyPopper,
  MessageCircle,
  Send,
  Instagram,
  Youtube,
  Key,
  Cloud,
} from 'lucide-react';
import { BackupManagementView } from './BackupManagementView.tsx';
import {
  SheetsSyncConfig,
  AcademyStats,
  User,
  Batch,
  Student,
  NotificationSettings,
  FeeRecord,
  WelcomeMessageSettings,
  WelcomeMessageLog,
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  getAccessToken,
  getGoogleUser,
} from '../../services/googleAuth.ts';
import {
  createAcademySpreadsheet,
  syncAllToGoogleSheets,
  listUserGoogleSpreadsheets,
  GoogleDriveFile,
} from '../../services/googleSheetsService.ts';

interface Props {
  currentUser: User | null;
  batches: Batch[];
  students: Student[];
  fees?: FeeRecord[];
  stats: AcademyStats | null;
  sheetsConfig: SheetsSyncConfig | null;
  initialSection?: 'reports' | 'sheets' | 'backup' | 'reminders' | 'welcome' | 'export' | 'app';
  onTriggerSheetsSync: () => Promise<void>;
  syncingSheets: boolean;
  onOpenRoleSwitcher: () => void;
  onOpenPWAInstall: () => void;
  onRestoreBackupSuccess: () => void;
  onOpenNotifications?: () => void;
  onOpenNotificationSettings?: () => void;
  onRunAutomatedScan?: () => Promise<{ processed: number; sent: number; message: string }>;
  notificationSettings?: NotificationSettings | null;
  unreadNotificationsCount?: number;
  onNavigateTab?: (tab: any) => void;
}

export const MoreView: React.FC<Props> = ({
  currentUser,
  batches,
  students,
  fees = [],
  stats,
  sheetsConfig,
  initialSection = 'reports',
  onTriggerSheetsSync,
  syncingSheets,
  onOpenRoleSwitcher,
  onOpenPWAInstall,
  onRestoreBackupSuccess,
  onOpenNotifications,
  onOpenNotificationSettings,
  onRunAutomatedScan,
  notificationSettings,
  unreadNotificationsCount = 0,
  onNavigateTab,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Sub-tabs in More
  const [activeSection, setActiveSection] = useState<'reports' | 'sheets' | 'backup' | 'reminders' | 'welcome' | 'export' | 'app'>(initialSection);

  // Sync section if initialSection changes
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Interactive Spreadsheet viewer state
  const [activeSheetTab, setActiveSheetTab] = useState<'students' | 'fees' | 'attendance'>('students');
  const [sheetSearch, setSheetSearch] = useState('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  // Sync feedback
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Google Workspace Authentication & Drive Sheets State
  const [googleUser, setGoogleUser] = useState<any>(() => getGoogleUser());
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [driveSpreadsheets, setDriveSpreadsheets] = useState<GoogleDriveFile[]>([]);
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState<string>(sheetsConfig?.spreadsheetId || '');
  const [activeSpreadsheetUrl, setActiveSpreadsheetUrl] = useState<string>(sheetsConfig?.sheetUrl || '');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [googleSyncFeedback, setGoogleSyncFeedback] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Welcome Automation Settings State
  const [welcomeSettings, setWelcomeSettings] = useState<WelcomeMessageSettings | null>(null);
  const [welcomeLogs, setWelcomeLogs] = useState<WelcomeMessageLog[]>([]);
  const [loadingWelcome, setLoadingWelcome] = useState(false);
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [welcomeFeedback, setWelcomeFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields for Welcome Settings
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [familyGroupLink, setFamilyGroupLink] = useState('https://chat.whatsapp.com/LQm7dHzJDFF0yRtl8hDn2Z?s=cl&p=a&iam=2');
  const [updatesGroupLink, setUpdatesGroupLink] = useState('https://chat.whatsapp.com/CKDZgmbki9n1MAlJGUnqo2?s=cl&p=a&iam=2');
  const [instagramLink, setInstagramLink] = useState('https://www.instagram.com/sca_cricket_academy2022?psln=bXg4Zmx5c2tlOGg4');
  const [youtubeLink, setYoutubeLink] = useState('https://youtube.com/@scacricketacademy?si=wq8f6xfd1EWvg_XX');
  const [welcomeTemplate, setWelcomeTemplate] = useState('');
  const [cloudApiEnabled, setCloudApiEnabled] = useState(false);
  const [cloudApiPhoneNumberId, setCloudApiPhoneNumberId] = useState('');
  const [cloudApiAccessToken, setCloudApiAccessToken] = useState('');

  // Live Preview State
  const [previewStudentName, setPreviewStudentName] = useState('Satyajit Mahanta');
  const [retryingStudentId, setRetryingStudentId] = useState<string | null>(null);

  const loadWelcomeData = async () => {
    setLoadingWelcome(true);
    try {
      const [settings, logs] = await Promise.all([
        api.getWelcomeSettings(),
        api.getWelcomeLogs(),
      ]);
      setWelcomeSettings(settings);
      setWelcomeEnabled(settings.enabled);
      setFamilyGroupLink(settings.familyGroupLink);
      setUpdatesGroupLink(settings.updatesGroupLink);
      setInstagramLink(settings.instagramLink);
      setYoutubeLink(settings.youtubeLink);
      setWelcomeTemplate(settings.templateText);
      setCloudApiEnabled(settings.cloudApiEnabled || false);
      setCloudApiPhoneNumberId(settings.cloudApiPhoneNumberId || '');
      setCloudApiAccessToken(settings.cloudApiAccessToken || '');
      setWelcomeLogs(logs);
    } catch (err) {
      console.error('Failed to load welcome settings', err);
    } finally {
      setLoadingWelcome(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'welcome') {
      loadWelcomeData();
    }
  }, [activeSection]);

  const renderedWelcomePreview = useMemo(() => {
    const raw = welcomeTemplate || '';
    return raw
      .replace(/{Student Name}/g, previewStudentName || 'Student Name')
      .replace(/{CA_FAMILY_GROUP_LINK}/g, familyGroupLink)
      .replace(/{SESSION_UPDATES_GROUP_LINK}/g, updatesGroupLink)
      .replace(/{INSTAGRAM_LINK}/g, instagramLink)
      .replace(/{YOUTUBE_LINK}/g, youtubeLink);
  }, [welcomeTemplate, previewStudentName, familyGroupLink, updatesGroupLink, instagramLink, youtubeLink]);

  const handleSaveWelcomeSettings = async () => {
    setSavingWelcome(true);
    setWelcomeFeedback(null);
    try {
      const updated = await api.updateWelcomeSettings({
        enabled: welcomeEnabled,
        familyGroupLink,
        updatesGroupLink,
        instagramLink,
        youtubeLink,
        templateText: welcomeTemplate,
        cloudApiEnabled,
        cloudApiPhoneNumberId,
        cloudApiAccessToken,
      });
      setWelcomeSettings(updated);
      setWelcomeFeedback({ type: 'success', text: 'Welcome message settings saved successfully!' });
      setTimeout(() => setWelcomeFeedback(null), 4000);
    } catch (err: any) {
      setWelcomeFeedback({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSavingWelcome(false);
    }
  };

  const handleRetryWelcome = async (studentId: string) => {
    setRetryingStudentId(studentId);
    try {
      const res = await api.sendWelcomeMessage(studentId, true);
      await loadWelcomeData();
      if (res.whatsappLink) {
        window.open(res.whatsappLink, '_blank');
      }
    } catch (err: any) {
      alert('Retry failed: ' + (err.message || 'Unknown error'));
    } finally {
      setRetryingStudentId(null);
    }
  };

  const handleInsertPlaceholder = (token: string) => {
    setWelcomeTemplate((prev) => prev + ' ' + token);
  };

  const handleResetWelcomeTemplate = () => {
    if (confirm('Reset template to standard SCA Welcome Message?')) {
      const defaultTpl = [
        '🏏 *SCA CRICKET ACADEMY*',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '🎉 *OFFICIAL WELCOME INVITATION*',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'Dear {Student Name},',
        '',
        'Congratulations! 🏏',
        '',
        'You have successfully joined *School of Cricket Academy (SCA)*, Gummudipoondi!',
        'We are delighted to welcome you to our cricket family. ❤️',
        '',
        'To stay connected and receive important announcements, practice schedules, session updates, and academy activities, kindly join both our official WhatsApp groups:',
        '',
        '👥 *1. SCA Family Group:*',
        '{CA_FAMILY_GROUP_LINK}',
        '',
        '🏏 *2. Session Updates Group:*',
        '{SESSION_UPDATES_GROUP_LINK}',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '📲 *FOLLOW US ON SOCIAL MEDIA*',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '📸 *Instagram – Follow Us:*',
        '{INSTAGRAM_LINK}',
        '',
        '▶️ *YouTube – Subscribe to Our Channel:*',
        '{YOUTUBE_LINK}',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'Kindly join both WhatsApp groups and follow our Instagram and YouTube channels to stay updated with all SCA Cricket Academy activities.',
        '',
        'Thank you for choosing us!',
        '',
        '*Let\'s Learn, Play & Grow Together!* 🏏🔥',
        '',
        'Best Regards,',
        '*SCA CRICKET ACADEMY MANAGEMENT TEAM*',
        '━━━━━━━━━━━━━━━━━━━━━━',
      ].join('\n');
      setWelcomeTemplate(defaultTpl);
    }
  };

  // Initialize and listen to Google Auth state
  useEffect(() => {
    const unsub = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        listUserGoogleSpreadsheets(token)
          .then((files) => setDriveSpreadsheets(files))
          .catch(() => {});
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (sheetsConfig?.spreadsheetId) {
      setActiveSpreadsheetId(sheetsConfig.spreadsheetId);
    }
    if (sheetsConfig?.sheetUrl) {
      setActiveSpreadsheetUrl(sheetsConfig.sheetUrl);
    }
  }, [sheetsConfig]);

  const handleGoogleSignIn = async () => {
    setIsLoggingInGoogle(true);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        try {
          const files = await listUserGoogleSpreadsheets(res.accessToken);
          setDriveSpreadsheets(files);
        } catch {
          // ignore
        }
        setGoogleSyncFeedback(`Connected to Google as ${res.user.displayName || res.user.email}!`);
        setTimeout(() => setGoogleSyncFeedback(null), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in was cancelled';
      alert('Google Workspace Sign-In: ' + msg);
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
    setDriveSpreadsheets([]);
    setGoogleSyncFeedback('Disconnected from Google Account.');
    setTimeout(() => setGoogleSyncFeedback(null), 3000);
  };

  const promptCreateNewSheet = () => {
    if (!googleToken) {
      handleGoogleSignIn();
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Create Official SCA Google Sheet in Drive?',
      message:
        'This will create a new official Google Spreadsheet titled "SCA Cricket Academy - Master Data 2026" in your personal Google Drive with formatted tabs for Students, Attendance, and Fees, and immediately sync your academy records.',
      confirmText: 'Create Spreadsheet',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsCreatingSheet(true);
        try {
          const token = (await getAccessToken()) || googleToken;
          if (!token) throw new Error('Google token expired. Please re-authenticate.');

          const created = await createAcademySpreadsheet(token);
          setActiveSpreadsheetId(created.spreadsheetId);
          setActiveSpreadsheetUrl(created.spreadsheetUrl);

          let attRecords: any[] = [];
          try {
            attRecords = await api.getAttendance();
          } catch {
            attRecords = [];
          }

          const syncRes = await syncAllToGoogleSheets(token, created.spreadsheetId, {
            students,
            batches,
            fees,
            attendance: attRecords,
          });

          await api.updateSheetsConfig({
            spreadsheetId: created.spreadsheetId,
            sheetUrl: created.spreadsheetUrl,
            syncStatus: 'success',
            lastSyncTime: syncRes.timestamp,
          });

          setGoogleSyncFeedback('New Google Sheet created in your Drive & synced successfully!');
          setTimeout(() => setGoogleSyncFeedback(null), 5000);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Creation failed';
          alert('Failed to create Google Sheet: ' + msg);
        } finally {
          setIsCreatingSheet(false);
        }
      },
    });
  };

  const promptPushToSheet = () => {
    if (!googleToken) {
      handleGoogleSignIn();
      return;
    }
    const targetId = activeSpreadsheetId || sheetsConfig?.spreadsheetId;
    if (!targetId) {
      promptCreateNewSheet();
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Sync Live Data to Google Sheets?',
      message: `Update Google Sheet (${targetId}) with latest records? This will write your current student roster (${students.length}), attendance logs, and fee ledgers directly to Google Sheets.`,
      confirmText: 'Sync to Sheets',
      onConfirm: async () => {
        setConfirmDialog(null);
        setIsSyncingDrive(true);
        try {
          const token = (await getAccessToken()) || googleToken;
          if (!token) throw new Error('Google token expired. Please re-authenticate.');

          let attRecords: any[] = [];
          try {
            attRecords = await api.getAttendance();
          } catch {
            attRecords = [];
          }

          const res = await syncAllToGoogleSheets(token, targetId, {
            students,
            batches,
            fees,
            attendance: attRecords,
          });

          await api.updateSheetsConfig({
            spreadsheetId: targetId,
            syncStatus: 'success',
            lastSyncTime: res.timestamp,
          });

          setGoogleSyncFeedback(`Successfully pushed ${res.updatedRows} rows directly to Google Sheets!`);
          setTimeout(() => setGoogleSyncFeedback(null), 5000);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Sync failed';
          alert('Google Sheets Sync Failed: ' + msg);
        } finally {
          setIsSyncingDrive(false);
        }
      },
    });
  };

  // Restore file input
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleManualSync = async () => {
    try {
      await onTriggerSheetsSync();
      setSyncFeedback('Google Sheets synchronized successfully!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setSyncFeedback(`Sync failed: ${message}`);
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setRestoreMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const res = await api.restoreBackup(parsed);
          setRestoreMessage({ type: 'success', text: res.message || 'Database restored successfully!' });
          onRestoreBackupSuccess();
        } catch {
          setRestoreMessage({ type: 'error', text: 'Invalid JSON backup file or corrupted format' });
        } finally {
          setRestoring(false);
        }
      };
      reader.readAsText(file);
    } catch {
      setRestoreMessage({ type: 'error', text: 'Failed to read backup file' });
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#1F2937] tracking-tight">Academy Tools &amp; Management</h2>
            <p className="text-xs text-[#64748B]">Reports, Google Sheets Sync, Excel Export, and Backups</p>
          </div>

          <button
            onClick={onOpenRoleSwitcher}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1E3A5F] text-xs font-bold flex items-center gap-1.5 transition min-h-[38px] border border-slate-200"
            title="Coach & Admin Login / Switch Account"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span className="truncate max-w-[120px] sm:max-w-none">{currentUser?.name || 'Coach Login'}</span>
          </button>
        </div>

        {/* Section Navigation Tabs (Touch-friendly 44px) */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-1 mt-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSection('reports')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition min-h-[40px] flex items-center justify-center gap-1 ${
              activeSection === 'reports'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Reports</span>
          </button>

          <button
            onClick={() => setActiveSection('sheets')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition min-h-[40px] flex items-center justify-center gap-1 ${
              activeSection === 'sheets'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Sheets</span>
          </button>

          <button
            onClick={() => setActiveSection('backup')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition min-h-[40px] flex items-center justify-center gap-1 ${
              activeSection === 'backup'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 shrink-0 text-sky-500" />
            <span className="hidden sm:inline">Drive Backup</span>
          </button>

          <button
            onClick={() => setActiveSection('reminders')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition min-h-[40px] flex items-center justify-center gap-1 relative ${
              activeSection === 'reminders'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Reminders</span>
            {unreadNotificationsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse absolute top-1 right-1 sm:static sm:w-auto sm:h-auto sm:px-1.5 sm:py-0.2 sm:text-[9px] sm:font-black sm:bg-red-600 sm:text-white" />
            )}
          </button>

          <button
            onClick={() => setActiveSection('welcome')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition min-h-[40px] flex items-center justify-center gap-1 ${
              activeSection === 'welcome'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="hidden sm:inline">Welcome WA</span>
          </button>

          <button
            onClick={() => setActiveSection('export')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition min-h-[40px] flex items-center justify-center gap-1 ${
              activeSection === 'export'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setActiveSection('app')}
            className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition min-h-[40px] flex items-center justify-center gap-1 ${
              activeSection === 'app'
                ? 'bg-[#1E3A5F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">App</span>
          </button>
        </div>

        {/* AI Assistant Quick Entry */}
        {onNavigateTab && (
          <div
            onClick={() => onNavigateTab('ai-coach')}
            className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between cursor-pointer hover:border-amber-300 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  SCA Cricket AI Coach &amp; Strategy Assistant
                </p>
                <p className="text-[11px] text-slate-600">
                  Technical drills, fitness workouts &amp; parent fee notices powered by Gemini 3.8
                </p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-[#1E3A5F] text-white font-bold text-xs shrink-0 shadow-xs">
              Chat
            </button>
          </div>
        )}
      </div>

      {/* ================= 1. REPORTS SECTION ================= */}
      {activeSection === 'reports' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Attendance Breakdown by Batch */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#16A34A]" />
              Batch Training Attendance
            </h3>

            <div className="space-y-2.5">
              {batches.map((b) => {
                const batchPlayers = students.filter((s) => s.batch === b.name && s.active);
                return (
                  <div key={b.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{b.name}</span>
                        <span className="text-slate-500 ml-2">({b.timing})</span>
                      </div>
                      <span className="text-[#16A34A] font-bold">{batchPlayers.length} Active Players</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Lead Coach: {b.assignedCoach}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Specialization Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Squad Role Composition
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Batsmen</span>
                <span className="text-base font-black text-slate-900">
                  {students.filter((s) => s.role.toLowerCase().includes('batsman')).length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Fast Bowlers</span>
                <span className="text-base font-black text-slate-900">
                  {students.filter((s) => s.role.toLowerCase().includes('fast')).length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Spinners</span>
                <span className="text-base font-black text-slate-900">
                  {students.filter((s) => s.role.toLowerCase().includes('spinner')).length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">All-Rounders</span>
                <span className="text-base font-black text-slate-900">
                  {students.filter((s) => s.role.toLowerCase().includes('all-rounder')).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ================= 2. GOOGLE SHEETS SYNC SECTION ================= */}
      {activeSection === 'sheets' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Main Google Sheets Connection Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0 border border-emerald-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    Google Sheets &amp; Drive Integration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connect your Google account to sync academy records with your Google Drive
                  </p>
                </div>
              </div>

              {googleUser ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Google Connected
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  Sign-In Required
                </span>
              )}
            </div>

            {/* Google Authentication Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              {googleUser ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="Google Account"
                        className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {googleUser.displayName?.charAt(0) || 'G'}
                      </div>
                    )}
                    <div>
                      <span className="block font-bold text-xs text-slate-900 leading-tight">
                        {googleUser.displayName || 'Google Account'}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {googleUser.email || 'Workspace account connected'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleSignOut}
                    className="self-start sm:self-auto text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Sign in with Google to enable Drive &amp; Sheets
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Grants permission to create and sync student, attendance, and fee sheets in your Google Drive.
                    </p>
                  </div>

                  {/* Official Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoggingInGoogle}
                    className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition shadow-xs text-slate-700 font-bold text-xs min-h-[44px] shrink-0"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isLoggingInGoogle ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sync Feedback Message */}
            {googleSyncFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{googleSyncFeedback}</span>
              </div>
            )}

            {/* Spreadsheet Master Connection Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Spreadsheet Name:</span>
                <span className="font-semibold text-slate-800">SCA Cricket Master Ledger 2026</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Spreadsheet ID:</span>
                <span className="font-mono text-slate-800 text-[11px] truncate max-w-[200px]">
                  {activeSpreadsheetId || sheetsConfig?.spreadsheetId || 'Not linked yet'}
                </span>
              </div>
              {activeSpreadsheetUrl && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Drive Location:</span>
                  <a
                    href={activeSpreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                  >
                    <span>Open in Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Target Tabs:</span>
                <span className="text-slate-700 font-medium">SCA_Students • SCA_Attendance • SCA_Fees</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Auto-sync on save:</span>
                <span className="text-[#16A34A] font-bold">Enabled</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500">Last Sync Time:</span>
                <span className="text-slate-700">
                  {sheetsConfig?.lastSyncTime
                    ? new Date(sheetsConfig.lastSyncTime).toLocaleString()
                    : 'Ready to sync'}
                </span>
              </div>
            </div>

            {/* Google Drive Existing Spreadsheets Selector */}
            {driveSpreadsheets.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Link an Existing Spreadsheet from your Google Drive:
                </label>
                <select
                  value={activeSpreadsheetId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setActiveSpreadsheetId(selId);
                    const file = driveSpreadsheets.find((f) => f.id === selId);
                    if (file?.webViewLink) setActiveSpreadsheetUrl(file.webViewLink);
                  }}
                  className="w-full bg-white border border-slate-300 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1E3A5F]"
                >
                  <option value="">-- Choose a spreadsheet from Google Drive --</option>
                  {driveSpreadsheets.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Real Sync & Create Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={promptCreateNewSheet}
                disabled={isCreatingSheet}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#107C41] hover:bg-[#0c6333] text-white font-bold text-xs shadow-xs transition min-h-[44px] disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isCreatingSheet ? 'Creating Google Sheet in Drive...' : '+ Create New Google Sheet in Drive'}</span>
              </button>

              <button
                type="button"
                onClick={promptPushToSheet}
                disabled={isSyncingDrive}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-xs shadow-xs transition min-h-[44px] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                <span>{isSyncingDrive ? 'Pushing Data to Google Sheets...' : 'Push Records to Google Sheets'}</span>
              </button>

              <a
                href={api.getExportUrl(activeSheetTab)}
                download
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition min-h-[44px] border border-slate-200"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Download .CSV</span>
              </a>
            </div>
          </div>

          {/* ================= LIVE SPREADSHEET VIEWER COMPONENT ================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Spreadsheet Ribbon / Header */}
            <div className="bg-[#107C41] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-white" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm leading-tight text-white">
                    SCA Cricket Academy - Live Spreadsheet Preview
                  </h4>
                  <p className="text-[10px] text-emerald-100">
                    Live read-out of connected Google Sheet &amp; Excel database
                  </p>
                </div>
              </div>

              {/* Copy Formula Button */}
              <button
                onClick={() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                  const formula = `=IMPORTDATA("${origin}/api/export/csv/${activeSheetTab}")`;
                  navigator.clipboard?.writeText(formula);
                  setCopiedFormula(activeSheetTab);
                  setTimeout(() => setCopiedFormula(null), 3000);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-[11px] font-semibold text-emerald-50 flex items-center gap-1.5 transition border border-emerald-600"
                title="Click to copy =IMPORTDATA formula for Google Sheets"
              >
                {copiedFormula === activeSheetTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-300" />
                    <span>Formula Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Copy Google Sheets Formula</span>
                  </>
                )}
              </button>
            </div>

            {/* Sheet Tabs Bar (Just like Google Sheets / Excel bottom tabs) */}
            <div className="bg-slate-100 border-b border-slate-200 px-3 pt-2 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSheetTab('students')}
                  className={`px-3 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeSheetTab === 'students'
                      ? 'bg-white text-emerald-700 border-t-2 border-t-emerald-600 border-x border-slate-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>SCA_Students</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                    {students.length}
                  </span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setActiveSheetTab('fees')}
                    className={`px-3 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeSheetTab === 'fees'
                        ? 'bg-white text-emerald-700 border-t-2 border-t-emerald-600 border-x border-slate-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>SCA_Fees</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                      {fees.length || 16}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setActiveSheetTab('attendance')}
                  className={`px-3 py-2 rounded-t-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeSheetTab === 'attendance'
                      ? 'bg-white text-emerald-700 border-t-2 border-t-emerald-600 border-x border-slate-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>SCA_Attendance</span>
                </button>
              </div>

              {/* Quick in-sheet filter */}
              <div className="pb-1.5">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={sheetSearch}
                    onChange={(e) => setSheetSearch(e.target.value)}
                    placeholder="Search in sheet..."
                    className="w-32 sm:w-44 pl-7 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Interactive Grid Table */}
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              {activeSheetTab === 'students' && (
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                    <tr className="text-slate-600">
                      <th className="py-2 px-2 text-center border-r border-slate-200 bg-slate-100 font-mono w-10 text-[10px]">
                        #
                      </th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">A: Student ID</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">B: Full Name</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">C: Age Group</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">D: Batch</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">E: Cricket Role</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">F: Phone</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">G: Monthly Fee</th>
                      <th className="py-2 px-3 font-semibold">H: Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {students
                      .filter(
                        (s) =>
                          s.name.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                          s.id.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                          s.batch.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                          s.role.toLowerCase().includes(sheetSearch.toLowerCase())
                      )
                      .map((student, idx) => (
                        <tr key={student.id} className="hover:bg-emerald-50/40 transition">
                          <td className="py-2 px-2 text-center text-slate-400 bg-slate-50/70 border-r border-slate-200 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-bold text-slate-900 font-sans">
                            {student.id}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-sans font-medium text-slate-800">
                            {student.name}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-sans text-slate-600">
                            {student.ageGroup}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-sans text-slate-600">
                            {student.batch}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-sans text-slate-600">
                            {student.role}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 text-slate-600">
                            {student.phone}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-semibold text-slate-900">
                            ₹{student.monthlyFee?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                student.active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {student.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {activeSheetTab === 'fees' && (
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                    <tr className="text-slate-600">
                      <th className="py-2 px-2 text-center border-r border-slate-200 bg-slate-100 font-mono w-10 text-[10px]">
                        #
                      </th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">A: Student ID</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">B: Student Name</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">C: Batch</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">D: Month</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">E: Fee (₹)</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">F: Paid (₹)</th>
                      <th className="py-2 px-3 border-r border-slate-200 font-semibold">G: Balance (₹)</th>
                      <th className="py-2 px-3 font-semibold">H: Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {fees
                      .filter(
                        (f) =>
                          f.studentName?.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                          f.studentId?.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                          f.batch?.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                          f.status?.toLowerCase().includes(sheetSearch.toLowerCase())
                      )
                      .map((fee, idx) => (
                        <tr key={fee.id} className="hover:bg-amber-50/40 transition">
                          <td className="py-2 px-2 text-center text-slate-400 bg-slate-50/70 border-r border-slate-200 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-bold text-slate-900 font-sans">
                            {fee.studentId}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-sans font-medium text-slate-800">
                            {fee.studentName}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-sans text-slate-600">
                            {fee.batch}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-sans text-slate-600">
                            {fee.monthYear}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-semibold text-slate-900">
                            ₹{fee.monthlyFee?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-semibold text-emerald-700">
                            ₹{fee.amountPaid?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-100 font-semibold text-amber-700">
                            ₹{fee.balance?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                fee.status === 'paid'
                                  ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                                  : fee.status === 'partial'
                                  ? 'bg-sky-50 text-blue-700 border border-sky-200'
                                  : 'bg-amber-50 text-[#D97706] border border-amber-200'
                              }`}
                            >
                              {fee.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {activeSheetTab === 'attendance' && (
                <div className="p-5 text-center text-xs text-slate-500 space-y-2">
                  <CalendarCheck className="w-8 h-8 text-[#16A34A] mx-auto opacity-70" />
                  <p className="font-semibold text-slate-800">SCA Daily Attendance Register</p>
                  <p>Daily rolls are synchronized row-by-row into the Google Sheet automatically.</p>
                  <a
                    href={api.getExportUrl('attendance')}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#16A34A] border border-emerald-200 font-bold hover:bg-emerald-100 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Complete Attendance Register (.CSV)</span>
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Spreadsheet Info Bar */}
            <div className="bg-slate-50 px-3.5 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Sheet: <strong className="text-slate-700">SCA_{activeSheetTab}</strong> • Live synced with Google Sheets
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                UTF-8 BOM • Compatible with Microsoft Excel &amp; Google Sheets
              </span>
            </div>
          </div>

          {/* Quick How-To Instructions Card */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2.5">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>📋 Where can I see and open this file?</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div className="bg-white p-3 rounded-xl border border-amber-200/60">
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <span>1. On Your Phone (Android / iPhone)</span>
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Tap <strong>Download Active Sheet (.CSV)</strong> or switch to the <strong>Export</strong> tab. The file will save directly to your Downloads folder and can be opened in <strong>Microsoft Excel</strong>, <strong>Apple Numbers</strong>, or the <strong>Google Sheets app</strong>.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-amber-200/60">
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <span>2. In Google Sheets (Web / Browser)</span>
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Click <strong>Copy Google Sheets Formula</strong> above, open a new sheet at <em>sheets.google.com</em>, and paste into cell <strong>A1</strong>. Google Sheets will automatically import and stay updated with your academy records!
                </p>
              </div>
            </div>
          </div>

          {/* Sync Activity History Log */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Recent Sync Activity Log</h3>
            <div className="space-y-2">
              {sheetsConfig?.syncLogs?.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{log.action}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        {log.recordsCount} records
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= GOOGLE DRIVE AUTOMATIC BACKUP SYSTEM ================= */}
      {activeSection === 'backup' && (
        <BackupManagementView
          currentUser={currentUser}
          onRestoreSuccess={onRestoreBackupSuccess}
        />
      )}
      {activeSection === 'reminders' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  Automated Push &amp; Fee Reminders
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sends scheduled mobile push notifications and WhatsApp reminders for overdue &amp; upcoming fees
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {notificationSettings?.autoFeeRemindersEnabled ? 'Active' : 'Paused'}
              </span>
            </div>

            {/* Config Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Advance Reminder</span>
                <span className="font-bold text-slate-900 text-sm">
                  {notificationSettings?.upcomingDaysBefore || 3} days before due
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Friendly fee notice</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200">
                <span className="text-[10px] text-[#DC2626] block font-medium">Overdue Follow-up</span>
                <span className="font-bold text-[#DC2626] text-sm">
                  Every {notificationSettings?.overdueFrequencyDays || 3} days
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Urgent settlement alert</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-[#16A34A] block font-medium">Payment Channel</span>
                <span className="font-bold text-slate-900 text-sm font-mono truncate block">
                  {notificationSettings?.upiId || 'vijaykumarmm30@okicici'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">UPI Number: {notificationSettings?.upiNumber || '6380449589'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-xs shadow-xs transition min-h-[44px]"
                >
                  <Bell className="w-4 h-4 text-white" />
                  <span>Open Notification Inbox ({unreadNotificationsCount})</span>
                </button>
              )}

              {isAdmin && onRunAutomatedScan && (
                <button
                  onClick={async () => {
                    const res = await onRunAutomatedScan();
                    alert(res.message);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition min-h-[44px]"
                >
                  <Play className="w-4 h-4" />
                  <span>Run Scan Engine</span>
                </button>
              )}

              {isAdmin && onOpenNotificationSettings && (
                <button
                  onClick={onOpenNotificationSettings}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition min-h-[44px] border border-slate-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configure Rules</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ================= 4. EXCEL EXPORT & BACKUP ================= */}
      {activeSection === 'export' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Excel Exports */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Excel (CSV) Exports</h3>
                <p className="text-xs text-slate-500">Pre-formatted with UTF-8 BOM for Microsoft Excel &amp; Numbers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <a
                href={api.getExportUrl('students')}
                download
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-800 transition min-h-[44px]"
              >
                <span>Students Directory</span>
                <Download className="w-4 h-4 text-amber-600" />
              </a>

              <a
                href={api.getExportUrl('attendance')}
                download
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-800 transition min-h-[44px]"
              >
                <span>Attendance Register</span>
                <Download className="w-4 h-4 text-[#16A34A]" />
              </a>

              {isAdmin ? (
                <a
                  href={api.getExportUrl('fees')}
                  download
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-800 transition min-h-[44px]"
                >
                  <span>Fee Ledger (INR)</span>
                  <Download className="w-4 h-4 text-amber-600" />
                </a>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-200 text-xs text-slate-400 opacity-60">
                  <span>Fee Ledger</span>
                  <span className="text-[10px]">Admin only</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">Want to view rows before downloading?</span>
              <button
                onClick={() => setActiveSection('sheets')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Live Spreadsheet</span>
              </button>
            </div>
          </div>

          {/* Database Backup & Restore */}
          {isAdmin && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Full Academy Database Backup</h3>
                  <p className="text-xs text-slate-500">Download complete system JSON or restore previous backup</p>
                </div>
              </div>

              {restoreMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    restoreMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {restoreMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                  )}
                  <span>{restoreMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={api.getBackupUrl()}
                  download
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs transition min-h-[44px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download JSON Backup</span>
                </a>

                <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer min-h-[44px]">
                  <Upload className="w-4 h-4" />
                  <span>{restoring ? 'Restoring Database...' : 'Restore from JSON File'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    disabled={restoring}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 4. APP & PWA SECTION ================= */}
      {activeSection === 'app' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/image_ea7312de.png"
                alt="School of Cricket Academy (SCA) Gummudipoondi"
                className="w-14 h-14 rounded-full object-cover shadow-xs border border-amber-400/50 bg-white shrink-0"
              />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">School of Cricket Academy (SCA)</h3>
                <p className="text-xs text-amber-600 font-semibold">Gummudipoondi • Version 2.4.0</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Engineered for coaches on the ground and administrators on mobile devices. Supports iPhone notches, safe area insets, offline static asset caching, fast attendance marking, and zero-zoom form entry.
            </p>

            <button
              onClick={onOpenPWAInstall}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-xs shadow-xs transition min-h-[44px]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install App on iPhone / Android</span>
            </button>
          </div>

          {/* Security & Offline Policy Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 text-xs text-slate-500">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              Data Security &amp; Safe Offline Storage
            </h4>
            <p>
              In accordance with security requirements, only safe static assets (CSS, icons, application shell) are cached by the service worker. Student private information, attendance, and fee transactions are never stored in unprotected browser offline caches.
            </p>
          </div>
        </div>
      )}

      {/* ================= 4. WELCOME MESSAGE & SOCIAL MEDIA INVITATION SYSTEM ================= */}
      {activeSection === 'welcome' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header & Status Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-emerald-600" />
                  <span>Automatic WhatsApp Welcome &amp; Social Media Invitation</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sends personalized WhatsApp welcome invitation with official groups &amp; social media channels to every new registered student
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                  welcomeEnabled
                    ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${welcomeEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {welcomeEnabled ? 'Automation Active' : 'Automation Paused'}
                </span>
              </div>
            </div>

            {/* Master Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Automatic WhatsApp Delivery on New Student Registration
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Immediately triggers personalized welcome message when a new student is added to database
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={welcomeEnabled}
                  onChange={(e) => setWelcomeEnabled(e.target.checked)}
                  disabled={!isAdmin}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Group & Social Media Links Form */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[11px] text-slate-400">
                Official Links Configuration
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Family Group */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>👨‍👩‍👧‍👦 1. SCA Family WhatsApp Group Link</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={familyGroupLink}
                      onChange={(e) => setFamilyGroupLink(e.target.value)}
                      disabled={!isAdmin}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    {familyGroupLink && (
                      <a
                        href={familyGroupLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition"
                        title="Open Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Session Updates Group */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>🏏 2. Session Updates WhatsApp Group Link</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={updatesGroupLink}
                      onChange={(e) => setUpdatesGroupLink(e.target.value)}
                      disabled={!isAdmin}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    {updatesGroupLink && (
                      <a
                        href={updatesGroupLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition"
                        title="Open Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Instagram Link */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>Instagram Profile Link</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={instagramLink}
                      onChange={(e) => setInstagramLink(e.target.value)}
                      disabled={!isAdmin}
                      placeholder="https://www.instagram.com/..."
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-pink-500 focus:outline-hidden"
                    />
                    {instagramLink && (
                      <a
                        href={instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-600 transition"
                        title="Open Instagram"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* YouTube Link */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-600" />
                    <span>YouTube Channel Link</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      disabled={!isAdmin}
                      placeholder="https://youtube.com/@..."
                      className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                    {youtubeLink && (
                      <a
                        href={youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition"
                        title="Open YouTube"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Template Editor */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-slate-700">
                  Welcome Message Template
                </label>
                <button
                  type="button"
                  onClick={handleResetWelcomeTemplate}
                  disabled={!isAdmin}
                  className="text-[11px] text-amber-600 hover:underline font-semibold"
                >
                  Reset to Default Template
                </button>
              </div>

              {/* Dynamic Variable Insertion Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-medium">Insert Variables:</span>
                {[
                  { tag: '{Student Name}', label: 'Student Name' },
                  { tag: '{CA_FAMILY_GROUP_LINK}', label: 'Family Group' },
                  { tag: '{SESSION_UPDATES_GROUP_LINK}', label: 'Updates Group' },
                  { tag: '{INSTAGRAM_LINK}', label: 'Instagram' },
                  { tag: '{YOUTUBE_LINK}', label: 'YouTube' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertPlaceholder(item.tag)}
                    disabled={!isAdmin}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 font-mono transition"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={9}
                value={welcomeTemplate}
                onChange={(e) => setWelcomeTemplate(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
              />
            </div>

            {/* Meta WhatsApp Business Cloud API (Collapsible / Advanced) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Meta WhatsApp Business Cloud API (Optional Backend Delivery)
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={cloudApiEnabled}
                    onChange={(e) => setCloudApiEnabled(e.target.checked)}
                    disabled={!isAdmin}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {cloudApiEnabled ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">WhatsApp Phone Number ID</label>
                    <input
                      type="text"
                      value={cloudApiPhoneNumberId}
                      onChange={(e) => setCloudApiPhoneNumberId(e.target.value)}
                      placeholder="e.g. 104928509382103"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">System User Access Token</label>
                    <input
                      type="password"
                      value={cloudApiAccessToken}
                      onChange={(e) => setCloudApiAccessToken(e.target.value)}
                      placeholder="EAAG...."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  ⚡ <strong>Direct WhatsApp Dispatch Mode Active:</strong> Generates instant pre-filled WhatsApp links with 1 click. No Meta Cloud API credentials or token approvals required to start welcoming students today!
                </p>
              )}
            </div>

            {/* Save Buttons & Feedback */}
            {welcomeFeedback && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                welcomeFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {welcomeFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                )}
                <span>{welcomeFeedback.text}</span>
              </div>
            )}

            {isAdmin && (
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveWelcomeSettings}
                  disabled={savingWelcome}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 min-h-[42px]"
                >
                  {savingWelcome ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Welcome Message Settings</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Interactive WhatsApp Preview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Live WhatsApp Message Preview</span>
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">Preview Student Name:</span>
                <input
                  type="text"
                  value={previewStudentName}
                  onChange={(e) => setPreviewStudentName(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 w-36"
                />
              </div>
            </div>

            {/* Mock WhatsApp Bubble */}
            <div className="bg-[#EFEAE2] p-4 sm:p-5 rounded-2xl border border-slate-300 shadow-inner">
              <div className="max-w-md bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-md border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans space-y-2">
                <div className="whitespace-pre-line">{renderedWelcomePreview}</div>
                <div className="text-[10px] text-slate-400 text-right font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Message Delivery History & Logs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Welcome Message Delivery History</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Track delivered, pending, and failed WhatsApp welcome messages with 1-click retry
                </p>
              </div>
              <button
                type="button"
                onClick={loadWelcomeData}
                disabled={loadingWelcome}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Refresh Logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingWelcome ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {welcomeLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <PartyPopper className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">No welcome messages sent yet</p>
                <p>When new students are enrolled, their delivery logs will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Mobile</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {welcomeLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {log.studentName}
                          <span className="block text-[10px] text-slate-400 font-normal">{log.studentId}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{log.phone}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            log.status === 'sent'
                              ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                              : log.status === 'failed'
                              ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                              : 'bg-amber-50 text-[#D97706] border border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              log.status === 'sent' ? 'bg-emerald-500' : log.status === 'failed' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            {log.status.toUpperCase()}
                          </span>
                          {log.errorMessage && (
                            <span className="block text-[10px] text-rose-600 mt-0.5 truncate max-w-[150px]" title={log.errorMessage}>
                              {log.errorMessage}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                          {log.channel === 'cloud_api' ? 'Cloud API' : 'WhatsApp Link'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {log.whatsappLink && (
                              <a
                                href={log.whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs transition"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRetryWelcome(log.studentId)}
                              disabled={retryingStudentId === log.studentId}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                            >
                              {retryingStudentId === log.studentId ? 'Retrying...' : 'Retry'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Modal for Destructive / Mutating Workspace Operations */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl text-slate-900">
            <h3 className="font-extrabold text-base text-[#1E3A5F]">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{confirmDialog.message}</p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.onConfirm()}
                className="px-4 py-2.5 rounded-xl bg-[#107C41] hover:bg-[#0c6333] text-white text-xs font-bold transition min-h-[40px] shadow-xs"
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
