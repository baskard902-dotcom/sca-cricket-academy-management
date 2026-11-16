import {
  Student,
  AttendanceRecord,
  FeeRecord,
  Batch,
  User,
  SheetsSyncConfig,
  AcademyStats,
  NotificationItem,
  NotificationSettings,
  NotificationPreferences,
  WelcomeMessageSettings,
  WelcomeMessageLog,
  GoogleDriveConfig,
  GoogleDriveBackupLog,
  BackupRestoreResult,
} from '../types/index.ts';

class ApiService {
  private currentUserId: string = 'USR-001';
  private currentUserRole: 'admin' | 'coach' = 'admin';

  setAuth(userId: string, role: 'admin' | 'coach') {
    this.currentUserId = userId;
    this.currentUserRole = role;
    localStorage.setItem('sca_user_id', userId);
    localStorage.setItem('sca_user_role', role);
  }

  loadStoredAuth(): { userId: string; role: 'admin' | 'coach' } {
    const storedId = localStorage.getItem('sca_user_id');
    const storedRole = localStorage.getItem('sca_user_role') as 'admin' | 'coach' | null;
    if (storedId && storedRole) {
      this.currentUserId = storedId;
      this.currentUserRole = storedRole;
    }
    return { userId: this.currentUserId, role: this.currentUserRole };
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.currentUserId,
      'x-user-role': this.currentUserRole,
    };
  }

  async getMe(): Promise<{ user: User; allUsers: User[] }> {
    const res = await fetch('/api/me', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user session');
    return res.json();
  }

  async switchRole(userId: string): Promise<User> {
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to switch role');
    const data = await res.json();
    this.setAuth(data.user.id, data.user.role);
    return data.user;
  }

  async login(nameOrUsername: string, password: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameOrUsername, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid coach credentials');
    }
    const data = await res.json();
    this.setAuth(data.user.id, data.user.role);
    return data.user;
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // ignore
    }
    localStorage.removeItem('sca_user_id');
    localStorage.removeItem('sca_user_role');
  }

  async getBatches(): Promise<Batch[]> {
    const res = await fetch('/api/batches', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch batches');
    return res.json();
  }

  async getStudents(query?: string, batch?: string, active?: boolean): Promise<Student[]> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (batch && batch !== 'all') params.set('batch', batch);
    if (active !== undefined) params.set('active', String(active));

    const res = await fetch(`/api/students?${params.toString()}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  }

  async addStudent(data: Omit<Student, 'id'>): Promise<Student & { welcomeResult?: any }> {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add student');
    }
    return res.json();
  }

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update student');
    return res.json();
  }

  async deleteStudent(id: string): Promise<void> {
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to deactivate student');
    }
  }

  async getAttendance(date?: string, batch?: string): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (batch && batch !== 'all') params.set('batch', batch);

    const res = await fetch(`/api/attendance?${params.toString()}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  }

  async saveAttendance(
    date: string,
    batch: string,
    records: Array<{ studentId: string; status: 'present' | 'absent' | 'late' }>
  ): Promise<{
    success: boolean;
    savedCount: number;
    isUpdate: boolean;
    message: string;
    absentCount?: number;
    absentStudents?: Array<{
      studentId: string;
      studentName: string;
      guardianPhone: string;
      whatsappLink: string;
    }>;
    lowAttendanceStudents?: Array<{
      studentId: string;
      studentName: string;
      attendanceRate: number;
      guardianPhone: string;
      whatsappLink: string;
    }>;
  }> {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ date, batch, records }),
    });
    if (!res.ok) throw new Error('Failed to save attendance');
    return res.json();
  }

  async getFees(monthYear?: string, batch?: string, status?: string): Promise<FeeRecord[]> {
    const params = new URLSearchParams();
    if (monthYear) params.set('monthYear', monthYear);
    if (batch && batch !== 'all') params.set('batch', batch);
    if (status && status !== 'all') params.set('status', status);

    const res = await fetch(`/api/fees?${params.toString()}`, { headers: this.getHeaders() });
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('FORBIDDEN_FINANCIAL_ACCESS');
      }
      throw new Error('Failed to load fees');
    }
    return res.json();
  }

  async recordPayment(
    studentId: string,
    monthYear: string,
    payment: {
      amount: number;
      mode: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
      referenceNo: string;
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    feeRecord: FeeRecord;
    receiptWhatsappLink?: string;
    receiptNotification?: NotificationItem;
  }> {
    const res = await fetch('/api/fees/payment', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ studentId, monthYear, ...payment }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record payment');
    }
    return res.json();
  }

  async getPaymentReceiptWhatsapp(
    studentId: string,
    monthYear: string
  ): Promise<{ whatsappLink: string; receiptText: string }> {
    const res = await fetch(`/api/fees/${studentId}/receipt?monthYear=${encodeURIComponent(monthYear)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch payment receipt');
    return res.json();
  }

  async getReports(): Promise<AcademyStats> {
    const res = await fetch('/api/reports', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch academy reports');
    return res.json();
  }

  async getSheetsConfig(): Promise<SheetsSyncConfig> {
    const res = await fetch('/api/sheets/config', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch Google Sheets config');
    return res.json();
  }

  async triggerSheetsSync(): Promise<{ success: boolean; message: string; recordsSynced: number; timestamp: string }> {
    const res = await fetch('/api/sheets/sync', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sync with Google Sheets');
    }
    return res.json();
  }

  async updateSheetsConfig(data: Partial<SheetsSyncConfig>): Promise<SheetsSyncConfig> {
    const res = await fetch('/api/sheets/config', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update Google Sheets settings');
    return res.json();
  }

  getExportUrl(type: 'students' | 'attendance' | 'fees'): string {
    return `/api/export/csv/${type}`;
  }

  getBackupUrl(): string {
    return '/api/backup';
  }

  async restoreBackup(data: unknown): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to restore backup');
    }
    return res.json();
  }

  async getNotifications(unreadOnly?: boolean): Promise<NotificationItem[]> {
    const params = new URLSearchParams();
    if (unreadOnly) params.set('unread', 'true');
    const res = await fetch(`/api/notifications?${params.toString()}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  }

  async markNotificationRead(id: string): Promise<void> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark notification read');
  }

  async markAllNotificationsRead(): Promise<void> {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark all notifications read');
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const res = await fetch('/api/notifications/settings', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notification settings');
    return res.json();
  }

  async updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const res = await fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update notification settings');
    return res.json();
  }

  async runAutomatedFeeReminders(): Promise<{
    success: boolean;
    processed: number;
    sent: number;
    notifications: NotificationItem[];
    message: string;
  }> {
    const res = await fetch('/api/notifications/reminders/run', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to trigger automated fee reminders');
    }
    return res.json();
  }

  async sendManualFeeReminder(
    studentId: string,
    monthYear: string
  ): Promise<{ success: boolean; notification: NotificationItem; message: string }> {
    const res = await fetch('/api/notifications/reminders/send-individual', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ studentId, monthYear }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send fee reminder');
    }
    return res.json();
  }

  async updateStudentNotificationPreferences(
    studentId: string,
    prefs: NotificationPreferences
  ): Promise<void> {
    const res = await fetch(`/api/students/${studentId}/notification-preferences`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(prefs),
    });
    if (!res.ok) throw new Error('Failed to update student notification preferences');
  }

  async checkHealth(): Promise<{
    status: string;
    uptime: number;
    timestamp: string;
    apiStatus: string;
    sheetsSync: {
      lastSyncTime: string | null;
      syncStatus: string;
      autoSyncOnSave: boolean;
      spreadsheetId: string;
      lastLog?: {
        id: string;
        timestamp: string;
        action: string;
        recordsCount: number;
        status: 'success' | 'error';
        details: string;
      } | null;
    };
    version: string;
    mode: string;
    latencyMs: number;
  }> {
    const start = performance.now();
    const res = await fetch('/api/health', { headers: this.getHeaders() });
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) throw new Error('API connection health check failed');
    const data = await res.json();
    return { ...data, latencyMs };
  }

  async sendChatMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    role: 'coach' | 'performance' | 'operations',
    model: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'
  ): Promise<{ reply: string; modelUsed: string; role: string }> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ messages, role, model }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error ${res.status}: Failed to generate response`);
    }
    return res.json();
  }

  // --- Welcome & Social Media Invitation System ---
  async getWelcomeSettings(): Promise<WelcomeMessageSettings> {
    const res = await fetch('/api/welcome/settings', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch welcome settings');
    return res.json();
  }

  async updateWelcomeSettings(settings: Partial<WelcomeMessageSettings>): Promise<WelcomeMessageSettings> {
    const res = await fetch('/api/welcome/settings', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update welcome settings');
    return res.json();
  }

  async getWelcomeLogs(): Promise<WelcomeMessageLog[]> {
    const res = await fetch('/api/welcome/logs', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch welcome logs');
    return res.json();
  }

  async sendWelcomeMessage(studentId: string, forceRetry = false): Promise<{
    success: boolean;
    status: 'sent' | 'pending' | 'failed';
    whatsappLink: string;
    messageText: string;
    errorMessage?: string;
    log?: WelcomeMessageLog;
  }> {
    const res = await fetch(`/api/welcome/send/${studentId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ forceRetry }),
    });
    if (!res.ok) throw new Error('Failed to send welcome message');
    return res.json();
  }

  async previewWelcomeMessage(studentName?: string, settings?: WelcomeMessageSettings): Promise<{ previewText: string }> {
    const res = await fetch('/api/welcome/preview', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ studentName, settings }),
    });
    if (!res.ok) throw new Error('Failed to preview welcome message');
    return res.json();
  }

  // --- Google Drive Backup Integration ---
  async getGoogleDriveStatus(): Promise<{
    config: GoogleDriveConfig;
    logs: GoogleDriveBackupLog[];
    isAdmin: boolean;
  }> {
    const res = await fetch('/api/backup/google/status', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch Google Drive backup status');
    return res.json();
  }

  async getGoogleDriveAuthUrl(): Promise<{ authUrl: string; redirectUri: string }> {
    const res = await fetch('/api/backup/google/auth-url', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to get Google OAuth URL');
    return res.json();
  }

  async connectGoogleDrive(payload: {
    email?: string;
    mode?: 'oauth' | 'simulated';
    accessToken?: string;
    refreshToken?: string;
  }): Promise<{ success: boolean; message: string; config: GoogleDriveConfig }> {
    const res = await fetch('/api/backup/google/connect-account', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to connect Google Drive');
    }
    return res.json();
  }

  async disconnectGoogleDrive(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/backup/google/disconnect', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to disconnect Google Drive');
    return res.json();
  }

  async updateGoogleDriveSettings(payload: Partial<GoogleDriveConfig>): Promise<{ success: boolean; config: GoogleDriveConfig }> {
    const res = await fetch('/api/backup/google/settings', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update Google Drive settings');
    return res.json();
  }

  async runManualBackup(): Promise<{
    success: boolean;
    log: GoogleDriveBackupLog;
    error?: string;
  }> {
    const res = await fetch('/api/backup/google/run', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute backup');
    }
    return res.json();
  }

  async restoreGoogleDriveBackup(payload: {
    backupData?: any;
    fileId?: string;
  }): Promise<BackupRestoreResult> {
    const res = await fetch('/api/backup/google/restore', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to restore database');
    }
    return data;
  }
}

export const api = new ApiService();
