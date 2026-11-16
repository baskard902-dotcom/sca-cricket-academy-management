import fs from 'fs';
import path from 'path';
import {
  Student,
  AttendanceRecord,
  FeeRecord,
  Batch,
  User,
  SheetsSyncConfig,
  AcademyStats,
  PaymentItem,
  NotificationItem,
  NotificationSettings,
  NotificationPreferences,
  WelcomeMessageSettings,
  WelcomeMessageLog,
  GoogleDriveConfig,
  GoogleDriveBackupLog,
} from '../src/types/index.ts';

const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'sca_db.json');

export interface DatabaseSchema {
  users: User[];
  batches: Batch[];
  students: Student[];
  attendance: AttendanceRecord[];
  fees: FeeRecord[];
  sheetsConfig: SheetsSyncConfig;
  notifications: NotificationItem[];
  notificationSettings: NotificationSettings;
  welcomeSettings?: WelcomeMessageSettings;
  welcomeLogs?: WelcomeMessageLog[];
  googleDriveConfig?: GoogleDriveConfig;
  backupLogs?: GoogleDriveBackupLog[];
}

// Official SCA Coaches Credential & Password Map
export const COACH_PASSWORDS: Record<string, string> = {
  jagadeesh: 'jaga@12',
  baskar: 'baskar@12',
  vijay: 'vijay@12',
  gokul: 'gokul@12',
  admin: 'admin@12',
};

export function formatPrettyDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dateObj = new Date(y, m - 1, d);
  const dayName = dayNames[dateObj.getDay()] || '';
  const monthName = monthNames[m - 1] || '';
  return `${dayName}, ${d} ${monthName} ${y}`;
}

export function buildAbsentAlertMessage(params: {
  studentName: string;
  studentId: string;
  batch: string;
  date: string;
  markedBy: string;
}): string {
  const prettyDate = formatPrettyDate(params.date);
  return [
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
    `• *Student Name:* ${params.studentName}`,
    `• *Student ID:* ${params.studentId}`,
    `• *Batch:* ${params.batch} (04:30 PM - 07:00 PM)`,
    `• *Date:* ${prettyDate}`,
    `• *Marked By:* ${params.markedBy}`,
    `• *Attendance Status:* ❌ ABSENT`,
    ``,
    `⚠️ *Important Safety Notice:*`,
    `If this absence was unplanned or if your child had left home for academy practice, please contact coaching staff immediately for their safety.`,
    ``,
    `📞 *Academy Helpline:* +91 63804 49589`,
    `📍 *Venue:* SCA Cricket Academy Grounds`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_SCA Academy Management System_ 🏏`,
  ].join('\n');
}

export function buildLowAttendanceMessage(params: {
  studentName: string;
  studentId: string;
  batch: string;
  rate: number;
  presentSessions: number;
  totalSessions: number;
}): string {
  return [
    `🏏 *SCA CRICKET ACADEMY*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⚠️ *LOW ATTENDANCE WARNING*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Dear Parent / Guardian,`,
    ``,
    `We noticed that *${params.studentName}*'s attendance in the *${params.batch}* has dropped below our mandatory 75% threshold.`,
    ``,
    `📋 *Attendance Summary:*`,
    `• *Student Name:* ${params.studentName} (${params.studentId})`,
    `• *Batch:* ${params.batch}`,
    `• *Current Attendance:* ${params.rate}% (${params.presentSessions} of ${params.totalSessions} sessions attended)`,
    `• *Required Minimum:* 75%`,
    ``,
    `⭐ *Coaching Recommendation:*`,
    `Regular net practice, fitness drills, and match simulations are critical for cricket skill development, match fitness, and tournament selection. Please ensure regular attendance.`,
    ``,
    `📞 *Academy Helpline:* +91 63804 49589`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_SCA Academy Management System_ 🏏`,
  ].join('\n');
}

export function buildPaymentReceiptMessage(params: {
  referenceNo: string;
  studentName: string;
  studentId: string;
  batch: string;
  monthYear: string;
  amount: number;
  mode: string;
  date: string;
  balance: number;
  status: string;
  recordedBy: string;
}): string {
  const prettyDate = formatPrettyDate(params.date);
  return [
    `🏏 *SCA CRICKET ACADEMY*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ *OFFICIAL PAYMENT RECEIPT*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Dear Parent / Guardian,`,
    ``,
    `Thank you! We have successfully received your fee payment for *${params.studentName}*.`,
    ``,
    `📋 *Receipt Details:*`,
    `• *Receipt / Ref No:* ${params.referenceNo}`,
    `• *Student:* ${params.studentName} (${params.studentId})`,
    `• *Batch:* ${params.batch}`,
    `• *Fee Month:* ${params.monthYear}`,
    `• *Amount Paid:* ₹${Number(params.amount).toLocaleString('en-IN')}`,
    `• *Payment Mode:* ${params.mode}`,
    `• *Payment Date:* ${prettyDate}`,
    `• *Remaining Balance:* ₹${Number(params.balance).toLocaleString('en-IN')}`,
    `• *Payment Status:* ${params.status.toUpperCase()}`,
    ``,
    `👤 *Recorded By:* ${params.recordedBy}`,
    ``,
    `📞 *Academy Helpline:* +91 63804 49589`,
    `Thank you for being part of SCA Cricket Academy! 🏆`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_SCA Academy Management System_ 🏏`,
  ].join('\n');
}

export function buildFeeReminderMessage(params: {
  isOverdue: boolean;
  studentName: string;
  batch: string;
  amount: number;
  dueDate: string;
  upiId: string;
}): string {
  const prettyDueDate = formatPrettyDate(params.dueDate);
  if (params.isOverdue) {
    return [
      `🏏 *SCA CRICKET ACADEMY*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⚠️ *OVERDUE FEE NOTICE*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Dear Parent / Guardian,`,
      ``,
      `This is an urgent reminder that the cricket coaching fee for *${params.studentName}* (${params.batch}) is *OVERDUE*.`,
      ``,
      `📋 *Fee Summary:*`,
      `• *Student Name:* ${params.studentName}`,
      `• *Batch:* ${params.batch}`,
      `• *Original Due Date:* ${prettyDueDate}`,
      `• *Pending Dues:* ₹${Number(params.amount).toLocaleString('en-IN')}`,
      ``,
      `💳 *UPI Payment Details:*`,
      `• *UPI ID:* ${params.upiId}`,
      `• *UPI Number (GPay / PhonePe / Paytm):* 6380449589`,
      `• *Payee:* SCA Cricket Academy`,
      ``,
      `Please clear the outstanding dues today via UPI to *${params.upiId}* (or UPI Number *6380449589*) or in cash at the academy office.`,
      ``,
      `📞 *Academy Helpline:* +91 63804 49589`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `_SCA Academy Management System_ 🏏`,
    ].join('\n');
  }

  return [
    `🏏 *SCA CRICKET ACADEMY*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🔔 *MONTHLY FEE REMINDER*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Dear Parent / Guardian,`,
    ``,
    `This is a gentle reminder that the monthly coaching fee for *${params.studentName}* (${params.batch}) is due on *${prettyDueDate}*.`,
    ``,
    `📋 *Fee Summary:*`,
    `• *Student Name:* ${params.studentName}`,
    `• *Batch:* ${params.batch}`,
    `• *Due Date:* ${prettyDueDate}`,
    `• *Amount Due:* ₹${Number(params.amount).toLocaleString('en-IN')}`,
    ``,
    `💳 *UPI Payment Details:*`,
    `• *UPI ID:* ${params.upiId}`,
    `• *UPI Number (GPay / PhonePe / Paytm):* 6380449589`,
    `• *Payee:* SCA Cricket Academy`,
    ``,
    `Please settle via UPI to *${params.upiId}* (or UPI Number *6380449589*) or at the academy counter. Thank you!`,
    ``,
    `📞 *Academy Helpline:* +91 63804 49589`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_SCA Academy Management System_ 🏏`,
  ].join('\n');
}

export const DEFAULT_WELCOME_TEMPLATE = [
  `🏏 *SCA CRICKET ACADEMY*`,
  `━━━━━━━━━━━━━━━━━━━━━━`,
  `🎉 *OFFICIAL WELCOME INVITATION*`,
  `━━━━━━━━━━━━━━━━━━━━━━`,
  ``,
  `Dear {Student Name},`,
  ``,
  `Congratulations! 🏏`,
  ``,
  `You have successfully joined *School of Cricket Academy (SCA)*, Gummudipoondi!`,
  `We are delighted to welcome you to our cricket family. ❤️`,
  ``,
  `To stay connected and receive important announcements, practice schedules, session updates, and academy activities, kindly join both our official WhatsApp groups:`,
  ``,
  `👥 *1. SCA Family Group:*`,
  `{CA_FAMILY_GROUP_LINK}`,
  ``,
  `🏏 *2. Session Updates Group:*`,
  `{SESSION_UPDATES_GROUP_LINK}`,
  ``,
  `━━━━━━━━━━━━━━━━━━━━━━`,
  `📲 *FOLLOW US ON SOCIAL MEDIA*`,
  `━━━━━━━━━━━━━━━━━━━━━━`,
  ``,
  `📸 *Instagram – Follow Us:*`,
  `{INSTAGRAM_LINK}`,
  ``,
  `▶️ *YouTube – Subscribe to Our Channel:*`,
  `{YOUTUBE_LINK}`,
  ``,
  `━━━━━━━━━━━━━━━━━━━━━━`,
  ``,
  `Kindly join both WhatsApp groups and follow our Instagram and YouTube channels to stay updated with all SCA Cricket Academy activities.`,
  ``,
  `Thank you for choosing us!`,
  ``,
  `*Let's Learn, Play & Grow Together!* 🏏🔥`,
  ``,
  `Best Regards,`,
  `*SCA CRICKET ACADEMY MANAGEMENT TEAM*`,
  `━━━━━━━━━━━━━━━━━━━━━━`,
].join('\n');

export const DEFAULT_WELCOME_SETTINGS: WelcomeMessageSettings = {
  enabled: true,
  familyGroupLink: 'https://chat.whatsapp.com/LQm7dHzJDFF0yRtl8hDn2Z?s=cl&p=a&iam=2',
  updatesGroupLink: 'https://chat.whatsapp.com/CKDZgmbki9n1MAlJGUnqo2?s=cl&p=a&iam=2',
  instagramLink: 'https://www.instagram.com/sca_cricket_academy2022?psln=bXg4Zmx5c2tlOGg4',
  youtubeLink: 'https://youtube.com/@scacricketacademy?si=wq8f6xfd1EWvg_XX',
  templateText: DEFAULT_WELCOME_TEMPLATE,
  cloudApiEnabled: false,
  cloudApiPhoneNumberId: '',
  cloudApiAccessToken: '',
};

export function validateAndFormatWhatsAppPhone(rawPhone: string): { valid: boolean; formatted: string; clean: string; error?: string } {
  if (!rawPhone) return { valid: false, formatted: '', clean: '', error: 'Mobile number is required' };
  const clean = rawPhone.replace(/\D/g, '');
  if (clean.length < 10) {
    return { valid: false, formatted: '', clean, error: 'Mobile number must be at least 10 digits' };
  }
  let formatted = clean;
  if (clean.length === 10) {
    formatted = `91${clean}`;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    formatted = `91${clean.slice(1)}`;
  } else if (clean.length === 12 && clean.startsWith('91')) {
    formatted = clean;
  }
  return { valid: true, formatted, clean };
}

export function buildWelcomeMessage(studentName: string, settings: WelcomeMessageSettings): string {
  const tpl = settings.templateText || DEFAULT_WELCOME_TEMPLATE;
  return tpl
    .replace(/{Student Name}/g, studentName)
    .replace(/{CA_FAMILY_GROUP_LINK}/g, settings.familyGroupLink)
    .replace(/{SESSION_UPDATES_GROUP_LINK}/g, settings.updatesGroupLink)
    .replace(/{INSTAGRAM_LINK}/g, settings.instagramLink)
    .replace(/{YOUTUBE_LINK}/g, settings.youtubeLink);
}

// Default Seed Data for SCA Cricket Academy
function getInitialSeedData(): DatabaseSchema {
  const users: User[] = [
    {
      id: 'USR-001',
      email: 'admin@scacricket.com',
      name: 'Academy Administrator',
      username: 'admin',
      role: 'admin',
      phone: '+91 63804 49589',
      assignedBatches: ['Evening Batch'],
    },
    {
      id: 'USR-002',
      email: 'coach.jagadeesh@scacricket.com',
      name: 'Coach Jagadeesh',
      username: 'jagadeesh',
      role: 'coach',
      coachNumber: 1,
      phone: '+91 98401 23456',
      assignedBatches: ['Evening Batch'],
    },
    {
      id: 'USR-003',
      email: 'coach.baskar@scacricket.com',
      name: 'Coach Baskar',
      username: 'baskar',
      role: 'coach',
      coachNumber: 2,
      phone: '+91 98402 34567',
      assignedBatches: ['Evening Batch'],
    },
    {
      id: 'USR-004',
      email: 'coach.vijay@scacricket.com',
      name: 'Coach Vijay',
      username: 'vijay',
      role: 'coach',
      coachNumber: 3,
      phone: '+91 98403 45678',
      assignedBatches: ['Evening Batch'],
    },
    {
      id: 'USR-005',
      email: 'coach.gokul@scacricket.com',
      name: 'Coach Gokul',
      username: 'gokul',
      role: 'coach',
      coachNumber: 4,
      phone: '+91 98404 56789',
      assignedBatches: ['Evening Batch'],
    },
  ];

  const batches: Batch[] = [
    {
      id: 'BATCH-01',
      name: 'Evening Batch',
      timing: '04:30 PM - 07:00 PM',
      days: 'Mon - Sat',
      assignedCoach: 'Coach Jagadeesh & Coaching Staff',
      coachId: 'USR-002',
      capacity: 50,
    },
  ];

  const students: Student[] = [];
  const fees: FeeRecord[] = [];
  const attendance: AttendanceRecord[] = [];

  const sheetsConfig: SheetsSyncConfig = {
    spreadsheetId: '1SCA_Cricket_Official_Master_2026',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1SCA_Cricket_Official_Master_2026/edit',
    lastSyncTime: '2026-10-29T04:30:00Z',
    syncStatus: 'success',
    autoSyncOnSave: true,
    syncLogs: [
      {
        id: 'LOG-001',
        timestamp: '2026-10-29T04:30:00Z',
        action: 'Daily Scheduled Sync',
        recordsCount: 42,
        status: 'success',
        details: 'Successfully synced 16 students, 16 fee rows, and 10 attendance records with Google Sheets tab [SCA_Master_Data].',
      },
      {
        id: 'LOG-002',
        timestamp: '2026-10-28T18:00:00Z',
        action: 'Attendance Batch Push',
        recordsCount: 8,
        status: 'success',
        details: 'Batch Morning U-14 attendance synced successfully.',
      },
    ],
  };

  const notificationSettings: NotificationSettings = {
    autoFeeRemindersEnabled: true,
    upcomingDaysBefore: 3,
    overdueFrequencyDays: 3,
    upiId: 'vijaykumarmm30@okicici',
    upiNumber: '6380449589',
    helplinePhone: '+91 63804 49589',
    templateUpcoming: 'Dear Parent, fee reminder of ₹{amount} for {student_name} ({batch}) is due on {due_date}. Please pay via UPI to {upi_id} (UPI Number: 6380449589). Helpline: +91 63804 49589.',
    templateOverdue: 'URGENT: Fee payment of ₹{amount} for {student_name} ({batch}) is overdue. Please settle today via UPI ({upi_id} / 6380449589) or cash at academy. Helpline: +91 63804 49589.',
    lastAutomatedRun: '2026-10-29T04:30:00Z',
  };

  const notifications: NotificationItem[] = [];
  const welcomeSettings: WelcomeMessageSettings = { ...DEFAULT_WELCOME_SETTINGS };
  const welcomeLogs: WelcomeMessageLog[] = [];

  return {
    users,
    batches,
    students,
    attendance,
    fees,
    sheetsConfig,
    notifications,
    notificationSettings,
    welcomeSettings,
    welcomeLogs,
  };
}

// Persistent File Storage Manager
class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const seed = getInitialSeedData();

        // Ensure the 4 coaches (Jagadeesh, Baskar, Vijay, Gokul) and updated batches are always loaded
        const hasJagadeesh = Array.isArray(parsed.users) && parsed.users.some((u: User) => u.username === 'jagadeesh');
        if (!hasJagadeesh || !parsed.users || parsed.users.length < 5) {
          parsed.users = seed.users;
          parsed.batches = seed.batches;
        }

        if (!parsed.notifications) parsed.notifications = seed.notifications;
        if (!parsed.notificationSettings) parsed.notificationSettings = seed.notificationSettings;
        if (!parsed.welcomeSettings) parsed.welcomeSettings = seed.welcomeSettings;
        if (!parsed.welcomeLogs) parsed.welcomeLogs = seed.welcomeLogs || [];

        if (Array.isArray(parsed.students)) {
          parsed.students = parsed.students.map((s: Student) => ({
            ...s,
            welcomeMessageStatus: s.welcomeMessageStatus || 'pending',
            notificationPreferences: s.notificationPreferences || {
              pushEnabled: true,
              whatsappEnabled: true,
              overdueAlerts: true,
              upcomingDueDateAlerts: true,
              attendanceAlerts: true,
            },
          }));
        }
        this.saveData(parsed);
        return parsed;
      }
    } catch (err) {
      console.error('Error reading database file, resetting to seed data:', err);
    }
    const seed = getInitialSeedData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Users / RBAC & Authentication ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  authenticate(nameOrUsername: string, pass: string): { success: boolean; user?: User; message?: string } {
    const rawQuery = (nameOrUsername || '').trim();
    const query = rawQuery.toLowerCase().replace(/^coach\s+/i, '');
    const cleanPass = (pass || '').trim();

    if (!query) {
      return { success: false, message: 'Please enter coach name or username' };
    }

    // Match by username (jagadeesh, baskar, vijay, gokul, admin) or name (Coach Jagadeesh, Jagadeesh)
    const user = this.data.users.find((u) => {
      const uUsername = (u.username || '').toLowerCase();
      const uName = u.name.toLowerCase().replace(/^coach\s+/i, '');
      const full = u.name.toLowerCase();
      return uUsername === query || uName === query || full.includes(query);
    });

    if (!user) {
      return {
        success: false,
        message: `Coach or user "${rawQuery}" not found. Valid coaches: Jagadeesh, Baskar, Vijay, Gokul, or Admin.`,
      };
    }

    const canonical = (user.username || user.name.toLowerCase().replace(/^coach\s+/i, '')).trim().toLowerCase();
    const expectedPassword = COACH_PASSWORDS[canonical] || 'jaga@12';

    // Verify password
    let isValid = cleanPass === expectedPassword;
    if (!isValid && user.role === 'admin' && (cleanPass === 'admin@12' || cleanPass === 'sca@12')) {
      isValid = true;
    }

    if (!isValid) {
      return {
        success: false,
        message: `Incorrect password for ${user.name}. Please enter the correct password.`,
      };
    }

    return {
      success: true,
      user,
      message: `Welcome, ${user.name}! Access granted.`,
    };
  }

  // --- Batches ---
  getBatches(): Batch[] {
    return this.data.batches;
  }

  // --- Students ---
  getStudents(query?: string, batch?: string, activeOnly?: boolean): Student[] {
    let list = this.data.students;

    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.guardianPhone.includes(q) ||
          s.role.toLowerCase().includes(q)
      );
    }

    if (batch && batch !== 'all') {
      list = list.filter((s) => s.batch === batch);
    }

    if (activeOnly !== undefined) {
      list = list.filter((s) => s.active === activeOnly);
    }

    return list;
  }

  getStudentById(id: string): Student | undefined {
    return this.data.students.find((s) => s.id === id);
  }

  async addStudent(studentData: Omit<Student, 'id'>): Promise<{ student: Student; welcomeResult?: any }> {
    // Generate next ID
    const count = this.data.students.length + 1;
    const id = `SCA-${100 + count}`;
    const newStudent: Student = {
      ...studentData,
      id,
      welcomeMessageStatus: 'pending',
    };
    this.data.students.unshift(newStudent);

    // Also auto-generate current month fee ledger entry
    const currentMonth = '2026-11';
    const newFee: FeeRecord = {
      id: `FEE-${id}-${currentMonth}`,
      studentId: id,
      studentName: newStudent.name,
      batch: newStudent.batch,
      monthYear: currentMonth,
      monthlyFee: newStudent.monthlyFee,
      amountPaid: 0,
      balance: newStudent.monthlyFee,
      status: 'pending',
      dueDate: `${currentMonth}-15`,
      lastPaymentDate: null,
      payments: [],
    };
    this.data.fees.push(newFee);

    this.saveData(this.data);

    let welcomeResult = undefined;
    const settings = this.getWelcomeSettings();
    if (settings.enabled) {
      welcomeResult = await this.sendWelcomeMessage(id, true, false);
    }

    return { student: newStudent, welcomeResult };
  }

  updateStudent(id: string, updates: Partial<Student>): Student | null {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    this.data.students[idx] = {
      ...this.data.students[idx],
      ...updates,
      id, // Preserve ID
    };

    // Update names across fees and attendance
    if (updates.name || updates.batch || updates.monthlyFee) {
      this.data.fees = this.data.fees.map((f) => {
        if (f.studentId === id) {
          return {
            ...f,
            studentName: updates.name || f.studentName,
            batch: updates.batch || f.batch,
            monthlyFee: updates.monthlyFee !== undefined ? updates.monthlyFee : f.monthlyFee,
            balance:
              updates.monthlyFee !== undefined
                ? Math.max(0, updates.monthlyFee - f.amountPaid)
                : f.balance,
          };
        }
        return f;
      });
    }

    this.saveData(this.data);
    return this.data.students[idx];
  }

  deleteStudent(id: string): boolean {
    const student = this.getStudentById(id);
    if (!student) return false;
    // Mark as inactive rather than destructive purge, or remove
    student.active = false;
    this.saveData(this.data);
    return true;
  }

  // --- Attendance ---
  getAttendance(date?: string, batch?: string): AttendanceRecord[] {
    let list = this.data.attendance;
    if (date) {
      list = list.filter((a) => a.date === date);
    }
    if (batch && batch !== 'all') {
      list = list.filter((a) => a.batch === batch);
    }
    return list;
  }

  saveAttendance(
    date: string,
    batch: string,
    records: Array<{ studentId: string; status: 'present' | 'absent' | 'late' }>,
    markedBy: string
  ): {
    savedCount: number;
    isUpdate: boolean;
    absentCount: number;
    absentStudents: Array<{
      studentId: string;
      studentName: string;
      guardianPhone: string;
      whatsappLink: string;
    }>;
    lowAttendanceStudents: Array<{
      studentId: string;
      studentName: string;
      attendanceRate: number;
      guardianPhone: string;
      whatsappLink: string;
    }>;
  } {
    const timestamp = new Date().toISOString();
    let isUpdate = false;

    // Check if attendance for this date & batch already exists
    const existingForBatch = this.data.attendance.filter((a) => a.date === date && a.batch === batch);
    if (existingForBatch.length > 0) {
      isUpdate = true;
      // Remove previous records for this date/batch to avoid duplicate entries
      this.data.attendance = this.data.attendance.filter(
        (a) => !(a.date === date && a.batch === batch)
      );
    }

    const newRecords: AttendanceRecord[] = records.map((r) => {
      const student = this.getStudentById(r.studentId);
      const studentName = student ? student.name : 'Unknown Student';
      return {
        id: `ATT-${date}-${batch.replace(/\s+/g, '_')}-${r.studentId}`,
        date,
        batch,
        studentId: r.studentId,
        studentName,
        status: r.status,
        markedBy,
        timestamp,
      };
    });

    this.data.attendance.push(...newRecords);

    // 1. Identify all absent students and construct instant WhatsApp alert links
    const absentStudents: Array<{
      studentId: string;
      studentName: string;
      guardianPhone: string;
      whatsappLink: string;
    }> = [];

    const absentRecords = newRecords.filter((r) => r.status === 'absent');
    absentRecords.forEach((r) => {
      const student = this.getStudentById(r.studentId);
      if (student) {
        const cleanPhone = student.guardianPhone.replace(/\D/g, '');
        const absentMsg = buildAbsentAlertMessage({
          studentName: student.name,
          studentId: student.id,
          batch,
          date,
          markedBy,
        });
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(absentMsg)}`;

        absentStudents.push({
          studentId: student.id,
          studentName: student.name,
          guardianPhone: student.guardianPhone,
          whatsappLink: waLink,
        });

        if (!this.data.notifications) this.data.notifications = [];
        this.data.notifications.unshift({
          id: `NOTIF-ATT-ABSENT-${Date.now()}-${student.id}`,
          type: 'attendance_alert',
          title: `Absent Alert: ${student.name} (${batch})`,
          body: absentMsg,
          studentId: student.id,
          studentName: student.name,
          guardianPhone: student.guardianPhone,
          timestamp,
          read: false,
          channel: 'whatsapp',
          whatsappLink: waLink,
        });
      }
    });

    // 2. Identify low attendance students (< 75% overall session rate)
    const lowAttendanceStudents: Array<{
      studentId: string;
      studentName: string;
      attendanceRate: number;
      guardianPhone: string;
      whatsappLink: string;
    }> = [];

    const allBatchAttendance = this.data.attendance.filter((a) => a.batch === batch);
    const uniqueDates = [...new Set(allBatchAttendance.map((a) => a.date))];
    const totalSessions = uniqueDates.length;

    if (totalSessions >= 2) {
      records.forEach((r) => {
        const student = this.getStudentById(r.studentId);
        if (!student || !student.active) return;

        const studentSessions = allBatchAttendance.filter((a) => a.studentId === r.studentId);
        const presentSessions = studentSessions.filter((a) => a.status === 'present').length;
        const rate = Math.round((presentSessions / totalSessions) * 100);

        if (rate < 75) {
          const cleanPhone = student.guardianPhone.replace(/\D/g, '');
          const lowAttMsg = buildLowAttendanceMessage({
            studentName: student.name,
            studentId: student.id,
            batch,
            rate,
            presentSessions,
            totalSessions,
          });
          const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lowAttMsg)}`;

          lowAttendanceStudents.push({
            studentId: student.id,
            studentName: student.name,
            attendanceRate: rate,
            guardianPhone: student.guardianPhone,
            whatsappLink: waLink,
          });

          if (!this.data.notifications) this.data.notifications = [];
          this.data.notifications.unshift({
            id: `NOTIF-ATT-LOW-${Date.now()}-${student.id}`,
            type: 'attendance_alert',
            title: `Low Attendance Alert (${rate}%): ${student.name}`,
            body: lowAttMsg,
            studentId: student.id,
            studentName: student.name,
            guardianPhone: student.guardianPhone,
            timestamp,
            read: false,
            channel: 'whatsapp',
            whatsappLink: waLink,
          });
        }
      });
    }

    // If autoSync enabled, create a log
    if (this.data.sheetsConfig.autoSyncOnSave) {
      this.logSync(
        `Attendance Save (${batch})`,
        newRecords.length,
        'success',
        `Attendance saved for ${date} with ${newRecords.filter((r) => r.status === 'present').length} present and ${absentStudents.length} absent.`
      );
    }

    this.saveData(this.data);
    return {
      savedCount: newRecords.length,
      isUpdate,
      absentCount: absentStudents.length,
      absentStudents,
      lowAttendanceStudents,
    };
  }

  ensureMonthlyFeeLedger(monthYear: string): void {
    let changed = false;
    const activeStudents = this.data.students.filter((s) => s.active);

    for (const s of activeStudents) {
      const exists = (this.data.fees || []).some(
        (f) => f.studentId === s.id && f.monthYear === monthYear
      );
      if (!exists) {
        if (!this.data.fees) this.data.fees = [];
        this.data.fees.push({
          id: `FEE-${s.id}-${monthYear}`,
          studentId: s.id,
          studentName: s.name,
          batch: s.batch,
          monthYear,
          monthlyFee: s.monthlyFee || 2500,
          amountPaid: 0,
          balance: s.monthlyFee || 2500,
          status: 'pending',
          dueDate: `${monthYear}-15`,
          lastPaymentDate: null,
          payments: [],
        });
        changed = true;
      }
    }

    if (changed) {
      this.saveData(this.data);
    }
  }

  // --- Fees ---
  getFees(monthYear?: string, batch?: string, status?: string): FeeRecord[] {
    if (monthYear && /^\d{4}-\d{2}$/.test(monthYear)) {
      this.ensureMonthlyFeeLedger(monthYear);
    }
    let list = this.data.fees;
    if (monthYear) {
      list = list.filter((f) => f.monthYear === monthYear);
    }
    if (batch && batch !== 'all') {
      list = list.filter((f) => f.batch === batch);
    }
    if (status && status !== 'all') {
      list = list.filter((f) => f.status === status);
    }
    return list;
  }

  recordPayment(
    studentId: string,
    monthYear: string,
    payment: Omit<PaymentItem, 'paymentId' | 'date'>
  ): { feeRecord: FeeRecord; receiptNotification: NotificationItem; receiptWhatsappLink: string } | null {
    let feeRecord = this.data.fees.find(
      (f) => f.studentId === studentId && f.monthYear === monthYear
    );

    const student = this.getStudentById(studentId);
    if (!student) return null;

    if (!feeRecord) {
      // Create fee record for this month
      feeRecord = {
        id: `FEE-${studentId}-${monthYear}`,
        studentId,
        studentName: student.name,
        batch: student.batch,
        monthYear,
        monthlyFee: student.monthlyFee,
        amountPaid: 0,
        balance: student.monthlyFee,
        status: 'pending',
        dueDate: `${monthYear}-15`,
        lastPaymentDate: null,
        payments: [],
      };
      this.data.fees.push(feeRecord);
    }

    const paymentDate = new Date().toISOString().split('T')[0];
    const paymentId = `PAY-${studentId}-${Date.now()}`;
    const newPayment: PaymentItem = {
      ...payment,
      paymentId,
      date: paymentDate,
    };

    feeRecord.payments.push(newPayment);
    feeRecord.amountPaid += Number(payment.amount);
    feeRecord.balance = Math.max(0, feeRecord.monthlyFee - feeRecord.amountPaid);
    feeRecord.lastPaymentDate = paymentDate;

    if (feeRecord.balance === 0) {
      feeRecord.status = 'paid';
    } else if (feeRecord.amountPaid > 0) {
      feeRecord.status = 'partial';
    } else {
      feeRecord.status = 'pending';
    }

    // Build official digital receipt for WhatsApp
    const cleanPhone = student.guardianPhone.replace(/\D/g, '');
    const receiptBody = buildPaymentReceiptMessage({
      referenceNo: payment.referenceNo || paymentId,
      studentName: student.name,
      studentId: student.id,
      batch: feeRecord.batch,
      monthYear,
      amount: Number(payment.amount),
      mode: payment.mode,
      date: paymentDate,
      balance: feeRecord.balance,
      status: feeRecord.status,
      recordedBy: payment.recordedBy || 'Academy Admin',
    });

    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptBody)}`;

    const receiptNotification: NotificationItem = {
      id: `NOTIF-RECEIPT-${Date.now()}-${student.id}`,
      type: 'payment_receipt',
      title: `Payment Receipt: ${student.name} (₹${Number(payment.amount).toLocaleString('en-IN')})`,
      body: receiptBody,
      studentId: student.id,
      studentName: student.name,
      guardianPhone: student.guardianPhone,
      amount: Number(payment.amount),
      dueDate: feeRecord.dueDate,
      timestamp: new Date().toISOString(),
      read: false,
      channel: 'whatsapp',
      whatsappLink: waLink,
    };

    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(receiptNotification);

    this.saveData(this.data);
    return { feeRecord, receiptNotification, receiptWhatsappLink: waLink };
  }

  getPaymentReceiptWhatsapp(studentId: string, monthYear: string): { whatsappLink: string; receiptText: string } | null {
    const fee = (this.data.fees || []).find((f) => f.studentId === studentId && f.monthYear === monthYear);
    const student = this.getStudentById(studentId);
    if (!fee || !student) return null;

    const latestPayment = fee.payments && fee.payments.length > 0
      ? fee.payments[fee.payments.length - 1]
      : null;

    const amount = latestPayment ? latestPayment.amount : fee.amountPaid;
    const refNo = latestPayment?.referenceNo || `SCA-REC-${fee.id}`;
    const mode = latestPayment?.mode || 'UPI';
    const date = latestPayment?.date || fee.lastPaymentDate || new Date().toISOString().split('T')[0];

    const cleanPhone = student.guardianPhone.replace(/\D/g, '');
    const receiptBody = buildPaymentReceiptMessage({
      referenceNo: refNo,
      studentName: student.name,
      studentId: student.id,
      batch: fee.batch,
      monthYear,
      amount: Number(amount),
      mode,
      date,
      balance: fee.balance,
      status: fee.status,
      recordedBy: 'Academy Admin',
    });

    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(receiptBody)}`;
    return { whatsappLink: waLink, receiptText: receiptBody };
  }

  // --- Stats & Reports ---
  getStats(userRole: string): AcademyStats {
    const totalStudents = this.data.students.length;
    const activeStudents = this.data.students.filter((s) => s.active).length;

    const today = new Date().toISOString().split('T')[0];
    let todayAtt = this.data.attendance.filter((a) => a.date === today);
    if (todayAtt.length === 0 && this.data.attendance.length > 0) {
      const dates = [...new Set(this.data.attendance.map((a) => a.date))].sort().reverse();
      todayAtt = this.data.attendance.filter((a) => a.date === dates[0]);
    }
    const presentCount = todayAtt.filter((a) => a.status === 'present').length;
    const absentCount = todayAtt.filter((a) => a.status === 'absent').length;
    const attRate = todayAtt.length > 0 ? Math.round((presentCount / todayAtt.length) * 100) : 0;

    // Fees calculation (Admin only, mask for coach)
    const currentMonth = '2026-11';
    const currentFees = this.data.fees.filter((f) => f.monthYear === currentMonth);
    const totalExpected = currentFees.reduce((acc, f) => acc + f.monthlyFee, 0);
    const totalCollected = currentFees.reduce((acc, f) => acc + f.amountPaid, 0);
    const totalPending = currentFees.reduce((acc, f) => acc + f.balance, 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
    const unreadNotificationsCount = (this.data.notifications || []).filter((n) => !n.read).length;

    return {
      totalStudents,
      activeStudents,
      todayAttendance: {
        total: todayAtt.length,
        present: presentCount,
        absent: absentCount,
        rate: attRate,
      },
      feesThisMonth:
        userRole === 'admin'
          ? {
              totalExpected,
              totalCollected,
              totalPending,
              collectionRate,
            }
          : {
              totalExpected: 0,
              totalCollected: 0,
              totalPending: 0,
              collectionRate: 0,
            },
      batchesCount: this.data.batches.length,
      unreadNotificationsCount,
    };
  }

  // --- Notifications Engine ---
  getNotifications(unreadOnly?: boolean): NotificationItem[] {
    const list = this.data.notifications || [];
    if (unreadOnly) {
      return list.filter((n) => !n.read);
    }
    return list;
  }

  markNotificationRead(id: string): boolean {
    const notif = (this.data.notifications || []).find((n) => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.saveData(this.data);
    return true;
  }

  markAllNotificationsRead(): void {
    if (!this.data.notifications) return;
    this.data.notifications.forEach((n) => {
      n.read = true;
    });
    this.saveData(this.data);
  }

  getNotificationSettings(): NotificationSettings {
    return this.data.notificationSettings;
  }

  updateNotificationSettings(updates: Partial<NotificationSettings>): NotificationSettings {
    this.data.notificationSettings = {
      ...this.data.notificationSettings,
      ...updates,
    };
    this.saveData(this.data);
    return this.data.notificationSettings;
  }

  updateStudentNotificationPreferences(studentId: string, prefs: NotificationPreferences): boolean {
    const student = this.getStudentById(studentId);
    if (!student) return false;
    student.notificationPreferences = prefs;
    this.saveData(this.data);
    return true;
  }

  createNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem {
    const newNotif: NotificationItem = {
      ...item,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(newNotif);
    this.saveData(this.data);
    return newNotif;
  }

  sendManualFeeReminder(studentId: string, monthYear: string): NotificationItem | null {
    const fee = (this.data.fees || []).find((f) => f.studentId === studentId && f.monthYear === monthYear);
    const student = this.getStudentById(studentId);
    if (!fee || !student) return null;

    const settings = this.data.notificationSettings;
    const isOverdue = fee.status === 'overdue';

    const body = buildFeeReminderMessage({
      isOverdue,
      studentName: student.name,
      batch: student.batch,
      amount: fee.balance,
      dueDate: fee.dueDate,
      upiId: settings.upiId,
    });

    const phoneClean = student.guardianPhone.replace(/\D/g, '');
    const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(body)}`;

    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}-${student.id}`,
      type: isOverdue ? 'fee_overdue' : 'fee_upcoming',
      title: `${isOverdue ? 'Overdue Notice' : 'Fee Reminder'}: ${student.name} (₹${fee.balance.toLocaleString('en-IN')})`,
      body,
      studentId: student.id,
      studentName: student.name,
      guardianPhone: student.guardianPhone,
      amount: fee.balance,
      dueDate: fee.dueDate,
      timestamp: new Date().toISOString(),
      read: false,
      channel: 'whatsapp',
      whatsappLink: waLink,
    };

    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(notif);
    this.saveData(this.data);
    return notif;
  }

  runAutomatedFeeReminders(): { processed: number; sent: number; notifications: NotificationItem[] } {
    const settings = this.data.notificationSettings;
    if (!settings.autoFeeRemindersEnabled) {
      return { processed: 0, sent: 0, notifications: [] };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);
    const newNotifications: NotificationItem[] = [];

    const currentMonth = '2026-11';
    const pendingOrOverdueFees = (this.data.fees || []).filter(
      (f) => f.monthYear === currentMonth && f.balance > 0
    );

    for (const fee of pendingOrOverdueFees) {
      const student = this.getStudentById(fee.studentId);
      if (!student || !student.active) continue;

      const prefs = student.notificationPreferences || {
        pushEnabled: true,
        whatsappEnabled: true,
        overdueAlerts: true,
        upcomingDueDateAlerts: true,
        attendanceAlerts: true,
      };

      if (!prefs.pushEnabled && !prefs.whatsappEnabled) continue;

      const dueDateObj = new Date(fee.dueDate);
      const diffTime = dueDateObj.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // < 0 overdue, >= 0 upcoming

      // Check if already notified today
      const alreadyNotifiedToday = (this.data.notifications || []).some(
        (n) => n.studentId === student.id && n.timestamp.startsWith(todayStr)
      );
      if (alreadyNotifiedToday) continue;

      if (diffDays < 0 && prefs.overdueAlerts) {
        const title = `Overdue Fee Notice: ${student.name} (₹${fee.balance.toLocaleString('en-IN')})`;
        const body = buildFeeReminderMessage({
          isOverdue: true,
          studentName: student.name,
          batch: student.batch,
          amount: fee.balance,
          dueDate: fee.dueDate,
          upiId: settings.upiId,
        });

        const phoneClean = student.guardianPhone.replace(/\D/g, '');
        const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(body)}`;

        const notif: NotificationItem = {
          id: `NOTIF-${Date.now()}-${student.id}`,
          type: 'fee_overdue',
          title,
          body,
          studentId: student.id,
          studentName: student.name,
          guardianPhone: student.guardianPhone,
          amount: fee.balance,
          dueDate: fee.dueDate,
          timestamp: new Date().toISOString(),
          read: false,
          channel: 'push',
          whatsappLink: waLink,
        };

        if (!this.data.notifications) this.data.notifications = [];
        this.data.notifications.unshift(notif);
        newNotifications.push(notif);
      } else if (diffDays >= 0 && diffDays <= settings.upcomingDaysBefore && prefs.upcomingDueDateAlerts) {
        const title = `Upcoming Fee Reminder: ${student.name} (₹${fee.balance.toLocaleString('en-IN')})`;
        const body = buildFeeReminderMessage({
          isOverdue: false,
          studentName: student.name,
          batch: student.batch,
          amount: fee.balance,
          dueDate: fee.dueDate,
          upiId: settings.upiId,
        });

        const phoneClean = student.guardianPhone.replace(/\D/g, '');
        const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(body)}`;

        const notif: NotificationItem = {
          id: `NOTIF-${Date.now()}-${student.id}`,
          type: 'fee_upcoming',
          title,
          body,
          studentId: student.id,
          studentName: student.name,
          guardianPhone: student.guardianPhone,
          amount: fee.balance,
          dueDate: fee.dueDate,
          timestamp: new Date().toISOString(),
          read: false,
          channel: 'push',
          whatsappLink: waLink,
        };

        if (!this.data.notifications) this.data.notifications = [];
        this.data.notifications.unshift(notif);
        newNotifications.push(notif);
      }
    }

    this.data.notificationSettings.lastAutomatedRun = new Date().toISOString();
    this.saveData(this.data);

    return {
      processed: pendingOrOverdueFees.length,
      sent: newNotifications.length,
      notifications: newNotifications,
    };
  }

  // --- Google Sheets Sync ---
  getSheetsConfig(): SheetsSyncConfig {
    return this.data.sheetsConfig;
  }

  updateSheetsConfig(updates: Partial<SheetsSyncConfig>): SheetsSyncConfig {
    this.data.sheetsConfig = {
      ...this.data.sheetsConfig,
      ...updates,
    };
    this.saveData(this.data);
    return this.data.sheetsConfig;
  }

  logSync(action: string, recordsCount: number, status: 'success' | 'error', details: string): void {
    const log: SheetsSyncConfig['syncLogs'][0] = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      recordsCount,
      status,
      details,
    };
    this.data.sheetsConfig.syncLogs.unshift(log);
    // Keep max 20 logs
    if (this.data.sheetsConfig.syncLogs.length > 20) {
      this.data.sheetsConfig.syncLogs.pop();
    }
    this.data.sheetsConfig.lastSyncTime = log.timestamp;
    this.data.sheetsConfig.syncStatus = status === 'success' ? 'success' : 'failed';
    this.saveData(this.data);
  }

  // --- CSV / Excel Export with UTF-8 BOM ---
  exportCSV(type: 'students' | 'attendance' | 'fees', month?: string): string {
    const BOM = '\uFEFF'; // UTF-8 BOM for Microsoft Excel compatibility
    if (type === 'students') {
      const header = 'Student ID,Name,Age Group,Batch,Role,Phone,Guardian Name,Guardian Phone,Emergency Phone,Monthly Fee (INR),Status,Joined Date,Blood Group\n';
      const rows = this.data.students
        .map(
          (s) =>
            `"${s.id}","${s.name}","${s.ageGroup}","${s.batch}","${s.role}","${s.phone}","${s.guardianName}","${s.guardianPhone}","${s.emergencyPhone}",${s.monthlyFee},"${s.active ? 'Active' : 'Inactive'}","${s.joinedDate}","${s.bloodGroup}"`
        )
        .join('\n');
      return BOM + header + rows;
    }

    if (type === 'attendance') {
      const header = 'Record ID,Date,Day,Batch,Student ID,Student Name,Status,Marked By,Timestamp\n';
      let attList = this.data.attendance || [];
      if (month) {
        attList = attList.filter((a) => a.date.startsWith(month));
      }
      // Sort chronologically by date then name so it naturally flows Day 1 to Day 31
      attList = [...attList].sort((a, b) => a.date.localeCompare(b.date) || a.studentName.localeCompare(b.studentName));

      const rows = attList
        .map((a) => {
          const dayNum = a.date.split('-')[2] ? `Day ${parseInt(a.date.split('-')[2], 10)}` : 'Day 1';
          return `"${a.id}","${a.date}","${dayNum}","${a.batch}","${a.studentId}","${a.studentName}","${a.status.toUpperCase()}","${a.markedBy}","${a.timestamp}"`;
        })
        .join('\n');
      return BOM + header + rows;
    }

    if (type === 'fees') {
      const header = 'Ledger ID,Student ID,Student Name,Batch,Month,Monthly Fee (INR),Amount Paid (INR),Balance Due (INR),Status,Due Date,Last Payment Date\n';
      if (month) {
        this.ensureMonthlyFeeLedger(month);
      }
      let feeList = this.data.fees || [];
      if (month) {
        feeList = feeList.filter((f) => f.monthYear === month);
      }
      const rows = feeList
        .map(
          (f) =>
            `"${f.id}","${f.studentId}","${f.studentName}","${f.batch}","${f.monthYear}",${f.monthlyFee},${f.amountPaid},${f.balance},"${f.status.toUpperCase()}","${f.dueDate}","${f.lastPaymentDate || 'Pending'}"`
        )
        .join('\n');
      return BOM + header + rows;
    }

    return '';
  }

  // --- Welcome & Social Media Invitation System ---
  getWelcomeSettings(): WelcomeMessageSettings {
    if (!this.data.welcomeSettings) {
      this.data.welcomeSettings = { ...DEFAULT_WELCOME_SETTINGS };
    }
    return this.data.welcomeSettings;
  }

  updateWelcomeSettings(updates: Partial<WelcomeMessageSettings>): WelcomeMessageSettings {
    const current = this.getWelcomeSettings();
    this.data.welcomeSettings = {
      ...current,
      ...updates,
    };
    this.saveData(this.data);
    return this.data.welcomeSettings;
  }

  getWelcomeLogs(): WelcomeMessageLog[] {
    return this.data.welcomeLogs || [];
  }

  async sendWelcomeMessage(
    studentId: string,
    isNewRegistration: boolean = false,
    forceRetry: boolean = false
  ): Promise<{
    success: boolean;
    status: 'sent' | 'pending' | 'failed';
    whatsappLink: string;
    messageText: string;
    errorMessage?: string;
    log?: WelcomeMessageLog;
  }> {
    const student = this.getStudentById(studentId);
    if (!student) {
      return {
        success: false,
        status: 'failed',
        whatsappLink: '',
        messageText: '',
        errorMessage: 'Student not found in academy database',
      };
    }

    const settings = this.getWelcomeSettings();
    const phoneToUse = student.guardianPhone || student.phone;
    const phoneValidation = validateAndFormatWhatsAppPhone(phoneToUse);

    const messageText = buildWelcomeMessage(student.name, settings);
    const cleanPhone = phoneValidation.clean;
    const formattedPhone = phoneValidation.formatted;
    const whatsappLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;

    // Deduplication check: if not forcing retry and already sent, return existing
    if (!forceRetry && !isNewRegistration && student.welcomeMessageStatus === 'sent') {
      return {
        success: true,
        status: 'sent',
        whatsappLink,
        messageText,
      };
    }

    if (!phoneValidation.valid) {
      const failedLog: WelcomeMessageLog = {
        id: `WELCOME-ERR-${Date.now()}-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        phone: phoneToUse,
        timestamp: new Date().toISOString(),
        status: 'failed',
        channel: 'whatsapp_link',
        whatsappLink: '',
        content: messageText,
        errorMessage: phoneValidation.error || 'Invalid mobile number',
        retryCount: 0,
      };
      if (!this.data.welcomeLogs) this.data.welcomeLogs = [];
      this.data.welcomeLogs.unshift(failedLog);
      student.welcomeMessageStatus = 'failed';
      this.saveData(this.data);
      return {
        success: false,
        status: 'failed',
        whatsappLink: '',
        messageText,
        errorMessage: phoneValidation.error,
        log: failedLog,
      };
    }

    let status: 'sent' | 'pending' | 'failed' = 'sent';
    let channel: 'cloud_api' | 'whatsapp_link' = 'whatsapp_link';
    let errorMessage: string | undefined;

    // Check if Meta WhatsApp Business Cloud API is enabled and configured
    if (settings.cloudApiEnabled && settings.cloudApiPhoneNumberId && settings.cloudApiAccessToken) {
      channel = 'cloud_api';
      try {
        const response = await fetch(
          `https://graph.facebook.com/v19.0/${settings.cloudApiPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${settings.cloudApiAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: formattedPhone,
              type: 'text',
              text: {
                preview_url: true,
                body: messageText,
              },
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          status = 'failed';
          errorMessage =
            (errData as any)?.error?.message ||
            `WhatsApp Cloud API responded with status ${response.status}`;
        } else {
          status = 'sent';
        }
      } catch (err: any) {
        status = 'failed';
        errorMessage = err.message || 'Network error connecting to WhatsApp Cloud API';
      }
    } else {
      // Direct WhatsApp link dispatch mode
      status = 'sent';
      channel = 'whatsapp_link';
    }

    const eventId = isNewRegistration
      ? `WELCOME-REG-${student.id}-${Date.now()}`
      : `WELCOME-RETRY-${student.id}-${Date.now()}`;

    const newLog: WelcomeMessageLog = {
      id: eventId,
      studentId: student.id,
      studentName: student.name,
      phone: student.guardianPhone || student.phone,
      timestamp: new Date().toISOString(),
      status,
      channel,
      whatsappLink,
      content: messageText,
      errorMessage,
      retryCount: forceRetry ? 1 : 0,
    };

    if (!this.data.welcomeLogs) this.data.welcomeLogs = [];
    this.data.welcomeLogs.unshift(newLog);

    student.welcomeMessageStatus = status;
    student.welcomeSentAt = new Date().toISOString();
    student.welcomeEventId = eventId;

    // Create notification item in Notification Center
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift({
      id: `NOTIF-WELCOME-${Date.now()}-${student.id}`,
      type: 'welcome_message',
      title: `Welcome WhatsApp: ${student.name}`,
      body: messageText,
      studentId: student.id,
      studentName: student.name,
      guardianPhone: student.guardianPhone || student.phone,
      timestamp: new Date().toISOString(),
      read: false,
      channel: 'whatsapp',
      whatsappLink,
    });

    this.saveData(this.data);

    return {
      success: status === 'sent',
      status,
      whatsappLink,
      messageText,
      errorMessage,
      log: newLog,
    };
  }

  // --- Full Backup & Restore ---
  getBackup(): DatabaseSchema {
    return this.data;
  }

  restoreBackup(backupData: DatabaseSchema): boolean {
    if (!backupData || !backupData.students || !backupData.batches) {
      return false;
    }
    this.data = backupData;
    this.saveData(this.data);
    return true;
  }

  // --- Google Drive Backup System ---
  getGoogleDriveConfig(): GoogleDriveConfig {
    if (!this.data.googleDriveConfig) {
      const now = new Date();
      const nextMonthYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
      const nextMonth = (now.getMonth() + 1) % 12;
      const nextDate = new Date(nextMonthYear, nextMonth, 1, 0, 0, 0, 0);

      this.data.googleDriveConfig = {
        email: 'scacricketacademy0@gmail.com',
        connected: false,
        autoMonthlyBackupEnabled: true,
        backupDayOfMonth: 1,
        backupHourOfDay: 0,
        lastBackupDate: null,
        lastBackupFileName: null,
        lastBackupFileSize: null,
        lastBackupStatus: 'idle',
        lastBackupError: null,
        nextScheduledBackup: nextDate.toISOString(),
        mode: 'oauth',
      };
      this.saveData(this.data);
    }
    return this.data.googleDriveConfig;
  }

  updateGoogleDriveConfig(updates: Partial<GoogleDriveConfig>): GoogleDriveConfig {
    const current = this.getGoogleDriveConfig();
    this.data.googleDriveConfig = {
      ...current,
      ...updates,
    };
    this.saveData(this.data);
    return this.data.googleDriveConfig;
  }

  getBackupLogs(): GoogleDriveBackupLog[] {
    return this.data.backupLogs || [];
  }

  addBackupLog(log: GoogleDriveBackupLog): void {
    if (!this.data.backupLogs) this.data.backupLogs = [];
    this.data.backupLogs.unshift(log);
    // Keep max 50 logs
    if (this.data.backupLogs.length > 50) {
      this.data.backupLogs.pop();
    }
    this.saveData(this.data);
  }
}

export const db = new Database();
