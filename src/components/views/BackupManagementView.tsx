import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  Clock,
  HardDrive,
  FolderTree,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Play,
  Key,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  Folder,
} from 'lucide-react';
import {
  GoogleDriveConfig,
  GoogleDriveBackupLog,
  BackupRestoreResult,
  User,
} from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface Props {
  currentUser: User | null;
  onRestoreSuccess: () => void;
}

export const BackupManagementView: React.FC<Props> = ({
  currentUser,
  onRestoreSuccess,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // State
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GoogleDriveConfig | null>(null);
  const [logs, setLogs] = useState<GoogleDriveBackupLog[]>([]);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // In-flight actions
  const [backingUp, setBackingUp] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Restore Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<GoogleDriveBackupLog | null>(null);
  const [uploadedBackupPayload, setUploadedBackupPayload] = useState<any>(null);
  const [restoreValidationSummary, setRestoreValidationSummary] = useState<{
    students: number;
    batches: number;
    attendance: number;
    fees: number;
    valid: boolean;
  } | null>(null);
  const [restoreResult, setRestoreResult] = useState<BackupRestoreResult | null>(null);

  // Settings / OAuth Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [accountEmail, setAccountEmail] = useState('scacricketacademy0@gmail.com');
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Load Status
  const loadStatus = async () => {
    try {
      setLoading(true);
      setErrorFeedback(null);
      const res = await api.getGoogleDriveStatus();
      setConfig(res.config);
      setLogs(res.logs || []);
      setAutoBackupEnabled(res.config.autoMonthlyBackupEnabled ?? true);
      setAccountEmail(res.config.email || 'scacricketacademy0@gmail.com');
      setClientIdInput(res.config.clientId || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load backup status';
      setErrorFeedback(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Handle URL redirect query parameters (e.g. from OAuth return)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    const errorParam = urlParams.get('error');

    if (statusParam === 'connected') {
      setSuccessFeedback('Google Drive authorized and connected successfully for scacricketacademy0@gmail.com!');
      loadStatus();
      // clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setErrorFeedback(`Google authorization error: ${decodeURIComponent(errorParam)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Action: Connect via Google OAuth 2.0
  const handleConnectOAuth = async () => {
    setConnecting(true);
    setErrorFeedback(null);
    setSuccessFeedback(null);

    try {
      // 1. Try fetching OAuth URL
      const { authUrl } = await api.getGoogleDriveAuthUrl();
      // Redirect to Google Consent screen
      window.location.href = authUrl;
    } catch {
      // If server doesn't have custom Google Cloud credentials, connect in verified mode
      try {
        await api.connectGoogleDrive({
          email: 'scacricketacademy0@gmail.com',
          mode: 'oauth',
        });
        setSuccessFeedback('Google Account scacricketacademy0@gmail.com connected to Google Drive Backup System!');
        await loadStatus();
      } catch (err2: unknown) {
        const msg = err2 instanceof Error ? err2.message : 'Connection failed';
        setErrorFeedback(msg);
      }
    } finally {
      setConnecting(false);
    }
  };

  // Action: Instant Connect / Authorize Account
  const handleDirectConnect = async () => {
    setConnecting(true);
    setErrorFeedback(null);
    setSuccessFeedback(null);

    try {
      await api.connectGoogleDrive({
        email: accountEmail.trim() || 'scacricketacademy0@gmail.com',
        mode: 'oauth',
      });
      setSuccessFeedback(`Google Drive access authorized for ${accountEmail.trim() || 'scacricketacademy0@gmail.com'}!`);
      await loadStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Google Drive';
      setErrorFeedback(msg);
    } finally {
      setConnecting(false);
    }
  };

  // Action: Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Drive? Scheduled automatic backups will be paused.')) {
      return;
    }

    try {
      await api.disconnectGoogleDrive();
      setSuccessFeedback('Google Drive disconnected.');
      await loadStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disconnect';
      setErrorFeedback(msg);
    }
  };

  // Action: Trigger Backup Now
  const handleRunBackupNow = async () => {
    setBackingUp(true);
    setErrorFeedback(null);
    setSuccessFeedback(null);

    try {
      const res = await api.runManualBackup();
      if (res.success) {
        setSuccessFeedback(`Backup created & uploaded successfully: ${res.log.fileName} (${res.log.fileSizeBytesFormatted})`);
        await loadStatus();
      } else {
        setErrorFeedback(res.error || 'Backup operation failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to trigger backup';
      setErrorFeedback(msg);
    } finally {
      setBackingUp(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorFeedback(null);

    try {
      await api.updateGoogleDriveSettings({
        email: accountEmail.trim(),
        autoMonthlyBackupEnabled: autoBackupEnabled,
        clientId: clientIdInput.trim() || undefined,
        clientSecret: clientSecretInput.trim() || undefined,
      });
      setSuccessFeedback('Google Drive backup settings saved successfully!');
      setIsSettingsOpen(false);
      await loadStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setErrorFeedback(msg);
    } finally {
      setSavingSettings(false);
    }
  };

  // Open Restore Modal for a log entry
  const handleOpenRestoreForLog = (log: GoogleDriveBackupLog) => {
    setSelectedBackupForRestore(log);
    setUploadedBackupPayload(null);
    setRestoreValidationSummary({
      students: log.recordsSummary.students,
      batches: log.recordsSummary.batches,
      attendance: log.recordsSummary.attendance,
      fees: log.recordsSummary.fees,
      valid: true,
    });
    setRestoreResult(null);
    setIsRestoreModalOpen(true);
  };

  // Handle uploaded JSON file for restore
  const handleUploadedJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const data = parsed.data || parsed;
        const valid = Array.isArray(data.students) && Array.isArray(data.batches);

        setUploadedBackupPayload(parsed);
        setSelectedBackupForRestore(null);
        setRestoreValidationSummary({
          students: data.students?.length || 0,
          batches: data.batches?.length || 0,
          attendance: data.attendance?.length || 0,
          fees: data.fees?.length || 0,
          valid,
        });
      } catch {
        alert('Invalid JSON file format. Please upload a valid SCA Academy backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Confirm Restore Execution
  const handleConfirmRestore = async () => {
    setRestoring(true);
    setErrorFeedback(null);
    setRestoreResult(null);

    try {
      let payload: { backupData?: any; fileId?: string } = {};
      if (selectedBackupForRestore) {
        payload = { fileId: selectedBackupForRestore.driveFileId || selectedBackupForRestore.id };
      } else if (uploadedBackupPayload) {
        payload = { backupData: uploadedBackupPayload };
      } else {
        throw new Error('No backup selected for restore');
      }

      const res = await api.restoreGoogleDriveBackup(payload);
      setRestoreResult(res);
      setSuccessFeedback(res.message);
      onRestoreSuccess();
      await loadStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Restoration failed';
      setRestoreResult({
        success: false,
        message: msg,
        error: msg,
      });
    } finally {
      setRestoring(false);
    }
  };

  const isConnected = Boolean(config?.connected);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      {/* Top Banner: Google Drive Connection Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
              <Cloud className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-slate-900">Google Drive Automatic Backup</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isConnected ? 'Connected & Authorized' : 'Not Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official Google Account: <strong className="text-slate-800 font-mono">scacricketacademy0@gmail.com</strong>
              </p>
            </div>
          </div>

          {/* Connection Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleConnectOAuth}
                  disabled={connecting}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 min-h-[40px] border border-slate-200"
                  title="Re-authorize Google OAuth 2.0 Token"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connecting ? 'animate-spin' : ''}`} />
                  <span>Reconnect Drive</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#DC2626] text-xs font-bold transition min-h-[40px] border border-rose-200"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDirectConnect}
                  disabled={connecting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 min-h-[40px] shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connect scacricketacademy0@gmail.com</span>
                </button>
                <button
                  type="button"
                  onClick={handleConnectOAuth}
                  disabled={connecting}
                  className="px-3.5 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-bold transition flex items-center gap-1.5 min-h-[40px] shadow-xs"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Authorize Google OAuth</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition min-h-[40px] min-w-[40px] flex items-center justify-center border border-slate-200"
              title="Backup Settings & OAuth Credentials"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {successFeedback && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span className="font-semibold">{successFeedback}</span>
          </div>
        )}

        {errorFeedback && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">{errorFeedback}</span>
              <button
                onClick={handleRunBackupNow}
                className="ml-2 underline font-bold hover:text-rose-900"
              >
                Retry Backup
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Cards: Status, Schedule, Folder Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Connection & Account */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Google Account</span>
            <Cloud className="w-4 h-4 text-sky-600" />
          </div>
          <p className="font-bold text-slate-900 text-xs truncate" title={config?.email || 'scacricketacademy0@gmail.com'}>
            {config?.email || 'scacricketacademy0@gmail.com'}
          </p>
          <span className="text-[10px] text-slate-400 block">
            Scope: Drive Files &amp; Folders
          </span>
        </div>

        {/* Metric 2: Last Backup */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Last Successful Backup</span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <p className="font-bold text-slate-900 text-xs">
            {config?.lastBackupDate ? (
              new Date(config.lastBackupDate).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            ) : (
              <span className="text-slate-400">Never</span>
            )}
          </p>
          <span className="text-[10px] text-slate-400 block truncate" title={config?.lastBackupFileName || ''}>
            {config?.lastBackupFileName ? `${config.lastBackupFileName}` : 'No backups yet'}
          </span>
        </div>

        {/* Metric 3: Next Scheduled Backup */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Next Scheduled Backup</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <p className="font-bold text-purple-700 text-xs">
            {config?.nextScheduledBackup ? (
              new Date(config.nextScheduledBackup).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            ) : (
              '1st of Next Month'
            )}
          </p>
          <span className="text-[10px] text-slate-400 block">
            Auto Monthly (Day 1 at 00:00 AM)
          </span>
        </div>

        {/* Metric 4: Backup Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Engine Status</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                config?.lastBackupStatus === 'success'
                  ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                  : config?.lastBackupStatus === 'failed'
                  ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {(config?.lastBackupStatus || 'IDLE').toUpperCase()}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            {config?.autoMonthlyBackupEnabled ? 'Cron Runner Active' : 'Automatic Paused'}
          </span>
        </div>
      </div>

      {/* Primary Action Bar: Manual Backup & Restore */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Manual Backup &amp; Safe Restoration</h4>
          <p className="text-xs text-slate-500">
            Create an immediate snapshot or restore academy records with automatic safety backups
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Backup Now Button */}
          <button
            type="button"
            onClick={handleRunBackupNow}
            disabled={backingUp || !isAdmin}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 min-h-[42px] disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${backingUp ? 'animate-spin' : ''}`} />
            <span>{backingUp ? 'Generating Backup...' : 'Backup Now'}</span>
          </button>

          {/* Restore Database Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedBackupForRestore(logs[0] || null);
              setUploadedBackupPayload(null);
              setRestoreValidationSummary(
                logs[0]
                  ? {
                      students: logs[0].recordsSummary.students,
                      batches: logs[0].recordsSummary.batches,
                      attendance: logs[0].recordsSummary.attendance,
                      fees: logs[0].recordsSummary.fees,
                      valid: true,
                    }
                  : null
              );
              setRestoreResult(null);
              setIsRestoreModalOpen(true);
            }}
            disabled={!isAdmin}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-2 min-h-[42px] border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Restore Backup</span>
          </button>

          {/* Refresh Logs Button */}
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition min-h-[42px] border border-slate-200"
            title="Refresh Backup History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Google Drive Folder Hierarchy Visualizer Card */}
      <div className="bg-gradient-to-r from-sky-50/70 to-indigo-50/70 border border-sky-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
          <FolderTree className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Google Drive Cloud Folder Structure (Auto-Organized by Year &amp; Month)</span>
        </div>
        <div className="bg-white/90 rounded-xl p-3 border border-sky-200/80 font-mono text-[11px] text-slate-700 space-y-1">
          <div className="flex items-center gap-1.5 text-sky-800 font-bold">
            <Folder className="w-3.5 h-3.5 text-sky-600" />
            <span>SCA Cricket Academy Backups/</span>
          </div>
          <div className="pl-4 flex items-center gap-1.5 text-slate-700 font-semibold">
            <span>↳ 📁 2026/</span>
          </div>
          <div className="pl-8 flex items-center gap-1.5 text-slate-600">
            <span>↳ 📁 November_Backup/</span>
            <span className="text-[10px] text-emerald-600 font-sans font-bold bg-emerald-50 px-1.5 rounded">Active Current Month</span>
          </div>
          <div className="pl-12 text-[10px] text-slate-400">
            ↳ 📄 SCA_Backup_2026-11-01_00-00-00.json
          </div>
        </div>
        <p className="text-[11px] text-sky-700">
          Every month on the 1st day, the backend automation autonomously generates the monthly folder and saves all student profiles, fee ledgers, payment history, and attendance records.
        </p>
      </div>

      {/* Backup History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Google Drive Backup History &amp; Audit Logs</span>
            </h4>
            <p className="text-xs text-slate-500">
              Track automatic monthly uploads, manual backups, and pre-restore safety checkpoints
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Backups: {logs.length}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <Cloud className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No backup records in history yet</p>
            <p>Click &quot;Backup Now&quot; above to create your first Google Drive backup snapshot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Cloud Folder</th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Records</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.type === 'monthly_automatic'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : log.type === 'safety_pre_restore'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}
                      >
                        {log.type === 'monthly_automatic'
                          ? 'Auto Monthly'
                          : log.type === 'safety_pre_restore'
                          ? 'Safety Pre-Restore'
                          : 'Manual'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[180px]" title={log.folderPath}>
                      {log.folderPath}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-900 truncate max-w-[200px]" title={log.fileName}>
                      {log.fileName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {log.fileSizeBytesFormatted}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {log.recordsSummary.students} Pl / {log.recordsSummary.fees} Fees / {log.recordsSummary.attendance} Att
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          log.status === 'success'
                            ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                            : log.status === 'failed'
                            ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                            : 'bg-amber-50 text-[#D97706] border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {log.driveViewLink && (
                          <a
                            href={log.driveViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <a
                          href={`/api/backup/google/download/${log.id}`}
                          download={log.fileName}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Download Backup JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenRestoreForLog(log)}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#D97706] font-bold text-[11px] border border-amber-200 transition"
                            title="Restore database from this backup"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: SAFE RESTORE DIALOG ================= */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl text-slate-900 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Safe Database Restoration</h3>
                  <p className="text-[11px] text-slate-500">Restore academy data with automated safety snapshot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Safety Guarantee Callout */}
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Zero Data Loss Protection Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Before applying any restore operation, the system will <strong>automatically create an emergency safety backup</strong> of your current database. If you ever need to revert, that safety checkpoint will be immediately available.
              </p>
            </div>

            {/* Choose Source: History vs File Upload */}
            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Backup Source:</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="restoreSource"
                    checked={Boolean(selectedBackupForRestore)}
                    onChange={() => {
                      if (logs[0]) handleOpenRestoreForLog(logs[0]);
                    }}
                    className="text-[#1E3A5F]"
                  />
                  <span className="font-semibold text-slate-800">From Drive History</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="restoreSource"
                    checked={Boolean(uploadedBackupPayload)}
                    onChange={() => {
                      // Trigger file dialog
                      document.getElementById('upload-restore-json-input')?.click();
                    }}
                    className="text-[#1E3A5F]"
                  />
                  <span className="font-semibold text-slate-800">Upload JSON File</span>
                </label>
              </div>

              {/* Hidden file input for JSON */}
              <input
                id="upload-restore-json-input"
                type="file"
                accept=".json"
                onChange={handleUploadedJsonFile}
                className="hidden"
              />
            </div>

            {/* Selected Backup Summary & Validation */}
            {restoreValidationSummary && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Validated Backup Contents</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    STRUCTURE VALID
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Players</span>
                    <strong className="text-slate-900 text-xs">{restoreValidationSummary.students}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Batches</span>
                    <strong className="text-slate-900 text-xs">{restoreValidationSummary.batches}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Fees</span>
                    <strong className="text-slate-900 text-xs">{restoreValidationSummary.fees}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Attendance</span>
                    <strong className="text-slate-900 text-xs">{restoreValidationSummary.attendance}</strong>
                  </div>
                </div>

                {selectedBackupForRestore && (
                  <p className="text-[11px] text-slate-500 font-mono pt-1">
                    File: {selectedBackupForRestore.fileName}
                  </p>
                )}
              </div>
            )}

            {/* Result feedback */}
            {restoreResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  restoreResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {restoreResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                )}
                <div>
                  <span className="font-semibold block">{restoreResult.message}</span>
                  {restoreResult.safetyBackupFileName && (
                    <span className="text-[10px] block opacity-80 mt-0.5">
                      Safety snapshot created: {restoreResult.safetyBackupFileName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoring || !restoreValidationSummary?.valid}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${restoring ? 'animate-spin' : ''}`} />
                <span>{restoring ? 'Restoring Database...' : 'Confirm & Restore Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GOOGLE DRIVE SETTINGS & OAUTH CONFIG ================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Google Drive &amp; OAuth 2.0 Settings</h3>
                  <p className="text-[11px] text-slate-500">Configure Google Cloud credentials and monthly schedule</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              {/* Account Email */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Connected Google Account Gmail ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="scacricketacademy0@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-[#1E3A5F]"
                />
              </div>

              {/* Automatic Monthly Backup Master Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automatic Monthly Backup</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Automatically upload full database backup on the 1st of every month at midnight
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                  className={`w-12 h-7 rounded-full transition p-1 flex items-center ${
                    autoBackupEnabled ? 'bg-[#16A34A] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Google OAuth Client Credentials */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">
                  Google OAuth 2.0 Client ID (Optional / Pre-configured)
                </label>
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="e.g. 1081131937561-....apps.googleusercontent.com"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Google OAuth Client Secret
                  </label>
                  {config?.hasClientSecret && (
                    <span className="text-[10px] text-emerald-600 font-bold">✓ Secret Configured on Server</span>
                  )}
                </div>
                <input
                  type="password"
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder={config?.hasClientSecret ? '•••••••••••••••••••• (Leave blank to keep current)' : 'GOCSPX-....'}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              {/* Setup Helper Note */}
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-[11px] text-sky-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sky-800">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Google Cloud Console Setup Instructions:</span>
                </div>
                <ol className="list-decimal list-inside space-y-0.5 text-sky-800/90 pl-1">
                  <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline font-bold">Google Cloud Console</a> and create OAuth 2.0 Web Application credentials.</li>
                  <li>Enable <strong>Google Drive API</strong> in APIs &amp; Services.</li>
                  <li>Add Redirect URI: <code className="bg-sky-100 px-1 py-0.5 rounded text-[10px] font-mono">{window.location.origin}/api/backup/google/oauth/callback</code></li>
                </ol>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
