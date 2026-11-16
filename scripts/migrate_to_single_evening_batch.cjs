const fs = require('fs');
const path = require('path');

const dbPath = path.resolve('data/sca_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Set single Evening Batch
db.batches = [
  {
    id: 'BATCH-01',
    name: 'Evening Batch',
    timing: '04:30 PM - 07:00 PM',
    days: 'Mon - Sat',
    assignedCoach: 'Coach Jagadeesh & Coaching Staff',
    coachId: 'USR-002',
    capacity: 50,
  }
];

// 2. Assign Evening Batch to all coaches & admin
db.users = (db.users || []).map((u) => ({
  ...u,
  assignedBatches: ['Evening Batch'],
}));

// 3. Move every student into Evening Batch with 'All Ages'
db.students = (db.students || []).map((s) => ({
  ...s,
  batch: 'Evening Batch',
  ageGroup: 'All Ages',
}));

// 4. Update all fee records to Evening Batch
db.fees = (db.fees || []).map((f) => ({
  ...f,
  batch: 'Evening Batch',
}));

// 5. Update all attendance records to Evening Batch
db.attendance = (db.attendance || []).map((a) => ({
  ...a,
  batch: 'Evening Batch',
}));

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Updated database:
- ${db.batches.length} batch: ${db.batches[0].name} (${db.batches[0].timing})
- ${db.students.length} students moved to Evening Batch
- ${db.users.length} users updated
- ${db.fees.length} fee records updated
- ${db.attendance.length} attendance records updated`);
