export type UserRole = 'admin' | 'coach';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: UserRole;
  phone: string;
  assignedBatches?: string[];
  coachNumber?: number; // 1: Jagadeesh, 2: Baskar, 3: Vijay, 4: Gokul
}

export interface LoginCredentials {
  nameOrUsername: string;
  password: string;
}

export type AgeGroup = 'All Ages' | 'U-12' | 'U-14' | 'U-16' | 'U-19' | 'Open';

export type CricketRole =
  | 'Top-order Batsman'
  | 'Middle-order Batsman'
  | 'Wicketkeeper Batsman'
  | 'Right-arm Fast Bowler'
  | 'Left-arm Fast Bowler'
  | 'Off Spinner'
  | 'Leg Spinner'
  | 'All-Rounder';

export interface Student {
  id: string; // e.g. "SCA-101"
  name: string;
  dob: string;
  ageGroup: AgeGroup;
  batch: string;
  role: CricketRole;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  emergencyPhone: string;
  monthlyFee: number; // In INR
  active: boolean;
  joinedDate: string;
  bloodGroup: string;
  notes?: string;
  notificationPreferences?: NotificationPreferences;
  welcomeMessageStatus?: 'sent' | 'pending' | 'failed';
  welcomeSentAt?: string;
  welcomeEventId?: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  whatsappEnabled: boolean;
  overdueAlerts: boolean;
  upcomingDueDateAlerts: boolean;
  attendanceAlerts: boolean;
}

export type NotificationType =
  | 'fee_overdue'
  | 'fee_upcoming'
  | 'payment_receipt'
  | 'attendance_alert'
  | 'welcome_message'
  | 'system'
  | 'system_alert';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  studentId?: string;
  studentName?: string;
  guardianPhone?: string;
  amount?: number;
  dueDate?: string;
  timestamp: string;
  read: boolean;
  channel: 'push' | 'in_app' | 'whatsapp';
  whatsappLink?: string;
}

export interface NotificationSettings {
  autoFeeRemindersEnabled: boolean;
  upcomingDaysBefore: number; // e.g. 3 days before
  overdueFrequencyDays: number; // e.g. every 3 days
  upiId: string;
  upiNumber?: string;
  helplinePhone?: string;
  templateUpcoming: string;
  templateOverdue: string;
  lastAutomatedRun: string | null;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  batch: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  markedBy: string;
  timestamp: string;
}

export type PaymentMode = 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';

export interface PaymentItem {
  paymentId: string;
  amount: number;
  date: string;
  mode: PaymentMode;
  referenceNo: string;
  recordedBy: string;
  notes?: string;
}

export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue' | 'unpaid';

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  batch: string;
  monthYear: string; // e.g. "2026-10"
  monthlyFee: number;
  amountPaid: number;
  balance: number;
  status: FeeStatus;
  dueDate: string;
  lastPaymentDate: string | null;
  payments: PaymentItem[];
}

export interface Batch {
  id: string;
  name: string;
  timing: string;
  days: string;
  assignedCoach: string;
  coachId: string;
  capacity: number;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  action: string;
  recordsCount: number;
  status: 'success' | 'error';
  details: string;
}

export interface SheetsSyncConfig {
  spreadsheetId: string;
  sheetUrl: string;
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'success' | 'failed';
  autoSyncOnSave: boolean;
  syncLogs: SyncLog[];
}

export interface AcademyStats {
  totalStudents: number;
  activeStudents: number;
  todayAttendance: {
    total: number;
    present: number;
    absent: number;
    rate: number;
  };
  feesThisMonth: {
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
  };
  batchesCount: number;
  unreadNotificationsCount?: number;
}

export interface WelcomeMessageSettings {
  enabled: boolean;
  familyGroupLink: string;
  updatesGroupLink: string;
  instagramLink: string;
  youtubeLink: string;
  templateText: string;
  cloudApiEnabled: boolean;
  cloudApiPhoneNumberId?: string;
  cloudApiAccessToken?: string;
}

export interface WelcomeMessageLog {
  id: string; // unique registration event ID e.g. WELCOME-EVT-...
  studentId: string;
  studentName: string;
  phone: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'failed';
  channel: 'cloud_api' | 'whatsapp_link';
  whatsappLink: string;
  content: string;
  errorMessage?: string;
  retryCount?: number;
}

// --- Google Drive Automatic Backup System ---
export interface GoogleDriveConfig {
  email: string; // Default: 'scacricketacademy0@gmail.com'
  connected: boolean;
  clientId?: string;
  clientSecret?: string; // backend only
  hasClientSecret?: boolean;
  accessToken?: string; // backend only
  refreshToken?: string; // backend only
  hasRefreshToken?: boolean;
  tokenExpiry?: number;
  autoMonthlyBackupEnabled: boolean;
  backupDayOfMonth: number; // 1 (1st day of every month)
  backupHourOfDay: number; // 0 (midnight)
  lastBackupDate: string | null;
  lastBackupFileName: string | null;
  lastBackupFileSize: number | null; // bytes
  lastBackupStatus: 'success' | 'failed' | 'pending' | 'idle';
  lastBackupError?: string | null;
  nextScheduledBackup: string;
  driveFolderId?: string;
  driveFolderPath?: string;
  mode: 'oauth' | 'simulated';
}

export interface GoogleDriveBackupLog {
  id: string;
  timestamp: string;
  type: 'monthly_automatic' | 'manual' | 'safety_pre_restore';
  status: 'success' | 'failed' | 'pending';
  fileName: string;
  folderPath: string; // e.g. 'SCA Cricket Academy Backups/2026/November_Backup'
  fileSize: number; // in bytes
  fileSizeBytesFormatted: string; // e.g. '48.2 KB'
  driveFileId?: string;
  driveViewLink?: string;
  recordsSummary: {
    students: number;
    attendance: number;
    fees: number;
    batches: number;
    users: number;
  };
  errorMessage?: string;
  initiatedBy: string; // 'System Automation' or Admin name
}

export interface BackupRestoreResult {
  success: boolean;
  message: string;
  safetyBackupId?: string;
  safetyBackupFileName?: string;
  restoredRecords?: {
    students: number;
    attendance: number;
    fees: number;
    batches: number;
    users: number;
  };
  error?: string;
}
