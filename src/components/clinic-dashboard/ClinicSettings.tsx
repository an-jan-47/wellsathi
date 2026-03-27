import { useState } from 'react';
import { Building2, Bell, ShieldCheck, Users, CreditCard, UploadCloud, MapPin, Mail, Phone, Lock, MonitorSmartphone, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  clinic: any;
  onUpdate: () => void;
}

export function ClinicSettings({ clinic, onUpdate }: Props) {
  const [activeSection, setActiveSection] = useState('profile');

  const navItems = [
    { id: 'profile', label: 'Clinic Profile', icon: Building2 },
    { id: 'notifications', label: 'Notification Settings', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: ShieldCheck },
    { id: 'roles', label: 'User Roles & Access', icon: Users },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-24 relative min-h-[800px]">
      
      {/* Header */}
      <div className="mb-10 pl-1 border-b border-slate-100 pb-8 flex justify-between items-start">
        <div>
          <h2 className="text-[28px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">Clinic Configuration</h2>
          <p className="text-slate-500 mt-2 font-medium text-[15px]">Manage your clinic details, security preferences, and administrative controls.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Side Navigation */}
        <div className="w-full lg:w-64 flex flex-col gap-2 relative">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[14px] font-bold transition-all duration-300 text-left ${
                activeSection === item.id 
                 ? 'bg-white border-2 border-primary text-slate-900 shadow-[0_4px_20px_-5px_rgba(0,207,165,0.2)]'
                 : 'bg-transparent border-2 border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Side Content Container */}
        <div className="flex-1 space-y-10">
          
          {/* Clinic Profile Section */}
          <section className={activeSection !== 'profile' && activeSection !== 'all' ? 'hidden' : 'block'}>
            <div className="flex justify-between items-center mb-6 pl-1">
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Clinic Profile</h3>
              <button className="text-[13px] font-bold text-slate-900 uppercase tracking-widest hover:text-primary transition-colors">Update Details</button>
            </div>
            
            <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-8 space-y-6">
              
              <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
                <div className="w-24 h-24 rounded-2xl bg-[#f8f9ff] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-primary transition-colors cursor-pointer group">
                  <UploadCloud className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Clinic Name</label>
                    <Input defaultValue={clinic?.name || 't5 Clinic & Wellness Center'} className="font-bold text-slate-900 rounded-xl bg-[#f8f9ff] border-slate-100" />
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Specialization</label>
                    <Input defaultValue="General Practice & Cardiology" className="font-bold text-slate-900 rounded-xl bg-[#f8f9ff] border-slate-100" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Contact Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input defaultValue="contact@t5clinic.com" className="font-bold text-slate-900 rounded-xl pl-11 bg-[#f8f9ff] border-slate-100" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input defaultValue={clinic?.phone || '+1 (555) 000-1234'} className="font-bold text-slate-900 rounded-xl pl-11 bg-[#f8f9ff] border-slate-100" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Clinic Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input defaultValue={clinic?.address || '123 Medical Plaza, Health District, SF 94103'} className="font-bold text-slate-900 rounded-xl pl-11 bg-[#f8f9ff] border-slate-100 w-full" />
                </div>
              </div>
            </div>
          </section>

          {/* Notification Preferences */}
          <section className={activeSection !== 'notifications' && activeSection !== 'profile' && activeSection !== 'all' ? 'hidden' : 'block'}>
            <div className="flex justify-between items-center mb-6 pl-1 mt-10">
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Notification Preferences</h3>
            </div>
            
            <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 divide-y divide-slate-50">
              
              <div className="p-8 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-[15px] text-slate-900">Appointment Confirmations</h4>
                  <p className="text-[13px] font-medium text-slate-500 mt-1.5">Send instant alerts for new bookings</p>
                </div>
                {/* Custom Toggle Switch */}
                <div className="w-12 h-6 bg-[#006b5f] rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                </div>
              </div>

              <div className="p-8 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-[15px] text-slate-900">Patient Reports</h4>
                  <p className="text-[13px] font-medium text-slate-500 mt-1.5">Daily summary of lab results and updates</p>
                </div>
                <div className="w-12 h-6 bg-[#006b5f] rounded-full relative cursor-pointer shadow-inner">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                </div>
              </div>

              <div className="p-8 flex items-center justify-between opacity-60">
                <div>
                  <h4 className="font-extrabold text-[15px] text-slate-900">Billing Invoices</h4>
                  <p className="text-[13px] font-medium text-slate-500 mt-1.5">Notify when payment cycles complete</p>
                </div>
                <div className="w-12 h-6 bg-slate-200 border border-slate-300 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                </div>
              </div>

            </div>
          </section>

          {/* Security & Access Control */}
          <section className={activeSection !== 'security' && activeSection !== 'profile' && activeSection !== 'all' ? 'hidden' : 'block'}>
            <div className="flex justify-between items-center mb-6 pl-1 mt-10">
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">Security & Access Control</h3>
            </div>
            
            <div className="space-y-6">
              
              <div className="bg-[#f0fbf9] border border-primary/20 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[15px] text-slate-900 flex items-center gap-2">
                      Two-Factor Authentication
                    </h4>
                    <p className="text-[13px] font-medium text-slate-600 mt-1 max-w-sm leading-relaxed">Enhance your login security by adding an extra layer of protection.</p>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-xl shadow-sm whitespace-nowrap">
                  Enable 2FA
                </button>
              </div>

              <div className="bg-white rounded-[24px] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-6 md:p-8">
                <div className="flex gap-4 items-start border-b border-slate-100 pb-6 mb-6">
                  <MonitorSmartphone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-[15px] text-slate-900">Session Management</h4>
                    <p className="text-[13px] font-medium text-slate-500 mt-1">Review your active logged-in devices.</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between ml-9">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-900">Chrome on macOS (Current Session)</p>
                      <p className="text-[12px] font-bold text-slate-400 mt-1">IP: 192.168.1.1 • Last Active: Now</p>
                    </div>
                  </div>
                  <button className="text-[13px] font-bold text-rose-500 hover:text-rose-600">Terminate</button>
                </div>
              </div>

            </div>
          </section>

          {/* User Roles & Access */}
          <section className={activeSection !== 'roles' && activeSection !== 'profile' && activeSection !== 'all' ? 'hidden' : 'block'}>
            <div className="flex justify-between items-center mb-6 pl-1 mt-10">
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight">User Roles & Access</h3>
              <button className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-900 hover:text-primary uppercase tracking-widest bg-[#006b5f]/5 px-4 py-2 rounded-lg">
                <UserPlus className="w-3.5 h-3.5" /> Add User
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#f8f9ff] rounded-[24px] border border-slate-100 p-6 h-full flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Administrator</span>
                <h4 className="font-extrabold text-[16px] text-slate-900 mb-1">Full System Control</h4>
                <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-6">Can manage clinical data, staff roles, billing, and system-wide settings.</p>
                <div className="mt-auto flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#006b5f] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#f8f9ff]">A</div>
                  <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs ring-2 ring-[#f8f9ff]">SR</div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs ring-2 ring-[#f8f9ff]">+1</div>
                </div>
              </div>

              <div className="bg-[#f8f9ff] rounded-[24px] border border-slate-100 p-6 h-full flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">Practitioner</span>
                <h4 className="font-extrabold text-[16px] text-slate-900 mb-1">Clinical Operations</h4>
                <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-6">Access to patient records, schedules, and medical history tools.</p>
                <div className="mt-auto flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#f8f9ff]">Dr</div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#f8f9ff]">M</div>
                  <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs ring-2 ring-[#f8f9ff]">K</div>
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs ring-2 ring-[#f8f9ff]">+4</div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 px-6 md:px-12 flex items-center justify-end gap-4 z-40 transform translate-y-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] delay-300 transition-all">
        <button className="px-6 py-3 font-bold text-[14px] text-slate-500 hover:text-slate-800 transition-colors">
          Discard Changes
        </button>
        <button className="px-8 py-3 bg-primary hover:bg-[#00ba94] text-white font-bold text-[14px] rounded-xl shadow-lg shadow-primary/50/30 transition-all active:scale-95">
          Save Configuration
        </button>
      </div>

    </div>
  );
}
