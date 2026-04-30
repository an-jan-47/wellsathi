import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function Footer() {
  const { user } = useAuthStore();

  return (
    <footer className="border-t border-border bg-gradient-to-b from-white to-slate-50 dark:from-background dark:to-slate-900/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand with enhanced styling */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group cursor-pointer">
               <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 p-1.5 shadow-sm">
                 <img src="/favicon.ico" alt="WellSathi Logo" className="w-full h-full object-contain" />
               </div>
               <span className="text-[20px] font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary transition-colors duration-300">
                 WellSathi
               </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-4 leading-relaxed">
              Your trusted companion for finding the best healthcare. Book appointments with top clinics near you in seconds.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 mb-4">
              <a href="#" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 group">
                <Facebook className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 group">
                <Twitter className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 group">
                <Instagram className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 group">
                <Linkedin className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-[15px]">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  Find Clinics
                </Link>
              </li>
              <li>
                <a href="#specialties" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  Specialties
                </a>
              </li>
              <li>
                <a href="#why-wellsathi" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  About Us
                </a>
              </li>
              {!user && (
                <>
                  <li>
                    <Link to="/auth" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth?mode=signup" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                      Register
                    </Link>
                  </li>
                </>
              )}
              {user && (
                <li>
                  <Link to="/dashboard/user" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                    My Appointments
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Popular Specialties */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-[15px]">Popular Specialties</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search?specialty=General%20Medicine" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  General Medicine
                </Link>
              </li>
              <li>
                <Link to="/search?specialty=Dentistry" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  Dentistry
                </Link>
              </li>
              <li>
                <Link to="/search?specialty=Cardiology" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  Cardiology
                </Link>
              </li>
              <li>
                <Link to="/search?specialty=Dermatology" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  Dermatology
                </Link>
              </li>
              <li>
                <Link to="/search?specialty=Pediatrics" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  Pediatrics
                </Link>
              </li>
              <li>
                <Link to="/search?specialty=Orthopedics" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block">
                  Orthopedics
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-foreground mb-4 text-[15px]">Get In Touch</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:support@wellsathi.in" className="flex items-start gap-2.5 text-muted-foreground hover:text-primary transition-all duration-200 group">
                  <Mail className="h-4 w-4 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                  <span>support@wellsathi.in</span>
                </a>
              </li>
              <li>
                <a href="tel:+918434668180" className="flex items-start gap-2.5 text-muted-foreground hover:text-primary transition-all duration-200 group">
                  <Phone className="h-4 w-4 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                  <span>+91 8434668180</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Delhi, India</span>
              </li>
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>24/7 Support Available</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} WellSathi. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
