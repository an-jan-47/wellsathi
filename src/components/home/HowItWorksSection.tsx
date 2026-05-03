import { useEffect, useRef, useState } from 'react';
import { Search, CalendarCheck, CheckCircle, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    number: '01',
    title: 'Search your area',
    description: 'Enter your city or area, pick a specialty or leave it open. See all nearby clinics with fees shown — no registration needed.',
    color: 'from-primary/10 to-teal-500/10 dark:from-primary/20 dark:to-teal-500/20',
    iconColor: 'text-primary',
  },
  {
    icon: CalendarCheck,
    number: '02',
    title: 'Pick a time',
    description: 'Each clinic shows real available slots. Choose what fits your day — morning, afternoon, or evening. No more calling ahead.',
    color: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: CheckCircle,
    number: '03',
    title: 'Visit without waiting',
    description: "You'll get a confirmation with the clinic address, time, and fee. Walk in at your time — no waiting room lottery.",
    color: 'from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
];

export function HowItWorksSection() {
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
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-20 md:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-background"
    >
      <div className="container max-w-[1100px]">
        {/* Section header */}
        <div
          className={`text-center mb-14 md:mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-[28px] md:text-[36px] font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Skip the waiting. Book in 3 simple steps.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto text-[15px] leading-relaxed">
            Easier than calling the clinic. Faster than walking in.
          </p>
        </div>

        {/* Steps with arrow connectors */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-8 md:gap-6">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex flex-col md:flex-row items-center md:items-start">
              {/* Step Card */}
              <div
                className={`relative z-10 flex flex-col items-center text-center group transition-all duration-700 flex-1 md:w-[280px] ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 150 + 200}ms` }}
              >
                {/* Step number + icon container */}
                <div className="relative mb-6">
                  {/* Outer ring */}
                  <div
                    className={`w-[88px] h-[88px] md:w-[96px] md:h-[96px] rounded-[28px] bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:-translate-y-1 group-hover:shadow-xl transition-all duration-300 ease-out border border-white/60 dark:border-slate-700/60 shadow-lg`}
                  >
                    <step.icon
                      className={`h-9 w-9 md:h-10 md:w-10 ${step.iconColor} stroke-[1.8] group-hover:scale-110 transition-transform duration-300`}
                    />
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-[18px] md:text-[20px] font-extrabold text-slate-900 dark:text-white mb-2.5 group-hover:text-primary transition-colors duration-300 leading-tight">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-[13px] md:text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[300px]">
                  {step.description}
                </p>
              </div>

              {/* Arrow connector - only show between steps, not after last step */}
              {index < STEPS.length - 1 && (
                <>
                  {/* Desktop arrow - horizontal */}
                  <div
                    className={`hidden md:flex items-center justify-center mx-4 mt-12 transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                    style={{ transitionDelay: `${index * 150 + 350}ms` }}
                  >
                    <div className="relative">
                      {/* Animated dashed line */}
                      <div className="w-12 h-[2px] bg-gradient-to-r from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-shimmer" />
                      </div>
                      {/* Arrow head */}
                      <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-pulse-soft" />
                    </div>
                  </div>

                  {/* Mobile arrow - vertical */}
                  <div
                    className={`md:hidden flex flex-col items-center my-6 transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: `${index * 150 + 350}ms` }}
                  >
                    <div className="relative flex flex-col items-center">
                      {/* Animated dashed line */}
                      <div className="w-[2px] h-12 bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-shimmer" />
                      </div>
                      {/* Arrow head */}
                      <ArrowRight className="w-5 h-5 text-primary rotate-90 animate-pulse-soft -mt-1" />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
