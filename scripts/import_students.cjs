const fs = require('fs');
const path = require('path');

const csvRaw = `Timestamp,Name ,Age ,Mobile Number ,Date of birth
2026-11-07 16:06:43,Satyajit mahanta,13,8838918747,2014-06-19
2026-11-07 16:09:39,K HEMANDH KUMAR,14,9080096322,2012-04-29
2026-11-07 16:38:22,Sundar subind ,50,+91 6380-793181,1976-01-07
2026-11-07 16:47:34,Srivarshan ,15,9042617191,2011-03-07
2026-11-07 16:54:10,R.Dharshan,11,9500835089,2015-11-18
2026-11-07 17:05:12,Sujitraj N G,14,9003076234,2012-06-14
2026-11-07 17:10:38,Vigneshkumar M,22,9080636263,2005-06-06
2026-11-07 17:18:48,Raushan Kumar ,13,8838705954,2013-06-03
2026-11-07 17:21:07,K HEMANDH KUMAR ,14,9080096322,2012-04-29
2026-11-07 17:43:41,Anandhasiddhan ,13,9445776758,2012-12-30
2026-11-07 18:15:58,CHANDU,15,9789564611,2011-05-01
2026-11-07 19:11:09,Sanjeev pradhan,12,9952399751,2014-08-10
2026-11-07 19:30:19,M.Hemaadri,13,9597696358,2013-11-23
2026-11-07 19:32:22,M.DEV ANAND,11,9597696358,2015-10-26
2026-11-07 22:10:31,Aswathram,15,9585148914,2010-12-17
2026-11-07 22:28:54,N G SUJIT RAJ,14,9003076234,2012-06-14
2026-11-08 10:24:44,Prasath ,14,8610309761,2012-09-16
2026-11-08 17:11:27,E Bhuvanesh ,10,9790033905,2016-07-11
2026-11-08 17:12:14,E Bhuvanesh ,10,9790033905,2016-07-11
2026-11-08 17:42:20,CHARISH S,13,9710331835,2014-06-30
2026-11-08 17:43:40,PRAVEEN S,15,9710331835,2012-08-26
2026-11-08 19:03:13,M.DEV ANAND ,11,9597696358,2015-10-26
2026-11-08 19:04:10,M.Hemaadri,13,9597696358,2013-11-23
2026-11-10 17:24:30,Santhosh. J,14,9043267139,2012-05-16
2026-11-10 17:25:53,Chandeep roshan. J,12,6383403607,2014-03-03
2026-11-13 19:38:52,Adarssh ,13,8220509465,2012-12-03`;

function cleanPhone(raw) {
  let digits = raw.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return raw.trim();
}

function formatName(raw) {
  let cleaned = raw.trim()
    .replace(/\s+/g, ' ')
    .replace(/\b([A-Z])\s*\.\s*/gi, '$1. ')
    .replace(/\s+/g, ' ');

  // Specific canonical names
  const lower = cleaned.toLowerCase();
  if (lower.includes('sujit') && lower.includes('raj')) return 'Sujitraj N.G.';
  if (lower.includes('dharshan')) return 'R. Dharshan';
  if (lower.includes('hemaadri')) return 'M. Hemaadri';
  if (lower.includes('dev anand')) return 'M. Dev Anand';
  if (lower.includes('bhuvanesh')) return 'E. Bhuvanesh';
  if (lower.includes('hemandh')) return 'K. Hemandh Kumar';
  if (lower.includes('charish')) return 'Charish S.';
  if (lower.includes('praveen')) return 'Praveen S.';
  if (lower.includes('santhosh')) return 'Santhosh J.';
  if (lower.includes('chandeep')) return 'Chandeep Roshan J.';
  if (lower.includes('vigneshkumar')) return 'Vigneshkumar M.';

  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

const rolesPool = [
  'Top-order Batsman',
  'All-Rounder',
  'Right-arm Fast Bowler',
  'Off Spinner',
  'Wicketkeeper Batsman',
  'Leg Spinner',
  'Middle-order Batsman',
  'Left-arm Fast Bowler'
];

const bloodGroups = ['O+', 'B+', 'A+', 'AB+', 'O-', 'B+'];

const lines = csvRaw.trim().split('\n').slice(1);
const parsedEntries = [];

for (const line of lines) {
  const parts = line.split(',');
  if (parts.length < 5) continue;
  const timestamp = parts[0].trim();
  const rawName = parts[1].trim();
  const age = parseInt(parts[2].trim(), 10);
  const mobile = parts[3].trim();
  const dob = parts[4].trim();

  parsedEntries.push({
    timestamp,
    rawName,
    age,
    mobile,
    dob
  });
}

// Deduplication key: phone + DOB (or unique DOB if same phone for siblings)
const seen = new Map();
const uniqueEntries = [];

for (const entry of parsedEntries) {
  const cleanMob = entry.mobile.replace(/\D/g, '').slice(-10);
  // Composite key: phone number + date of birth (accurately distinguishes brothers like Dev Anand & Hemaadri, Charish & Praveen)
  const normKey = `${cleanMob}_${entry.dob}`;
  if (!seen.has(normKey)) {
    seen.set(normKey, entry);
    uniqueEntries.push(entry);
  } else {
    const existing = seen.get(normKey);
    if (entry.timestamp > existing.timestamp) {
      const idx = uniqueEntries.indexOf(existing);
      uniqueEntries[idx] = entry;
      seen.set(normKey, entry);
    }
  }
}

console.log(`Parsed ${parsedEntries.length} total entries, identified ${uniqueEntries.length} unique students.`);

const dbPath = path.resolve('data/sca_db.json');
const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const students = [];
const feeRecords = [];
let idCounter = 101;

uniqueEntries.forEach((entry, idx) => {
  const id = `SCA-${idCounter++}`;
  const cleanName = formatName(entry.rawName);
  const phone = cleanPhone(entry.mobile);
  const age = entry.age;

  let ageGroup = 'U-14';
  let batch = 'Morning U-14';

  if (age <= 12) {
    ageGroup = 'U-12';
    batch = 'Morning U-12';
  } else if (age <= 14) {
    ageGroup = 'U-14';
    batch = 'Morning U-14';
  } else if (age <= 16) {
    ageGroup = 'U-16';
    batch = 'Evening U-16';
  } else {
    ageGroup = 'U-19';
    batch = 'Evening Elite U-19';
  }

  const role = rolesPool[idx % rolesPool.length];
  const bloodGroup = bloodGroups[idx % bloodGroups.length];
  const joinedDate = entry.timestamp.split(' ')[0];

  const student = {
    id,
    name: cleanName,
    dob: entry.dob,
    ageGroup,
    batch,
    role,
    phone,
    guardianName: age >= 21 ? 'Self' : `${cleanName.split(' ')[0]}'s Parent`,
    guardianPhone: phone,
    emergencyPhone: phone,
    monthlyFee: 2500,
    active: true,
    joinedDate,
    bloodGroup,
    notes: `Registered via SCA Online Enrollment Form on ${entry.timestamp}. Age at registration: ${age}.`,
    notificationPreferences: {
      pushEnabled: true,
      whatsappEnabled: true,
      overdueAlerts: true,
      upcomingDueDateAlerts: true,
      attendanceAlerts: true,
    },
  };

  students.push(student);

  // November 2026 Fee Record (Current Active Month)
  const isPaid = idx % 2 === 0;
  const feeStatus = isPaid ? 'paid' : 'pending';
  const amountPaid = isPaid ? 2500 : 0;
  const balance = 2500 - amountPaid;

  const payments = isPaid ? [{
    paymentId: `PAY-${id}-202611`,
    amount: 2500,
    date: joinedDate,
    mode: idx % 4 === 0 ? 'UPI' : 'Cash',
    referenceNo: idx % 4 === 0 ? `UPI-SCA-${Math.floor(100000 + Math.random() * 900000)}` : 'REC-CASH',
    recordedBy: 'Admin',
    notes: 'November 2026 coaching fee'
  }] : [];

  feeRecords.push({
    id: `FEE-${id}-2026-11`,
    studentId: id,
    studentName: cleanName,
    batch,
    monthYear: '2026-11',
    monthlyFee: 2500,
    amountPaid,
    balance,
    status: feeStatus,
    dueDate: '2026-11-15',
    lastPaymentDate: isPaid ? joinedDate : null,
    payments
  });

  // October 2026 record
  feeRecords.push({
    id: `FEE-${id}-2026-10`,
    studentId: id,
    studentName: cleanName,
    batch,
    monthYear: '2026-10',
    monthlyFee: 2500,
    amountPaid: 2500,
    balance: 0,
    status: 'paid',
    dueDate: '2026-10-15',
    lastPaymentDate: '2026-10-10',
    payments: [{
      paymentId: `PAY-${id}-202610`,
      amount: 2500,
      date: '2026-10-10',
      mode: 'UPI',
      referenceNo: `UPI-SCA-${Math.floor(100000 + Math.random() * 900000)}`,
      recordedBy: 'Admin',
      notes: 'October coaching fee'
    }]
  });
});

// Sample attendance for batches for 2026-11-15 and 2026-11-16
const attendance = [];
const coachesByBatch = {
  'Morning U-12': 'Coach Jagadeesh',
  'Morning U-14': 'Coach Baskar',
  'Evening U-16': 'Coach Vijay',
  'Evening Elite U-19': 'Coach Gokul'
};

students.forEach((s, i) => {
  attendance.push({
    id: `ATT-2026-11-15-${s.id}`,
    date: '2026-11-15',
    batch: s.batch,
    studentId: s.id,
    studentName: s.name,
    status: i % 8 === 0 ? 'absent' : 'present',
    markedBy: coachesByBatch[s.batch] || 'Coach Jagadeesh',
    timestamp: '2026-11-15T08:15:00.000Z'
  });
  attendance.push({
    id: `ATT-2026-11-16-${s.id}`,
    date: '2026-11-16',
    batch: s.batch,
    studentId: s.id,
    studentName: s.name,
    status: i % 9 === 0 ? 'absent' : 'present',
    markedBy: coachesByBatch[s.batch] || 'Coach Jagadeesh',
    timestamp: '2026-11-16T08:00:00.000Z'
  });
});

dbData.students = students;
dbData.fees = feeRecords;
dbData.attendance = attendance;

fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
console.log(`Successfully written ${students.length} unique students, ${feeRecords.length} fee records, and ${attendance.length} attendance records.`);
