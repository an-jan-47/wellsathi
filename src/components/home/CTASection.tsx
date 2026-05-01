import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, ArrowRight } from 'lucide-react';

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const handleFindClinics = useCallback(() => {
    navigate('/search');
  }, [navigate]);

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-background flex justify-center px-4">
      <div className={`w-full max-w-[900px] bg-gradient-to-br from-primary/5 via-teal-500/5 to-primary/5 dark:from-primary/10 dark:via-teal-500/10 dark:to-primary/10 rounded-[32px] px-8 py-16 text-center border border-primary/10 dark:border-primary/20 shadow-lg hover:shadow-xl transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <h2 className="text-[26px] sm:text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
          Your neighbourhood clinic is already on WellSathi.
        </h2>
        <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
          Search by area. See fees. Book in under a minute.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleFindClinics}
            className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white font-bold px-8 py-3.5 rounded-full transition-all duration-200 active:scale-95 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 flex items-center gap-2 group"
          >
            <Search className="h-4 w-4 stroke-[2.5]" />
            Find Clinics Near Me
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
        {/* Secondary — clinic owner link */}
        <p className="mt-8 text-[13px] text-slate-400 dark:text-slate-500 font-medium">
          Are you a clinic?{' '}
          <Link 
            to="/register-clinic"
            className="text-primary hover:text-primary/80 font-bold transition-colors underline underline-offset-2"
          >
            List your clinic →
          </Link>
        </p>
      </div>
    </section>
  );
}
