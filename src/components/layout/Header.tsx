import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Menu, X, LogOut, Building2, CalendarCheck, UserCircle } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, profile, hasRole, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="container flex h-20 items-center justify-between">
        
        {/* Minimal Logo with Favicon */}
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
           <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-primary/10 group-hover:scale-105 transition-transform duration-300 p-1.5">
             <img src="/favicon.ico" alt="WellSathi Logo" className="w-full h-full object-contain" />
           </div>
           <span className="text-[20px] font-black text-slate-900 tracking-tight">
             WellSathi
           </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/search" className="text-[14.5px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
            Find Clinics
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors outline-none">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-[13px] font-black text-primary">
                      {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="font-bold text-[14px] text-slate-700">{profile?.name || 'User'}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-100 shadow-xl">
                {hasRole('admin') ? (
                  <DropdownMenuItem asChild className="font-bold text-slate-600">
                    <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : hasRole('clinic') ? (
                  <DropdownMenuItem asChild className="font-bold text-slate-600">
                    <Link to="/dashboard/clinic" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      Clinic Dashboard
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem asChild className="font-bold text-slate-600">
                      <Link to="/dashboard/user" className="flex items-center gap-2 cursor-pointer">
                        <CalendarCheck className="h-4 w-4 text-slate-400" />
                        My Appointments
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="font-bold text-slate-600">
                      <Link to="/dashboard/user?tab=profile" className="flex items-center gap-2 cursor-pointer">
                        <UserCircle className="h-4 w-4 text-slate-400" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-red-500 font-bold cursor-pointer focus:bg-red-50 focus:text-red-600">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-[14.5px] font-bold text-slate-600 hover:text-slate-900 transition-colors px-2">
                Sign In
              </Link>
              <Link to="/auth?mode=signup" className="bg-primary hover:bg-primary/90 text-white text-[14.5px] font-bold px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-md shadow-primary/50/20">
                Get Started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white absolute top-20 left-0 right-0 shadow-lg">
          <nav className="container py-6 flex flex-col gap-2">
            <Link
              to="/search"
              className="px-4 py-3 text-[15px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Clinics
            </Link>
            
            {user ? (
              <>
                {hasRole('admin') ? (
                  <Link
                    to="/admin"
                    className="px-4 py-3 text-[15px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Building2 className="h-5 w-5" />
                    Admin Dashboard
                  </Link>
                ) : hasRole('clinic') ? (
                  <Link
                    to="/dashboard/clinic"
                    className="px-4 py-3 text-[15px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Building2 className="h-5 w-5" />
                    Clinic Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/dashboard/user"
                      className="px-4 py-3 text-[15px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <CalendarCheck className="h-5 w-5" />
                      My Appointments
                    </Link>
                    <Link
                      to="/dashboard/user?tab=profile"
                      className="px-4 py-3 text-[15px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserCircle className="h-5 w-5" />
                      My Profile
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 text-[15px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 w-full text-left mt-2"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
                <Link
                  to="/auth"
                  className="px-4 py-3 text-[15px] font-bold text-slate-700 bg-slate-50 text-center rounded-xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="px-4 py-3 text-[15px] font-bold text-white bg-primary text-center rounded-xl shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
