import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  AlertTriangle,
  Edit2,
  X,
  Filter,
  Bell,
  PartyPopper,
  MessageCircle,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { Student, Batch, User, CricketRole, AgeGroup } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface Props {
  students: Student[];
  batches: Batch[];
  currentUser: User | null;
  onAddStudent: (data: Omit<Student, 'id'>) => Promise<any>;
  onUpdateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  onOpenPreferences?: (student: Student) => void;
  onNavigateToWelcomeSettings?: () => void;
}

const CRICKET_ROLES: CricketRole[] = [
  'Top-order Batsman',
  'Middle-order Batsman',
  'Wicketkeeper Batsman',
  'Right-arm Fast Bowler',
  'Left-arm Fast Bowler',
  'Off Spinner',
  'Leg Spinner',
  'All-Rounder',
];

const AGE_GROUPS: AgeGroup[] = ['All Ages', 'U-12', 'U-14', 'U-16', 'U-19'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const StudentsView: React.FC<Props> = ({
  students,
  batches,
  currentUser,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  isAddModalOpen,
  setIsAddModalOpen,
  onOpenPreferences,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Edit State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('2014-01-01');
  const [formAgeGroup, setFormAgeGroup] = useState<AgeGroup>('All Ages');
  const [formBatch, setFormBatch] = useState(batches[0]?.name || 'Evening Batch');
  const [formRole, setFormRole] = useState<CricketRole>('Top-order Batsman');
  const [formPhone, setFormPhone] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState('');
  const [formMonthlyFee, setFormMonthlyFee] = useState(2500);
  const [formBloodGroup, setFormBloodGroup] = useState('O+');
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Welcome WhatsApp Celebration Modal & Loading State
  const [welcomeCelebration, setWelcomeCelebration] = useState<{
    studentName: string;
    studentId: string;
    guardianPhone: string;
    whatsappLink?: string;
    status: string;
  } | null>(null);
  const [sendingWelcomeId, setSendingWelcomeId] = useState<string | null>(null);
  const [welcomeActionFeedback, setWelcomeActionFeedback] = useState<string | null>(null);

  const handleSendWelcomeToStudent = async (student: Student) => {
    setSendingWelcomeId(student.id);
    setWelcomeActionFeedback(null);
    try {
      const res = await api.sendWelcomeMessage(student.id, true);
      if (res.whatsappLink) {
        window.open(res.whatsappLink, '_blank');
      }
      setWelcomeActionFeedback(`Welcome invitation opened for ${student.name}!`);
      setTimeout(() => setWelcomeActionFeedback(null), 3500);
    } catch (err: any) {
      alert('Failed to send welcome message: ' + (err.message || 'Unknown error'));
    } finally {
      setSendingWelcomeId(null);
    }
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.guardianPhone.includes(q) ||
          s.role.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Batch filter
      if (selectedBatchFilter !== 'all' && s.batch !== selectedBatchFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !s.active) return false;
      if (statusFilter === 'inactive' && s.active) return false;

      return true;
    });
  }, [students, searchQuery, selectedBatchFilter, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormDob(student.dob);
    setFormAgeGroup(student.ageGroup);
    setFormBatch(student.batch);
    setFormRole(student.role);
    setFormPhone(student.phone);
    setFormGuardianName(student.guardianName);
    setFormGuardianPhone(student.guardianPhone);
    setFormEmergencyPhone(student.emergencyPhone);
    setFormMonthlyFee(student.monthlyFee);
    setFormBloodGroup(student.bloodGroup);
    setFormNotes(student.notes || '');
    setFormActive(student.active);
    setFormError(null);
  };

  const resetForm = () => {
    setFormName('');
    setFormDob('2014-01-01');
    setFormAgeGroup('All Ages');
    setFormBatch(batches[0]?.name || 'Evening Batch');
    setFormRole('Top-order Batsman');
    setFormPhone('');
    setFormGuardianName('');
    setFormGuardianPhone('');
    setFormEmergencyPhone('');
    setFormMonthlyFee(2500);
    setFormBloodGroup('O+');
    setFormNotes('');
    setFormActive(true);
    setFormError(null);
    setEditingStudent(null);
  };

  React.useEffect(() => {
    if (isAddModalOpen && !editingStudent) {
      resetForm();
    }
  }, [isAddModalOpen]);

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingStudent(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Player name is required');
      return;
    }
    if (!formGuardianPhone.trim()) {
      setFormError('Guardian phone number is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingStudent) {
        await onUpdateStudent(editingStudent.id, {
          name: formName.trim(),
          dob: formDob,
          ageGroup: formAgeGroup,
          batch: formBatch,
          role: formRole,
          phone: formPhone.trim() || formGuardianPhone.trim(),
          guardianName: formGuardianName.trim() || 'Parent',
          guardianPhone: formGuardianPhone.trim(),
          emergencyPhone: formEmergencyPhone.trim() || formGuardianPhone.trim(),
          monthlyFee: Number(formMonthlyFee),
          bloodGroup: formBloodGroup,
          notes: formNotes.trim(),
          active: formActive,
        });
        handleCloseModal();
      } else {
        const res = await onAddStudent({
          name: formName.trim(),
          dob: formDob,
          ageGroup: formAgeGroup,
          batch: formBatch,
          role: formRole,
          phone: formPhone.trim() || formGuardianPhone.trim(),
          guardianName: formGuardianName.trim() || 'Parent',
          guardianPhone: formGuardianPhone.trim(),
          emergencyPhone: formEmergencyPhone.trim() || formGuardianPhone.trim(),
          monthlyFee: Number(formMonthlyFee),
          bloodGroup: formBloodGroup,
          notes: formNotes.trim(),
          active: true,
          joinedDate: new Date().toISOString().split('T')[0],
        });

        handleCloseModal();

        // Trigger welcome WhatsApp celebration modal
        if (res?.welcomeResult?.whatsappLink || res?.id) {
          setWelcomeCelebration({
            studentName: res?.name || formName.trim(),
            studentId: res?.id || 'SCA-NEW',
            guardianPhone: res?.guardianPhone || formGuardianPhone.trim(),
            whatsappLink: res?.welcomeResult?.whatsappLink,
            status: res?.welcomeResult?.status || 'sent',
          });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Search & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#1F2937] tracking-tight">Students Directory</h2>
            <p className="text-xs text-[#64748B]">
              {students.length} registered players • {students.filter((s) => s.active).length} active
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-xs shadow-xs transition min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name, ID (e.g. SCA-101), role, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-900 text-base sm:text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#1E3A5F] transition min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
          {/* Batch Filter Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-600" /> Batch:
            </span>
            <button
              onClick={() => setSelectedBatchFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition min-h-[36px] ${
                selectedBatchFilter === 'all'
                  ? 'bg-[#1E3A5F] text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({students.length})
            </button>
            {batches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBatchFilter(b.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition min-h-[36px] ${
                  selectedBatchFilter === b.name
                    ? 'bg-[#1E3A5F] text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition min-h-[32px] ${
                statusFilter === 'active'
                  ? 'bg-[#16A34A] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition min-h-[32px] ${
                statusFilter === 'inactive'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition min-h-[32px] ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Student List: Light Cards */}
      {students.length === 0 ? (
        <div className="py-14 px-4 text-center rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Players Registered Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Your academy player directory is empty and ready. Tap the button below to register your first cricket student.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-bold transition shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student Now</span>
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-white border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">No students found matching filters.</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search or batch filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className={`rounded-2xl border p-4 bg-white transition flex flex-col justify-between gap-3 shadow-xs ${
                student.active ? 'border-slate-200 hover:border-slate-300' : 'border-rose-200 bg-rose-50/20 opacity-80'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 tracking-tight leading-snug">
                        {student.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {student.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                          {student.ageGroup}
                        </span>
                        {student.welcomeMessageStatus === 'sent' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-[#16A34A] border border-emerald-200 font-semibold" title="WhatsApp Welcome Sent">
                            WA Sent ✓
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 font-medium" title="WhatsApp Welcome Pending">
                            WA Pending
                          </span>
                        )}
                        {!student.active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenPreferences && (
                      <button
                        onClick={() => onOpenPreferences(student)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-600 flex items-center justify-center transition border border-slate-200"
                        title="Configure Parent Notification Preferences"
                        aria-label={`Notification Preferences for ${student.name}`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition border border-slate-200"
                      title="Edit Student"
                      aria-label={`Edit ${student.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-medium">
                    {student.role}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    {student.batch}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    🩸 {student.bloodGroup}
                  </span>
                </div>

                {/* Coaching Notes */}
                {student.notes && (
                  <p className="mt-2 text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-xl border border-slate-200">
                    &quot;{student.notes}&quot;
                  </p>
                )}
              </div>

              {/* Bottom Card Actions: CALL PARENT / EMERGENCY / WELCOME WA */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 truncate">
                  Parent: <span className="text-slate-800 font-semibold">{student.guardianName}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* WhatsApp Welcome Button */}
                  <button
                    type="button"
                    onClick={() => handleSendWelcomeToStudent(student)}
                    disabled={sendingWelcomeId === student.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#16A34A] border border-[#25D366]/30 text-xs font-bold transition min-h-[38px]"
                    title="Send / Resend WhatsApp Welcome &amp; Community Invitation"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span className="hidden sm:inline">Welcome WA</span>
                  </button>

                  {/* Phone Call Link (Min 44px touch target) */}
                  <a
                    href={`tel:${student.guardianPhone}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition min-h-[38px]"
                    title="Call Guardian"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>

                  {student.emergencyPhone && (
                    <a
                      href={`tel:${student.emergencyPhone}`}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#DC2626] border border-rose-200 text-xs font-bold transition min-h-[44px] flex items-center justify-center"
                      title="Call Emergency Contact"
                      aria-label="Emergency Call"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= ADD / EDIT STUDENT MODAL ================= */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingStudent ? `Edit Player: ${editingStudent.name}` : 'Register New Player'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Aarav Patel"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                />
              </div>

              {/* Age Group & Batch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age Category
                  </label>
                  <select
                    value={formAgeGroup}
                    onChange={(e) => setFormAgeGroup(e.target.value as AgeGroup)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                  >
                    {AGE_GROUPS.map((ag) => (
                      <option key={ag} value={ag}>
                        {ag}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Training Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Playing Role & Blood Group */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cricket Specialization
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as CricketRole)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                  >
                    {CRICKET_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={formBloodGroup}
                    onChange={(e) => setFormBloodGroup(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formDob}
                  onChange={(e) => setFormDob(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                />
              </div>

              {/* Guardian Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    value={formGuardianName}
                    onChange={(e) => setFormGuardianName(e.target.value)}
                    placeholder="e.g. Sanjay Patel"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="+91 98201 12345"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                  />
                </div>
              </div>

              {/* Emergency Contact & Monthly Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={formEmergencyPhone}
                    onChange={(e) => setFormEmergencyPhone(e.target.value)}
                    placeholder="+91 98201 99999"
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="100"
                    value={formMonthlyFee}
                    onChange={(e) => setFormMonthlyFee(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F]"
                  />
                </div>
              </div>

              {/* Coaching Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coach Observations &amp; Technical Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Good bat swing, work on high-elbow follow through"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-base rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1E3A5F] resize-none"
                />
              </div>

              {/* Active Toggle (If editing) */}
              {editingStudent && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-900">Enrollment Status</span>
                    <p className="text-[11px] text-slate-500">
                      {formActive ? 'Active Academy Student' : 'Inactive / Paused'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormActive(!formActive)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                      formActive
                        ? 'bg-[#16A34A] text-white'
                        : 'bg-[#DC2626] text-white'
                    }`}
                  >
                    {formActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                {editingStudent && isAdmin && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to deactivate ${editingStudent.name}?`)) {
                        await onDeleteStudent(editingStudent.id);
                        handleCloseModal();
                      }
                    }}
                    className="px-3 py-2.5 rounded-xl bg-rose-50 text-[#DC2626] hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition min-h-[44px]"
                  >
                    Deactivate
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] text-white font-bold text-xs shadow-xs transition min-h-[44px] disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingStudent ? 'Update Player' : 'Register Player'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= WELCOME WHATSAPP CELEBRATION MODAL ================= */}
      {welcomeCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-2xl">
              🎉
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Student Enrolled Successfully!
              </h3>
              <p className="text-xs text-slate-600">
                <strong>{welcomeCelebration.studentName}</strong> ({welcomeCelebration.studentId}) is now registered in the academy database.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Welcome Invitation</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                  READY
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Includes official SCA Family Group, Session Updates Group, Instagram profile, and YouTube channel links.
              </p>
              <div className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                Target: {welcomeCelebration.guardianPhone}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              {welcomeCelebration.whatsappLink && (
                <a
                  href={welcomeCelebration.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWelcomeCelebration(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Open &amp; Send on WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setWelcomeCelebration(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
