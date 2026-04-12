import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2, Bell, ShieldCheck, Users, CreditCard, LogOut,
  MapPin, Mail, Phone, Lock, Eye, EyeOff,
  Loader2, Check, X, AlertTriangle, Sparkles, Construction,
  IndianRupee, FileText, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateClinicProfile, useChangePassword } from '@/hooks/queries/useClinicSettings';
import { FileUploadZone } from '@/components/clinic-registration/FileUploadZone';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { Clinic } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  clinic: Clinic;
  onUpdate: () => void;
}

type SectionId = 'profile' | 'notifications' | 'security' | 'roles' | 'billing' | 'logout';

interface ClinicFormState {
  name: string;
  address: string;
  city: string;
  phone: string;
  fees: number;
  description: string;
  specializations: string;
  images: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NOTIFICATION_STORAGE_KEY = 'wellsathi_clinic_notification_prefs';

interface NotificationPrefs {
  appointmentConfirmations: boolean;
  patientReports: boolean;
  billingInvoices: boolean;
}

function loadNotificationPrefs(): NotificationPrefs {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { appointmentConfirmations: true, patientReports: true, billingInvoices: false };
}

function saveNotificationPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(prefs));
}

function formFromClinic(clinic: Clinic): ClinicFormState {
  return {
    name: clinic.name || '',
    address: clinic.address || '',
    city: clinic.city || '',
    phone: clinic.phone || '',
    fees: clinic.fees ?? 0,
    description: clinic.description || '',
    specializations: clinic.specializations?.join(', ') || '',
    images: clinic.images || [],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleSwitch({
  enabled,
  onToggle,
  disabled = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={enabled}
      className={`
        relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300
        focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${enabled ? 'bg-primary' : 'bg-slate-200 border border-slate-300'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300
          ${enabled ? 'translate-x-7' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

function ComingSoonPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-slate-300" />
      </div>
      <h4 className="text-[18px] font-black text-slate-800 mb-2 tracking-tight">{title}</h4>
      <p className="text-[14px] font-medium text-slate-400 max-w-sm leading-relaxed mb-4">{description}</p>
      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-600 text-[12px] font-bold rounded-full">
        <Sparkles className="w-3.5 h-3.5" />
        Coming Soon
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClinicSettings({ clinic, onUpdate }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, signOut } = useAuthStore();

  // Active section navigation
  const [activeSection, setActiveSection] = useState<SectionId>('profile');

  // Profile form state
  const [form, setForm] = useState<ClinicFormState>(() => formFromClinic(clinic));

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(loadNotificationPrefs);

  // Mutations
  const updateProfileMutation = useUpdateClinicProfile(clinic.id);
  const changePasswordMutation = useChangePassword();

  // Photo upload
  const { uploadMultiple, isUploading } = useFileUpload({ bucket: 'clinic-images' });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (!user) return;
    const results = await uploadMultiple(files, user.id);
    const updated = [...form.images, ...results.map(r => r.url)];
    setForm(prev => ({ ...prev, images: updated }));
  }, [uploadMultiple, user, form.images]);

  const handleRemoveImage = useCallback((index: number) => {
    const updated = form.images.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, images: updated }));
  }, [form.images]);

  // Sync form if clinic prop changes (e.g., after refetch)
  useEffect(() => {
    if (!isDirty) {
      setForm(formFromClinic(clinic));
    }
  }, [clinic]);

  // Dirty tracking
  const isDirty = useMemo(() => {
    const original = formFromClinic(clinic);
    return (
      form.name !== original.name ||
      form.address !== original.address ||
      form.city !== original.city ||
      form.phone !== original.phone ||
      form.fees !== original.fees ||
      form.description !== original.description ||
      form.specializations !== original.specializations ||
      JSON.stringify(form.images) !== JSON.stringify(original.images)
    );
  }, [form, clinic]);

  // Handlers
  const handleFieldChange = useCallback(
    (field: keyof ClinicFormState, value: string | number) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleDiscardChanges = useCallback(() => {
    setForm(formFromClinic(clinic));
    toast.info('Changes discarded');
  }, [clinic]);

  const handleSaveProfile = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error('Clinic name is required');
      return;
    }
    if (!form.address.trim()) {
      toast.error('Address is required');
      return;
    }
    if (!form.city.trim()) {
      toast.error('City is required');
      return;
    }
    if (form.fees < 0) {
      toast.error('Fees cannot be negative');
      return;
    }

    const specs = form.specializations
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await updateProfileMutation.mutateAsync({
      name: form.name,
      address: form.address,
      city: form.city,
      phone: form.phone || null,
      fees: form.fees,
      description: form.description || null,
      specializations: specs.length > 0 ? specs : null,
      images: form.images.length > 0 ? form.images : null,
    });

    onUpdate();
  }, [form, updateProfileMutation, onUpdate]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    await changePasswordMutation.mutateAsync(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
  }, [newPassword, confirmPassword, changePasswordMutation]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      queryClient.clear();
      navigate('/auth', { replace: true });
    } catch {
      toast.error('Failed to sign out. Please try again.');
      setIsLoggingOut(false);
    }
  }, [signOut, queryClient, navigate]);

  const handleToggleNotif = useCallback(
    (key: keyof NotificationPrefs) => {
      setNotifPrefs((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        saveNotificationPrefs(updated);
        toast.success(`${key === 'appointmentConfirmations' ? 'Appointment confirmations' : key === 'patientReports' ? 'Patient reports' : 'Billing invoices'} ${updated[key] ? 'enabled' : 'disabled'}`);
        return updated;
      });
    },
    []
  );

  // Nav items
  const navItems: { id: SectionId; label: string; icon: typeof Building2; destructive?: boolean }[] = [
    { id: 'profile', label: 'Clinic Profile', icon: Building2 },
    { id: 'notifications', label: 'Notification Settings', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: ShieldCheck },
    { id: 'roles', label: 'User Roles & Access', icon: Users },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
    { id: 'logout', label: 'Logout', icon: LogOut, destructive: true },
  ];

  const userEmail = user?.email || 'N/A';
  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString()
    : 'Unknown';

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-28 relative min-h-[800px]">

      {/* Header */}
      <div className="mb-10 pl-1 border-b border-slate-100 pb-8">
        <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">
          Clinic Configuration
        </h2>
        <p className="text-slate-500 mt-2 font-medium text-[15px]">
          Manage your clinic details, security preferences, and administrative controls.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

        {/* ─── Sidebar Navigation ─────────────────────────────────────── */}
        <div className="w-full lg:w-64 flex flex-col gap-2 relative">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'logout') {
                  setShowLogoutConfirm(true);
                } else {
                  setActiveSection(item.id);
                }
              }}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[14px] font-bold transition-all duration-300 text-left ${
                item.destructive
                  ? 'bg-transparent border-2 border-transparent text-rose-500 hover:bg-rose-50 hover:border-rose-100 mt-4'
                  : activeSection === item.id
                  ? 'bg-white border-2 border-primary text-slate-900 shadow-[0_4px_20px_-5px_rgba(0,207,165,0.2)]'
                  : 'bg-transparent border-2 border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.destructive ? 'text-rose-500' : ''}`} />
              {item.label}
            </button>
          ))}
        </div>

        {/* ─── Content Area ────────────────────────────────────────────── */}
        <div className="flex-1 space-y-10">

          {/* ═══════ CLINIC PROFILE SECTION ═══════ */}
          {activeSection === 'profile' && (
            <section className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 pl-1">
                <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Clinic Profile</h3>
              </div>

              <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-8 space-y-6">

                {/* Name + Specializations */}
                <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-slate-50">
                  {/* Clinic avatar */}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                        Clinic Name
                      </label>
                      <Input
                        value={form.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                       
                        className="font-bold text-slate-900 rounded-xl bg-[#f8f9ff] border-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                        Specializations
                      </label>
                      <Input
                        value={form.specializations}
                        onChange={(e) => handleFieldChange('specializations', e.target.value)}
                       
                        placeholder="e.g. General Practice, Cardiology"
                        className="font-bold text-slate-900 rounded-xl bg-[#f8f9ff] border-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                      Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={userEmail}
                        disabled
                        className="font-bold text-slate-900 rounded-xl pl-11 bg-[#f8f9ff] border-slate-100"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 ml-1">Email is linked to your account</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={form.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                       
                        className="font-bold text-slate-900 rounded-xl pl-11 bg-[#f8f9ff] border-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Address + City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                      Clinic Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={form.address}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                       
                        className="font-bold text-slate-900 rounded-xl pl-11 bg-[#f8f9ff] border-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                      City
                    </label>
                    <Input
                      value={form.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                     
                      className="font-bold text-slate-900 rounded-xl bg-[#f8f9ff] border-slate-100"
                    />
                  </div>
                </div>

                {/* Fees + Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                      Consultation Fee (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="number"
                        min={0}
                        value={form.fees}
                        onChange={(e) => handleFieldChange('fees', parseInt(e.target.value) || 0)}
                       
                        className="font-bold text-slate-900 rounded-xl pl-11 bg-[#f8f9ff] border-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                      Registration Number
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={clinic.registration_number || '—'}
                        disabled
                        className="font-bold text-slate-900 rounded-xl pl-11 bg-[#f8f9ff] border-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                    Description
                  </label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                   
                    rows={3}
                    placeholder="Brief description about your clinic..."
                    className="font-bold text-slate-900 rounded-xl bg-[#f8f9ff] border-slate-100 resize-none"
                  />
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <FileUploadZone
                    label="Clinic Photos"
                    description="Upload pictures of your clinic to show on your profile"
                    accept="image/jpeg,image/png,image/webp"
                    maxFiles={5}
                    uploadedUrls={form.images}
                    onFilesSelected={handleFilesSelected}
                    onRemove={handleRemoveImage}
                    isUploading={isUploading}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ═══════ NOTIFICATION PREFERENCES ═══════ */}
          {activeSection === 'notifications' && (
            <section className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 pl-1">
                <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Notification Preferences</h3>
              </div>

              <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 divide-y divide-slate-50">
                <div className="p-8 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-[15px] text-slate-900">Appointment Confirmations</h4>
                    <p className="text-[13px] font-medium text-slate-500 mt-1.5">Send instant alerts for new bookings</p>
                  </div>
                  <ToggleSwitch
                    enabled={notifPrefs.appointmentConfirmations}
                    onToggle={() => handleToggleNotif('appointmentConfirmations')}
                  />
                </div>

                <div className="p-8 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-[15px] text-slate-900">Patient Reports</h4>
                    <p className="text-[13px] font-medium text-slate-500 mt-1.5">Daily summary of lab results and updates</p>
                  </div>
                  <ToggleSwitch
                    enabled={notifPrefs.patientReports}
                    onToggle={() => handleToggleNotif('patientReports')}
                  />
                </div>

                <div className="p-8 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-[15px] text-slate-900">Billing Invoices</h4>
                    <p className="text-[13px] font-medium text-slate-500 mt-1.5">Notify when payment cycles complete</p>
                  </div>
                  <ToggleSwitch
                    enabled={notifPrefs.billingInvoices}
                    onToggle={() => handleToggleNotif('billingInvoices')}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ═══════ SECURITY & PRIVACY ═══════ */}
          {activeSection === 'security' && (
            <section className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 pl-1">
                <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Security & Privacy</h3>
              </div>

              <div className="space-y-6">
                {/* Change Password Card */}
                <div className="bg-[#f0fbf9] border border-primary/20 rounded-[24px] p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[15px] text-slate-900">Change Password</h4>
                        <p className="text-[13px] font-medium text-slate-600 mt-1 max-w-sm leading-relaxed">
                          Update your account password for enhanced security.
                        </p>
                      </div>
                    </div>
                    {!showPasswordForm && (
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-xl shadow-sm whitespace-nowrap transition-colors"
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {showPasswordForm && (
                    <div className="mt-6 pt-6 border-t border-primary/10 space-y-4 max-w-lg">
                      <div>
                        <label className="text-[12px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="font-bold text-slate-900 rounded-xl bg-white border-slate-200 pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[12px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">
                          Confirm Password
                        </label>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="font-bold text-slate-900 rounded-xl bg-white border-slate-200"
                        />
                      </div>
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-[12px] font-bold text-rose-500 flex items-center gap-1">
                          <X className="w-3 h-3" /> Passwords don't match
                        </p>
                      )}
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={handleChangePassword}
                          disabled={changePasswordMutation.isPending || !newPassword || !confirmPassword}
                          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold text-[13px] rounded-xl"
                        >
                          {changePasswordMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Update Password
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="px-4 font-bold text-[13px] text-slate-500"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Info */}
                <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 md:p-8">
                  <div className="flex gap-4 items-start border-b border-slate-100 pb-6 mb-6">
                    <Stethoscope className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-[15px] text-slate-900">Active Session</h4>
                      <p className="text-[13px] font-medium text-slate-500 mt-1">Your currently active session details.</p>
                    </div>
                  </div>

                  <div className="ml-9 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">
                            {userEmail}
                          </p>
                          <p className="text-[12px] font-bold text-slate-400 mt-1">
                            Role: {profile?.role || 'clinic'} • Last sign-in: {lastSignIn}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═══════ USER ROLES & ACCESS — Coming Soon ═══════ */}
          {activeSection === 'roles' && (
            <section className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 pl-1">
                <h3 className="text-[17px] font-black text-slate-900 tracking-tight">User Roles & Access</h3>
              </div>
              <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
                <ComingSoonPlaceholder
                  title="Role Management"
                  description="Invite team members, assign roles like Administrator or Practitioner, and manage access permissions for your clinic."
                />
              </div>
            </section>
          )}

          {/* ═══════ BILLING & SUBSCRIPTION — Coming Soon ═══════ */}
          {activeSection === 'billing' && (
            <section className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 pl-1">
                <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Billing & Subscription</h3>
              </div>
              <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
                <ComingSoonPlaceholder
                  title="Billing Dashboard"
                  description="View invoices, manage subscription plans, and track payment history — all in one place."
                />
              </div>
            </section>
          )}

        </div>
      </div>

      {/* ─── Logout Confirmation Modal ─────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-primarylack/30 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-5">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-[20px] font-black text-slate-900 mb-2 tracking-tight">
                Sign Out?
              </h3>
              <p className="text-[14px] font-medium text-slate-500 leading-relaxed mb-8">
                You'll be signed out of your clinic dashboard. Any unsaved changes will be lost.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="flex-1 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 px-5 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Action Bar (profile section only, when dirty) ── */}
      {activeSection === 'profile' && isDirty && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 px-6 md:px-12 flex items-center justify-end gap-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] animate-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={handleDiscardChanges}
            className="px-6 py-3 font-bold text-[14px] text-slate-500 hover:text-slate-800 transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            className="px-8 py-3 bg-primary hover:bg-[#00ba94] text-white font-bold text-[14px] rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Configuration
          </button>
        </div>
      )}
    </div>
  );
}
