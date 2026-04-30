import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-background flex justify-center px-4">
      <div className={`w-full max-w-[900px] bg-gradient-to-br from-primary/5 via-blue-500/5 to-primary/5 dark:from-primary/10 dark:via-blue-500/10 dark:to-primary/10 rounded-[32px] px-8 py-16 text-center border border-primary/10 dark:border-primary/20 shadow-lg hover:shadow-xl transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
          Are You a Clinic Owner?
        </h2>
        <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join our network of top-rated healthcare providers. Manage appointments, 
          grow your practice, and deliver better patient experiences.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/register-clinic"
            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold px-8 py-3.5 rounded-full transition-all duration-200 active:scale-95 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
          >
            Partner With Us
          </Link>
          <Link 
            to="/search"
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-8 py-3.5 rounded-full transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
          >
            Browse as Patient
          </Link>
        </div>
      </div>
    </section>
  );
}
