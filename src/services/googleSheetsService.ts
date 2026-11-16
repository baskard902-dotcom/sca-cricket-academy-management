import { Student, Batch, FeeRecord, AttendanceRecord } from '../types/index.ts';

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface SyncResult {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  updatedRows: number;
  timestamp: string;
  details: string;
}

/**
 * Creates a brand new official SCA Cricket Academy Google Spreadsheet in the user's Google Drive.
 */
export async function createAcademySpreadsheet(
  accessToken: string,
  title: string = 'SCA Cricket Academy - Master Data 2026'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';

  const payload = {
    properties: {
      title,
      locale: 'en_IN',
      timeZone: 'Asia/Kolkata',
    },
    sheets: [
      {
        properties: {
          title: 'SCA_Students',
          gridProperties: { rowCount: 100, columnCount: 16, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'SCA_Attendance',
          gridProperties: { rowCount: 200, columnCount: 10, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'SCA_Fees',
          gridProperties: { rowCount: 100, columnCount: 12, frozenRowCount: 1 },
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Spreadsheet (HTTP ${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Synchronize live students, attendance, and fee ledgers into the connected Google Sheet.
 */
export async function syncAllToGoogleSheets(
  accessToken: string,
  spreadsheetId: string,
  payloadData: {
    students: Student[];
    batches: Batch[];
    fees: FeeRecord[];
    attendance: AttendanceRecord[];
  }
): Promise<SyncResult> {
  // 1. Build Students Sheet Rows
  const studentHeaders = [
    'Student ID',
    'Full Name',
    'Date of Birth',
    'Age Category',
    'Training Batch',
    'Cricket Role',
    'Student Phone',
    'Guardian Name',
    'Guardian Phone',
    'Emergency Phone',
    'Monthly Fee (₹)',
    'Blood Group',
    'Status',
    'Joined Date',
    'Coaching Notes',
  ];

  const studentRows = payloadData.students.map((s) => [
    s.id,
    s.name,
    s.dob || '',
    s.ageGroup,
    s.batch,
    s.role,
    s.phone || '',
    s.guardianName || '',
    s.guardianPhone || '',
    s.emergencyPhone || '',
    s.monthlyFee,
    s.bloodGroup || 'O+',
    s.active ? 'Active' : 'Inactive',
    s.joinedDate || '',
    s.notes || '',
  ]);

  // 2. Build Attendance Sheet Rows
  const attendanceHeaders = [
    'Record ID',
    'Date',
    'Training Batch',
    'Student ID',
    'Student Name',
    'Attendance Status',
    'Marked By Coach',
    'Timestamp (UTC)',
  ];

  const attendanceRows = payloadData.attendance.map((a) => [
    a.id,
    a.date,
    a.batch,
    a.studentId,
    a.studentName,
    a.status.toUpperCase(),
    a.markedBy,
    a.timestamp,
  ]);

  // 3. Build Fees Sheet Rows
  const feeHeaders = [
    'Ledger ID',
    'Student ID',
    'Student Name',
    'Training Batch',
    'Billing Month',
    'Monthly Fee (₹)',
    'Amount Paid (₹)',
    'Balance Due (₹)',
    'Payment Status',
    'Due Date',
    'Last Payment Date',
  ];

  const feeRows = payloadData.fees.map((f) => [
    f.id,
    f.studentId,
    f.studentName,
    f.batch,
    f.monthYear,
    f.monthlyFee,
    f.amountPaid,
    f.balance,
    f.status.toUpperCase(),
    f.dueDate,
    f.lastPaymentDate || 'Pending',
  ]);

  // Batch Update payload
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'SCA_Students!A1:O' + (Math.max(1, studentRows.length) + 1),
        values: [studentHeaders, ...studentRows],
      },
      {
        range: 'SCA_Attendance!A1:H' + (Math.max(1, attendanceRows.length) + 1),
        values: [attendanceHeaders, ...attendanceRows],
      },
      {
        range: 'SCA_Fees!A1:K' + (Math.max(1, feeRows.length) + 1),
        values: [feeHeaders, ...feeRows],
      },
    ],
  };

  const response = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to sync Google Sheets (HTTP ${response.status})`);
  }

  const result = await response.json();
  const totalRowsUpdated = (result.totalUpdatedRows || 0) || (studentRows.length + attendanceRows.length + feeRows.length + 3);

  const timestamp = new Date().toISOString();
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    updatedRows: totalRowsUpdated,
    timestamp,
    details: `Updated ${studentRows.length} student records, ${attendanceRows.length} attendance rows, and ${feeRows.length} fee ledgers.`,
  };
}

/**
 * List existing spreadsheets from the connected user's Google Drive.
 */
export async function listUserGoogleSpreadsheets(accessToken: string): Promise<GoogleDriveFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=15`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to list files from Google Drive (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Read raw values from a specified Google Sheet tab/range.
 */
export async function readSheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to read range from Google Sheets (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.values || [];
}
