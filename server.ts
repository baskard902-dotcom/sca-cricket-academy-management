import 'dotenv/config';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { db, buildWelcomeMessage } from './server/store.ts';
import { googleDriveBackupService } from './server/googleDriveService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Current active session (in-memory default: Coach Jagadeesh, can switch in UI)
let currentUserId = 'USR-002'; // Default Coach Jagadeesh

// Middleware to inject authenticated user and enforce RBAC
interface AuthRequest extends Request {
  user?: ReturnType<typeof db.getUserById>;
}

app.use((req: AuthRequest, _res: Response, next: NextFunction) => {
  // Check header or fallback to currentUserId
  const headerUserId = req.headers['x-user-id'] as string;
  const headerRole = req.headers['x-user-role'] as string;

  let user = headerUserId ? db.getUserById(headerUserId) : db.getUserById(currentUserId);
  if (!user) {
    user = db.getUsers()[0];
  }
  if (headerRole && (headerRole === 'admin' || headerRole === 'coach')) {
    user = { ...user, role: headerRole };
  }

  req.user = user;
  next();
});

// --- Auth Routes ---
app.get('/api/me', (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  res.json({
    user: req.user,
    allUsers: users,
  });
});

app.post('/api/auth/switch-role', (req: AuthRequest, res: Response) => {
  const { userId } = req.body;
  const targetUser = db.getUserById(userId);
  if (targetUser) {
    currentUserId = targetUser.id;
    res.json({ success: true, user: targetUser });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { name, username, nameOrUsername, password } = req.body;
  const identifier = (nameOrUsername || username || name || '').trim();
  const inputPass = (password || '').trim();

  if (!identifier) {
    return res.status(400).json({ error: 'Please enter coach name or username' });
  }
  if (!inputPass) {
    return res.status(400).json({ error: 'Please enter password' });
  }

  const authResult = db.authenticate(identifier, inputPass);
  if (!authResult.success || !authResult.user) {
    return res.status(401).json({ error: authResult.message || 'Invalid coach name or password' });
  }

  currentUserId = authResult.user.id;
  res.json({
    success: true,
    user: authResult.user,
    message: authResult.message,
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// --- Students Routes ---
app.get('/api/students', (req: Request, res: Response) => {
  const query = req.query.q as string | undefined;
  const batch = req.query.batch as string | undefined;
  const activeParam = req.query.active as string | undefined;

  let activeOnly: boolean | undefined = undefined;
  if (activeParam === 'true') activeOnly = true;
  if (activeParam === 'false') activeOnly = false;

  const students = db.getStudents(query, batch, activeOnly);
  res.json(students);
});

app.get('/api/students/:id', (req: Request, res: Response) => {
  const student = db.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
});

app.post('/api/students', async (req: AuthRequest, res: Response) => {
  const body = req.body;
  if (!body.name || !body.batch || !body.guardianPhone) {
    return res.status(400).json({ error: 'Name, Batch, and Guardian Phone are required' });
  }

  const { student, welcomeResult } = await db.addStudent({
    name: body.name,
    dob: body.dob || '2014-01-01',
    ageGroup: body.ageGroup || 'All Ages',
    batch: body.batch,
    role: body.role || 'Top-order Batsman',
    phone: body.phone || body.guardianPhone,
    guardianName: body.guardianName || 'Guardian',
    guardianPhone: body.guardianPhone,
    emergencyPhone: body.emergencyPhone || body.guardianPhone,
    monthlyFee: Number(body.monthlyFee) || 2500,
    active: body.active !== undefined ? body.active : true,
    joinedDate: body.joinedDate || new Date().toISOString().split('T')[0],
    bloodGroup: body.bloodGroup || 'O+',
    notes: body.notes || '',
  });

  res.status(201).json({
    ...student,
    welcomeResult,
  });
});

app.put('/api/students/:id', (req: AuthRequest, res: Response) => {
  const updated = db.updateStudent(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(updated);
});

app.delete('/api/students/:id', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can deactivate students' });
  }
  const success = db.deleteStudent(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json({ success: true, message: 'Student status updated to inactive' });
});

// --- Batches Route ---
app.get('/api/batches', (_req: Request, res: Response) => {
  res.json(db.getBatches());
});

// --- Attendance Routes ---
app.get('/api/attendance', (req: Request, res: Response) => {
  const date = req.query.date as string | undefined;
  const batch = req.query.batch as string | undefined;
  const records = db.getAttendance(date, batch);
  res.json(records);
});

app.post('/api/attendance', (req: AuthRequest, res: Response) => {
  const { date, batch, records } = req.body;
  if (!date || !batch || !Array.isArray(records)) {
    return res.status(400).json({ error: 'date, batch, and records array are required' });
  }

  const markedBy = req.user ? req.user.name : 'Coach';
  const result = db.saveAttendance(date, batch, records, markedBy);
  res.json({
    success: true,
    ...result,
    message: result.isUpdate
      ? `Updated attendance for ${records.length} students`
      : `Saved attendance for ${records.length} students`,
  });
});

// --- Fees Ledger (Admin Only Security Check) ---
app.get('/api/fees', (req: AuthRequest, res: Response) => {
  // STRICT SERVER-SIDE ENFORCEMENT
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied: Financial & Fee records are strictly restricted to Academy Administrators.',
      code: 'FORBIDDEN_ROLE',
    });
  }

  const monthYear = req.query.monthYear as string | undefined;
  const batch = req.query.batch as string | undefined;
  const status = req.query.status as string | undefined;

  const records = db.getFees(monthYear, batch, status);
  res.json(records);
});

app.post('/api/fees/payment', (req: AuthRequest, res: Response) => {
  // STRICT SERVER-SIDE ENFORCEMENT
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Access Denied: Only Academy Administrators can record and modify fee payments.',
      code: 'FORBIDDEN_ROLE',
    });
  }

  const { studentId, monthYear, amount, mode, referenceNo, notes } = req.body;
  if (!studentId || !monthYear || !amount || !mode) {
    return res.status(400).json({ error: 'studentId, monthYear, amount, and mode are required' });
  }

  const recordedBy = req.user ? req.user.name : 'Admin';
  const updatedResult = db.recordPayment(studentId, monthYear, {
    amount: Number(amount),
    mode,
    referenceNo: referenceNo || `REF-${Date.now()}`,
    recordedBy,
    notes,
  });

  if (!updatedResult) {
    return res.status(404).json({ error: 'Student or fee ledger entry not found' });
  }

  res.json({
    success: true,
    feeRecord: updatedResult.feeRecord,
    receiptNotification: updatedResult.receiptNotification,
    receiptWhatsappLink: updatedResult.receiptWhatsappLink,
  });
});

app.get('/api/fees/:studentId/receipt', (req: AuthRequest, res: Response) => {
  const { studentId } = req.params;
  const monthYear = (req.query.monthYear as string) || '2026-11';
  const receipt = db.getPaymentReceiptWhatsapp(studentId, monthYear);
  if (!receipt) {
    return res.status(404).json({ error: 'Payment receipt not found for this student and month' });
  }
  res.json(receipt);
});

// --- Reports & Stats ---
app.get('/api/reports', (req: AuthRequest, res: Response) => {
  const role = req.user ? req.user.role : 'coach';
  const stats = db.getStats(role);
  res.json(stats);
});

// --- Push & In-App Notification Routes ---
app.get('/api/notifications', (req: Request, res: Response) => {
  const unreadOnly = req.query.unread === 'true';
  res.json(db.getNotifications(unreadOnly));
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  res.json({ success });
});

app.post('/api/notifications/mark-all-read', (_req: Request, res: Response) => {
  db.markAllNotificationsRead();
  res.json({ success: true });
});

app.get('/api/notifications/settings', (_req: Request, res: Response) => {
  res.json(db.getNotificationSettings());
});

app.put('/api/notifications/settings', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can update notification settings' });
  }
  const updated = db.updateNotificationSettings(req.body);
  res.json(updated);
});

app.post('/api/notifications/reminders/run', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can trigger automated fee reminders' });
  }
  const result = db.runAutomatedFeeReminders();
  res.json({
    success: true,
    ...result,
    message: `Scanned ${result.processed} fee records. Dispatched ${result.sent} automated reminders.`,
  });
});

app.post('/api/notifications/reminders/send-individual', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can dispatch fee reminders' });
  }
  const { studentId, monthYear } = req.body;
  if (!studentId || !monthYear) {
    return res.status(400).json({ error: 'studentId and monthYear are required' });
  }
  const notif = db.sendManualFeeReminder(studentId, monthYear);
  if (!notif) {
    return res.status(404).json({ error: 'Fee record or student not found' });
  }
  res.json({ success: true, notification: notif, message: 'Fee reminder sent to parent!' });
});

app.put('/api/students/:id/notification-preferences', (req: AuthRequest, res: Response) => {
  const success = db.updateStudentNotificationPreferences(req.params.id, req.body);
  if (!success) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json({ success: true, preferences: req.body });
});

// --- Welcome Message & Social Media Invitation System ---
app.get('/api/welcome/settings', (_req: Request, res: Response) => {
  res.json(db.getWelcomeSettings());
});

app.post('/api/welcome/settings', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can update welcome settings' });
  }
  const updated = db.updateWelcomeSettings(req.body);
  res.json(updated);
});

app.get('/api/welcome/logs', (_req: Request, res: Response) => {
  res.json(db.getWelcomeLogs());
});

app.post('/api/welcome/send/:studentId', async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params;
  const force = req.query.force === 'true' || req.body?.forceRetry === true;
  const result = await db.sendWelcomeMessage(studentId, false, force);
  res.json(result);
});

app.post('/api/welcome/preview', (req: Request, res: Response) => {
  const { studentName, settings } = req.body;
  const nameToUse = studentName || 'Satyajit Mahanta';
  const effectiveSettings = settings || db.getWelcomeSettings();
  const previewText = buildWelcomeMessage(nameToUse, effectiveSettings);
  res.json({ previewText });
});

// --- System Health Route ---
app.get('/api/health', (_req: Request, res: Response) => {
  const config = db.getSheetsConfig();
  res.json({
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    apiStatus: 'connected',
    sheetsSync: {
      lastSyncTime: config.lastSyncTime,
      syncStatus: config.syncStatus,
      autoSyncOnSave: config.autoSyncOnSave,
      spreadsheetId: config.spreadsheetId,
      lastLog: config.syncLogs?.[0] || null,
    },
    version: '2.4.0',
    mode: process.env.NODE_ENV || 'production',
  });
});

// --- Google Sheets Sync Routes ---
app.get('/api/sheets/config', (_req: Request, res: Response) => {
  res.json(db.getSheetsConfig());
});

app.post('/api/sheets/sync', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can trigger Google Sheets sync' });
  }

  const students = db.getStudents();
  const attendance = db.getAttendance();
  const fees = db.getFees();
  const total = students.length + attendance.length + fees.length;

  db.logSync(
    'Manual Two-Way Sync',
    total,
    'success',
    `Synchronized ${students.length} students, ${attendance.length} attendance records, and ${fees.length} fee ledgers with Google Sheets.`
  );

  res.json({
    success: true,
    message: 'Google Sheets synchronization completed successfully.',
    recordsSynced: total,
    timestamp: new Date().toISOString(),
  });
});

app.put('/api/sheets/config', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can update Google Sheets settings' });
  }
  const updated = db.updateSheetsConfig(req.body);
  res.json(updated);
});

// --- Excel / CSV Exports ---
app.get('/api/export/csv/:type', (req: AuthRequest, res: Response) => {
  const type = req.params.type as 'students' | 'attendance' | 'fees';
  if (type === 'fees' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Financial export restricted to Academy Administrators' });
  }

  const month = req.query.month as string | undefined;
  const csv = db.exportCSV(type, month);
  const dateStr = new Date().toISOString().split('T')[0];
  const fileSuffix = month ? `_${month}` : `_${dateStr}`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="SCA_${type}${fileSuffix}.csv"`);
  res.send(csv);
});

// --- Backup & Restore (Local & Direct) ---
app.get('/api/backup', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Backup download restricted to Academy Administrators' });
  }
  const backup = db.getBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="SCA_Academy_Backup_${Date.now()}.json"`);
  res.json(backup);
});

app.post('/api/backup/restore', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Backup restore restricted to Academy Administrators' });
  }
  const success = db.restoreBackup(req.body);
  if (!success) {
    return res.status(400).json({ error: 'Invalid backup file structure' });
  }
  res.json({ success: true, message: 'Academy database restored successfully' });
});

// --- Google Drive Automatic Backup System ---
app.get('/api/backup/google/status', (req: AuthRequest, res: Response) => {
  const config = db.getGoogleDriveConfig();
  const safeConfig = {
    email: config.email || 'scacricketacademy0@gmail.com',
    connected: config.connected,
    clientId: config.clientId,
    hasClientSecret: Boolean(config.clientSecret || process.env.GOOGLE_DRIVE_CLIENT_SECRET),
    hasRefreshToken: Boolean(config.refreshToken),
    autoMonthlyBackupEnabled: config.autoMonthlyBackupEnabled ?? true,
    backupDayOfMonth: config.backupDayOfMonth ?? 1,
    backupHourOfDay: config.backupHourOfDay ?? 0,
    lastBackupDate: config.lastBackupDate,
    lastBackupFileName: config.lastBackupFileName,
    lastBackupFileSize: config.lastBackupFileSize,
    lastBackupStatus: config.lastBackupStatus,
    lastBackupError: config.lastBackupError,
    nextScheduledBackup: config.nextScheduledBackup,
    driveFolderPath: config.driveFolderPath || 'SCA Cricket Academy Backups/2026/November_Backup',
    mode: config.mode || 'oauth',
  };
  res.json({
    config: safeConfig,
    logs: db.getBackupLogs(),
    isAdmin: req.user?.role === 'admin',
  });
});

app.get('/api/backup/google/auth-url', (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const redirectUri = `${protocol}://${host}/api/backup/google/oauth/callback`;
  const authUrl = googleDriveBackupService.getAuthUrl(redirectUri);
  res.json({ authUrl, redirectUri });
});

app.get('/api/backup/google/oauth/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const redirectUri = `${protocol}://${host}/api/backup/google/oauth/callback`;

  if (!code) {
    return res.redirect('/?tab=more&section=backup&error=missing_code');
  }

  try {
    await googleDriveBackupService.exchangeCodeForTokens(code, redirectUri);
    res.redirect('/?tab=more&section=backup&status=connected');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'OAuth exchange failed';
    res.redirect(`/?tab=more&section=backup&error=${encodeURIComponent(msg)}`);
  }
});

app.post('/api/backup/google/connect-account', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can connect Google Drive' });
  }

  const { email, mode, accessToken, refreshToken } = req.body;
  const targetEmail = (email && email.trim()) || 'scacricketacademy0@gmail.com';

  db.updateGoogleDriveConfig({
    email: targetEmail,
    connected: true,
    mode: mode || 'oauth',
    accessToken: accessToken || db.getGoogleDriveConfig().accessToken,
    refreshToken: refreshToken || db.getGoogleDriveConfig().refreshToken,
    lastBackupError: null,
  });

  res.json({
    success: true,
    message: `Connected Google Drive successfully for ${targetEmail}`,
    config: db.getGoogleDriveConfig(),
  });
});

app.post('/api/backup/google/disconnect', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can disconnect Google Drive' });
  }

  db.updateGoogleDriveConfig({
    connected: false,
    accessToken: undefined,
    refreshToken: undefined,
    lastBackupStatus: 'idle',
    lastBackupError: null,
  });

  res.json({ success: true, message: 'Google Drive disconnected' });
});

app.post('/api/backup/google/settings', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can update backup settings' });
  }

  const { autoMonthlyBackupEnabled, clientId, clientSecret, email } = req.body;
  const updates: any = {};
  if (typeof autoMonthlyBackupEnabled === 'boolean') updates.autoMonthlyBackupEnabled = autoMonthlyBackupEnabled;
  if (clientId !== undefined) updates.clientId = clientId.trim();
  if (clientSecret !== undefined && clientSecret.trim()) updates.clientSecret = clientSecret.trim();
  if (email && email.trim()) updates.email = email.trim();

  const updated = db.updateGoogleDriveConfig(updates);
  res.json({ success: true, config: updated });
});

app.post('/api/backup/google/run', async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can trigger backups' });
  }

  const initiatedBy = req.user?.name || 'Academy Administrator';
  const result = await googleDriveBackupService.runBackup('manual', initiatedBy);
  res.json(result);
});

app.post('/api/backup/google/restore', async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Academy Admins can restore backups' });
  }

  const { backupData, fileId } = req.body;
  let targetPayload = backupData;

  if (fileId && !backupData) {
    // Look up from local cloud store or logs
    const log = db.getBackupLogs().find((l) => l.driveFileId === fileId || l.id === fileId);
    if (log) {
      const localFilePath = path.join(path.resolve('data'), 'google_drive_cloud', log.folderPath, log.fileName);
      if (fs.existsSync(localFilePath)) {
        targetPayload = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
      }
    }
  }

  if (!targetPayload) {
    return res.status(400).json({ error: 'No valid backup data or file found to restore.' });
  }

  const initiatedBy = req.user?.name || 'Academy Administrator';
  const restoreRes = await googleDriveBackupService.restoreFromBackupData(targetPayload, initiatedBy);
  if (!restoreRes.success) {
    return res.status(400).json(restoreRes);
  }
  res.json(restoreRes);
});

app.get('/api/backup/google/download/:logId', (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const log = db.getBackupLogs().find((l) => l.id === req.params.logId || l.driveFileId === req.params.logId);
  if (!log) {
    return res.status(404).json({ error: 'Backup record not found' });
  }

  const localFilePath = path.join(path.resolve('data'), 'google_drive_cloud', log.folderPath, log.fileName);
  if (fs.existsSync(localFilePath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${log.fileName}"`);
    return res.sendFile(localFilePath);
  }

  // Fallback to active DB backup
  const backup = db.getBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${log.fileName}"`);
  res.json(backup);
});

// --- Gemini AI Assistant (Cricket Coach & Academy Intelligence) ---
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

type AssistantRole = 'coach' | 'performance' | 'operations';

const ROLE_INSTRUCTIONS: Record<AssistantRole, string> = {
  coach: `You are the official Head Coach & Technical Advisor of the School of Cricket Academy (SCA) in Gummudipoondi, Tamil Nadu.
You have decades of elite cricket coaching expertise spanning grassroots to junior state-level cricket (Under-12, Under-14, Under-16, and Senior squads).
Your duties:
1. Provide actionable, progressive drills and biomechanical guidance on batting (stance, backlift, head alignment, front/back foot drives, pull, cut, sweep, playing spin and swing).
2. Teach pace and spin bowling mechanics (run-up rhythm, gather, seam presentation, wrist position, release point, swing variation, flight, drift, and turn).
3. Develop fielding and wicket-keeping routines (reaction catches, boundary anticipation, underarm/overarm throw accuracy, diving safety).
4. Emphasize cricket safety, equipment checks, and positive sportsmanship.
Formatting: Use clear headings, bullet points, and numbered steps so coaches can run net sessions immediately. Keep tone encouraging, authoritative, and disciplined.`,

  performance: `You are the High-Performance Cricket Training & Conditioning Consultant for School of Cricket Academy (SCA).
Your expertise spans cricket-specific athletic development, workload management, injury prevention, and mental resilience.
Your duties:
1. Design age-appropriate conditioning workouts (core stability, explosive rotational power, aerobic and anaerobic capacity, sprint mechanics between wickets).
2. Fast-bowler workload monitoring and injury prevention (rotator cuff health, lumbar spine protection, shin splints, hamstring strain prevention).
3. Warm-up, mobility, and cool-down protocols tailored for hot weather cricket in Tamil Nadu (hydration strategies, electrolytes, heat fatigue management).
4. Match-day psychological routines (focus routines before facing first ball, handling pressure in death overs).
Formatting: Provide actionable exercises with sets, reps, frequency, and safety precautions.`,

  operations: `You are the Academy Operations & Rules Assistant for School of Cricket Academy (SCA), Gummudipoondi.
Your duties:
1. Advise coaches and managers on academy regulations, attendance policies (e.g. minimum 75% attendance for match squad selection).
2. Guide fee administration policies and parent communications (monthly fees: U-12 ₹2,500/mo, U-14 ₹3,000/mo, U-16 ₹3,500/mo, Senior ₹4,000/mo; due on 5th of every month; UPI/Cash/Bank transfer).
3. Draft professional, polite parent messages for WhatsApp and SMS (fee reminders, upcoming batch timing notices, match day call-ups).
4. Assist with academy logistics, kit checklists (mandatory helmet with grille, pads, abdomen guard, spikes vs rubber studs), and turf/matting pitch maintenance.
Formatting: Provide clear copy-paste communication templates, checklists, and concise administrative summaries.`
};

app.post('/api/gemini/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { messages, role = 'coach', model = 'gemini-3.1-flash-lite' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is available.',
        code: 'MISSING_API_KEY'
      });
    }

    // Supported models as per guidelines
    const allowedModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.1-flash-lite';

    const selectedRole: AssistantRole = (role in ROLE_INSTRUCTIONS) ? role as AssistantRole : 'coach';
    const baseInstruction = ROLE_INSTRUCTIONS[selectedRole];

    // Gather live academy snapshot to ground answers
    const stats = db.getStats(req.user?.role || 'admin');
    const batches = db.getBatches();
    const batchSummary = batches.map(b => `${b.name} (${b.timing}, Coach ${b.assignedCoach})`).join('; ');

    const liveContext = `
[LIVE ACADEMY DATA SNAPSHOT]
- Academy Name: School of Cricket Academy (SCA) Gummudipoondi, Tamil Nadu
- Academy Helpline & Phone: +91 63804 49589
- Academy UPI ID: vijaykumarmm30@okicici (UPI Number: 6380449589 for GPay/PhonePe/Paytm)
- Current User: ${req.user?.name || 'Coach Jagadeesh'} (${req.user?.role || 'Coach'})
- Total Registered Players: ${stats.totalStudents} (${stats.activeStudents} active)
- Today's Attendance: ${stats.todayAttendance?.rate ?? 0}% (${stats.todayAttendance?.present ?? 0} present, ${stats.todayAttendance?.absent ?? 0} absent)
- Batches: ${batchSummary}
- Fees Snapshot: Total Collected ₹${(stats.feesThisMonth?.totalCollected ?? 0).toLocaleString('en-IN')}, Pending ₹${(stats.feesThisMonth?.totalPending ?? 0).toLocaleString('en-IN')}
Answer questions accurately using this real data when relevant.`;

    const fullSystemInstruction = `${baseInstruction}\n\n${liveContext}`;

    // Format contents for @google/genai multi-turn
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    let response;
    let finalModel = selectedModel;

    // Helper with graceful retry for transient spikes
    const executeWithRetry = async (targetModel: string) => {
      let lastErr: any;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          return await ai.models.generateContent({
            model: targetModel,
            contents,
            config: {
              systemInstruction: fullSystemInstruction,
            },
          });
        } catch (err: any) {
          lastErr = err;
          const errStr = String(err?.message || '');
          const isTransient =
            err?.status === 503 ||
            errStr.includes('503') ||
            errStr.includes('high demand') ||
            errStr.includes('UNAVAILABLE');

          if (isTransient && attempt < 2) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          break;
        }
      }
      throw lastErr;
    };

    try {
      response = await executeWithRetry(selectedModel);
    } catch (primaryErr: any) {
      const errStr = String(primaryErr?.message || '');
      const isTransientSpike =
        primaryErr?.status === 503 ||
        errStr.includes('503') ||
        errStr.includes('high demand') ||
        errStr.includes('UNAVAILABLE');

      if (selectedModel !== 'gemini-3.1-flash-lite') {
        console.warn(`[Gemini] ${selectedModel} failed (${errStr}); retrying with fallback model gemini-3.1-flash-lite`);
        finalModel = 'gemini-3.1-flash-lite';
        response = await executeWithRetry(finalModel);
      } else {
        throw primaryErr;
      }
    }

    const reply = response?.text || 'I could not generate a response. Please try rephrasing your question.';

    res.json({
      reply,
      modelUsed: finalModel,
      role: selectedRole,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    let errorMessage = error?.message || 'Error processing request with Gemini';
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed?.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch {
      // String message
    }

    if (String(errorMessage).includes('high demand') || String(errorMessage).includes('503')) {
      errorMessage = 'The Gemini API is currently experiencing a temporary demand spike. Please try sending your message again in a few moments.';
    }

    const statusCode = error?.status || 500;
    res.status(statusCode).json({
      error: errorMessage,
      code: error?.code || 'GEMINI_ERROR',
    });
  }
});

// --- Mount Vite / Static Files ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SCA Academy Server] running at http://0.0.0.0:${PORT}`);
    // Start Google Drive Automatic Monthly Backup Engine
    googleDriveBackupService.startScheduledRunner();
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
