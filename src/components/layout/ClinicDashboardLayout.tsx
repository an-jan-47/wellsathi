import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  Stethoscope,
  Activity,
  BarChart,
  MessageSquare,
  Settings,
  Plus,
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Tab = 'overview' | 'appointments' | 'slots' | 'doctors' | 'services' | 'patients' | 'analytics' | 'reviews' | 'profile';

interface ClinicDashboardLayoutProps {
  children: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  clinic: any;
  user: any;
}

export function ClinicDashboardLayout({ children, activeTab, onTabChange, clinic, user }: ClinicDashboardLayoutProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      queryClient.clear();
      navigate('/auth', { replace: true });
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const navItems = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'appointments' as Tab, label: 'Appointments', icon: CalendarCheck },
    { id: 'slots' as Tab, label: 'Doctor Schedules', icon: CalendarDays },
    { id: 'doctors' as Tab, label: 'Doctors', icon: Stethoscope },
    { id: 'services' as Tab, label: 'Services', icon: Activity },
    { id: 'patients' as Tab, label: 'Patients', icon: Users }, // Patient tab if added in future
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart },
    { id: 'reviews' as Tab, label: 'Reviews', icon: MessageSquare },
    { id: 'profile' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background dark:bg-background">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed h-screen ${isDesktopCollapsed ? 'w-20' : 'w-64'} left-0 top-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col p-4 space-y-2 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-2 py-4 mb-4 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg flex-shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            {!isDesktopCollapsed && (
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none truncate max-w-[130px]">{clinic?.name || 'Clinic'}</h1>
                <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                  {clinic?.is_approved ? 'APPROVED STATUS' : 'PENDING'}
                </span>
              </div>
            )}
          </div>
          <button 
            className="hidden lg:flex absolute -right-3 top-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full p-1 z-50" 
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          >
            {isDesktopCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
          <button className="lg:hidden text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pb-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                title={isDesktopCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isDesktopCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 text-sm transition-all duration-300 ease-in-out ${
                  isActive
                    ? 'font-bold bg-white dark:bg-slate-800 text-primary shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none rounded-xl border border-slate-100 dark:border-slate-700'
                    : 'font-medium text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''} flex-shrink-0`} />
                {!isDesktopCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800">
          <Button 
            onClick={() => { 
              onTabChange('services'); 
              setIsMobileMenuOpen(false);
              setTimeout(() => window.dispatchEvent(new CustomEvent('open-add-service-modal')), 100);
            }}
            title={isDesktopCollapsed ? "Add Service" : undefined}
            className={`w-full ${isDesktopCollapsed ? 'py-4 px-0' : 'py-6'} bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center gap-2 shadow-md`}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!isDesktopCollapsed && <span>Add Service</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${isDesktopCollapsed ? 'lg:ml-20' : 'lg:ml-64'} flex flex-col min-h-screen overflow-x-hidden transition-all duration-300`}>
        {/* TopNavBar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-sm flex items-center px-4 lg:px-8 py-3 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="lg:hidden p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-xl font-bold text-primary tracking-wider hidden sm:block">WellSathi</span>
            
            <div className="relative w-full max-w-xs md:max-w-md lg:ml-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search data..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <button className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors relative hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <button className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block">
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
            
            <Button 
              onClick={() => navigate(clinic?.id ? `/book/${clinic.id}` : '/book')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Appointment</span>
              <span className="sm:hidden">Add</span>
            </Button>
            
            <button 
              title="Logout"
              onClick={handleLogout}
              className="p-2 ml-1 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-rose-500 rounded-full transition-colors relative"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
