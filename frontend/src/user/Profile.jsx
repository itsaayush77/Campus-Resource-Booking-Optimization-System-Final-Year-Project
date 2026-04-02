import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LuUser,
  LuMail,
  LuPhone,
  LuBuilding2,
  LuShieldCheck,
  LuPencil,
  LuX,
  LuCheck,
  LuLock,
  LuEye,
  LuEyeOff,
  LuTriangleAlert,
  LuCalendarDays,
  LuBadgeCheck,
  LuArrowLeft,
} from 'react-icons/lu';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

// ─── helpers ────────────────────────────────────────────────────────────────

const roleConfig = {
  admin:   { label: 'Administrator', gradient: 'from-violet-600 to-purple-600', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  staff:   { label: 'Staff',         gradient: 'from-blue-600 to-cyan-600',     color: 'bg-blue-50   text-blue-700   border-blue-200'   },
  student: { label: 'Student',       gradient: 'from-slate-600 to-slate-700',   color: 'bg-slate-50  text-slate-600  border-slate-200'  },
};

const getInitials = (name = '') =>
  name.trim().split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

// ─── Portal wrapper ─────────────────────────────────────────────────────────

const ModalPortal = ({ children }) => createPortal(children, document.body);

// ─── Reusable components ─────────────────────────────────────────────────────

const Field = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-4 py-4 border-b border-slate-100/80 last:border-0 group">
    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 transition-all duration-200 border rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-slate-100 group-hover:from-blue-50 group-hover:to-blue-100 group-hover:border-blue-200">
      <Icon className="w-[18px] h-[18px] text-slate-400 group-hover:text-blue-500 transition-colors duration-200" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium truncate text-slate-800">
        {value || <span className="italic font-normal text-slate-300">Not set</span>}
      </p>
    </div>
  </div>
);

const InputField = ({ label, id, icon: Icon, error, className = '', ...props }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <div className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <input
        id={id}
        className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-xl text-slate-800
          placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          focus:border-blue-400 transition-all duration-150
          ${error ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}
        {...props}
      />
    </div>
    {error && (
      <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
        <LuTriangleAlert className="flex-shrink-0 w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

const PasswordInput = ({ label, id, error, show, onToggle, className = '', ...props }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <div className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2">
        <LuLock className="w-4 h-4 text-slate-400" />
      </div>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-xl text-slate-800
          placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20
          focus:border-blue-400 transition-all duration-150
          ${error ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'}`}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute transition-colors -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-600"
      >
        {show ? <LuEyeOff className="w-4 h-4" /> : <LuEye className="w-4 h-4" />}
      </button>
    </div>
    {error && (
      <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
        <LuTriangleAlert className="flex-shrink-0 w-3 h-3" /> {error}
      </p>
    )}
  </div>
);

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

const EditProfileModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name:        user?.name        || '',
    phoneNumber: user?.phoneNumber || '',
    department:  user?.department  || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim())                errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (form.phoneNumber && !/^\+?[\d\s\-()]{7,15}$/.test(form.phoneNumber))
      errs.phoneNumber = 'Enter a valid phone number';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name:        form.name.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        department:  form.department.trim()  || undefined,
      });
      toast.success('Profile updated');
      onSaved(data.user ?? data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(15, 23, 42, 0.6)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl"
          style={{ animation: 'modalIn 0.2s ease-out' }}
        >
          {/* Header with back arrow */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <button
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            >
              <LuArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-900">Edit Profile</h2>
              <p className="text-xs text-slate-400 mt-0.5">Update your personal information</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <InputField
              label="Full Name" id="edit-name" icon={LuUser}
              value={form.name} onChange={set('name')}
              placeholder="Your full name" error={errors.name}
            />

            {/* Email read-only */}
            <div>
              <label className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute -translate-y-1/2 pointer-events-none left-3 top-1/2">
                  <LuMail className="w-4 h-4 text-slate-300" />
                </div>
                <input
                  disabled value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                <LuLock className="w-3 h-3" /> Email cannot be changed
              </p>
            </div>

            <InputField
              label="Phone Number" id="edit-phone" icon={LuPhone}
              value={form.phoneNumber} onChange={set('phoneNumber')}
              placeholder="+977 98XXXXXXXX" error={errors.phoneNumber}
            />
            <InputField
              label="Department" id="edit-dept" icon={LuBuilding2}
              value={form.department} onChange={set('department')}
              placeholder="e.g. Computer Science"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" />Saving…</>
                ) : (
                  <><LuCheck className="w-4 h-4" />Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

// ─── Change Password Modal ────────────────────────────────────────────────────

const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow]     = useState({ current: false, newPw: false, confirm: false });
  const [saving, setSaving] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set       = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleShow = (key) => setShow((s) => ({ ...s, [key]: !s[key] }));

  const validate = () => {
    const errs = {};
    if (!form.currentPassword)             errs.currentPassword = 'Current password is required';
    if (!form.newPassword)                 errs.newPassword = 'New password is required';
    else if (form.newPassword.length < 6)  errs.newPassword = 'Minimum 6 characters';
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      toast.success('Password changed successfully');
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to change password';
      if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')) {
        setErrors({ currentPassword: 'Incorrect current password' });
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  // Password strength
  const strength = (() => {
    const p = form.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p))   s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'][strength];
  const strengthText  = ['', 'text-red-500', 'text-amber-500', 'text-blue-500', 'text-emerald-600'][strength];

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(15, 23, 42, 0.6)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl"
          style={{ animation: 'modalIn 0.2s ease-out' }}
        >
          {/* Header with back arrow */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <button
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
            >
              <LuArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-400 mt-0.5">Choose a strong, unique password</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <PasswordInput
              label="Current Password" id="cur-pw"
              value={form.currentPassword} onChange={set('currentPassword')}
              placeholder="Enter current password"
              show={show.current} onToggle={() => toggleShow('current')}
              error={errors.currentPassword}
            />
            <PasswordInput
              label="New Password" id="new-pw"
              value={form.newPassword} onChange={set('newPassword')}
              placeholder="At least 6 characters"
              show={show.newPw} onToggle={() => toggleShow('newPw')}
              error={errors.newPassword}
            />

            {/* Strength meter */}
            {form.newPassword.length > 0 && (
              <div>
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map((n) => (
                    <div
                      key={n}
                      className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                        n <= strength ? strengthColor : 'bg-slate-100'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strengthText}`}>{strengthLabel}</p>
              </div>
            )}

            <PasswordInput
              label="Confirm New Password" id="conf-pw"
              value={form.confirmPassword} onChange={set('confirmPassword')}
              placeholder="Re-enter new password"
              show={show.confirm} onToggle={() => toggleShow('confirm')}
              error={errors.confirmPassword}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" />Updating…</>
                ) : (
                  <><LuCheck className="w-4 h-4" />Update Password</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [showEdit, setShowEdit]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const role     = roleConfig[user?.role] ?? roleConfig.student;
  const initials = getInitials(user?.name);
  const completionFields = [
    user?.name,
    user?.email,
    user?.phoneNumber,
    user?.department,
    user?.createdAt,
  ];
  const completion = Math.round(
    (completionFields.filter((field) => Boolean(field && String(field).trim())).length / completionFields.length) * 100
  );

  return (
    <>
      <div className="relative min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 sm:px-6 lg:px-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[40rem] h-[40rem] rounded-full -top-44 -left-56 bg-cyan-500/15 blur-3xl" />
          <div className="absolute rounded-full w-[34rem] h-[34rem] -right-36 top-20 bg-blue-500/15 blur-3xl" />
          <div className="absolute rounded-full w-[30rem] h-[30rem] left-1/3 -bottom-40 bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="mb-6 animate-profileFadeUp">
            <p className="text-xs font-semibold tracking-[0.2em] text-blue-600/80 uppercase">Account Center</p>
            <div className="flex flex-wrap items-end justify-between gap-3 mt-2">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Profile Overview</h1>
                <p className="mt-2 text-sm text-slate-600">Manage your personal details, account status, and security settings.</p>
              </div>
              <button
                onClick={() => setShowEdit(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wide text-blue-700 uppercase transition-all border rounded-xl border-blue-200 bg-blue-50 hover:bg-blue-100 hover:-translate-y-0.5"
              >
                <LuPencil className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden bg-white border shadow-xl rounded-3xl border-slate-200/70 animate-profileFadeUp" style={{ animationDelay: '40ms' }}>
                <div className="relative px-6 pt-6 pb-4">
                  <div className="absolute inset-x-0 top-0 h-24" style={{ background: 'linear-gradient(120deg, #0891b2 0%, #2563eb 50%, #1d4ed8 100%)' }} />
                  <div className="relative flex flex-col items-center pt-10 text-center">
                    <div className={`flex items-center justify-center w-24 h-24 border-4 border-white shadow-xl rounded-3xl bg-gradient-to-br ${role.gradient}`}>
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user?.name}
                          className="object-cover w-full h-full rounded-2xl"
                        />
                      ) : (
                        <span className="text-3xl font-black tracking-tight text-white select-none">{initials}</span>
                      )}
                    </div>
                    <h2 className="mt-4 text-xl font-black text-slate-900">{user?.name}</h2>
                    <p className="mt-1 text-sm break-all text-slate-500">{user?.email}</p>
                    <span className={`mt-3 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full border ${role.color}`}>
                      <LuBadgeCheck className="w-3 h-3" />
                      {role.label}
                    </span>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="p-3 border rounded-2xl border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                      <span>Profile Completion</span>
                      <span>{completion}%</span>
                    </div>
                    <div className="w-full h-2 mt-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white border shadow-xl rounded-3xl border-slate-200/70 animate-profileFadeUp" style={{ animationDelay: '90ms' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">Security</p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900">Password</h3>
                    <p className="mt-1 text-xs text-slate-500">Use a strong password to protect your account.</p>
                  </div>
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 border rounded-xl border-slate-200 bg-slate-50">
                    <LuLock className="w-5 h-5 text-slate-500" />
                  </div>
                </div>
                <button
                  onClick={() => setShowPassword(true)}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wide text-blue-700 uppercase border border-blue-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <LuPencil className="w-3.5 h-3.5" />
                  Change Password
                </button>
              </div>
            </aside>

            <section className="space-y-5">
              {(user?.isSuspended || user?.noShowCount > 0) && (
                <div
                  className={`rounded-2xl border p-4 flex items-start gap-3 animate-profileFadeUp ${
                    user?.isSuspended
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}
                  style={{ animationDelay: '120ms' }}
                >
                  <LuTriangleAlert
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      user?.isSuspended ? 'text-red-600' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <p className={`text-sm font-bold ${user?.isSuspended ? 'text-red-700' : 'text-amber-700'}`}>
                      {user?.isSuspended ? 'Account suspended' : 'No-show warning'}
                    </p>
                    <p className={`text-xs mt-1 ${user?.isSuspended ? 'text-red-600' : 'text-amber-700'}`}>
                      {user?.isSuspended
                        ? `Suspended until ${formatDate(user?.suspendedUntil)}. Contact an administrator for review.`
                        : `${user?.noShowCount} no-show${user?.noShowCount !== 1 ? 's' : ''} recorded.${
                            user?.noShowCount >= 2 ? ' One more will suspend your account.' : ''
                          }`}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3 animate-profileFadeUp" style={{ animationDelay: '150ms' }}>
                {[
                  {
                    label: 'No-Shows',
                    value: user?.noShowCount ?? 0,
                    tone: (user?.noShowCount ?? 0) > 0
                      ? 'from-red-500/10 to-red-500/0 border-red-200 text-red-700'
                      : 'from-slate-500/10 to-slate-500/0 border-slate-200 text-slate-800',
                  },
                  {
                    label: 'Account Status',
                    value: user?.isSuspended ? 'Suspended' : user?.isActive ? 'Active' : 'Inactive',
                    tone: user?.isSuspended
                      ? 'from-red-500/10 to-red-500/0 border-red-200 text-red-700'
                      : 'from-emerald-500/10 to-emerald-500/0 border-emerald-200 text-emerald-700',
                  },
                  {
                    label: 'Role',
                    value: role.label,
                    tone: 'from-blue-500/10 to-blue-500/0 border-blue-200 text-blue-800',
                  },
                ].map(({ label, value, tone }) => (
                  <div key={label} className={`rounded-2xl border bg-gradient-to-br px-4 py-4 shadow-sm hover:shadow-md transition-all duration-200 ${tone}`}>
                    <p className="text-lg font-black truncate">{value}</p>
                    <p className="mt-1 text-[11px] font-semibold tracking-wide uppercase text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden bg-white border shadow-xl rounded-3xl border-slate-200/70 animate-profileFadeUp" style={{ animationDelay: '180ms' }}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase">Details</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">Account Information</h3>
                  </div>
                  <div className="w-12 h-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
                </div>
                <div className="px-6 pb-1">
                  <Field label="Full Name" value={user?.name} icon={LuUser} />
                  <Field label="Email" value={user?.email} icon={LuMail} />
                  <Field label="Phone" value={user?.phoneNumber} icon={LuPhone} />
                  <Field label="Department" value={user?.department} icon={LuBuilding2} />
                  <Field label="Role" value={role.label} icon={LuShieldCheck} />
                  <Field label="Member since" value={formatDate(user?.createdAt)} icon={LuCalendarDays} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Modals (via Portal — renders on document.body) ──── */}
      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { if (updateUser) updateUser(updated); }}
        />
      )}
      {showPassword && (
        <ChangePasswordModal onClose={() => setShowPassword(false)} />
      )}

      {/* Modal animation keyframe */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes profileFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-profileFadeUp {
          animation: profileFadeUp 0.45s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-profileFadeUp {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

export default Profile;
