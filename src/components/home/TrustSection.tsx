import { useEffect, useRef, useState } from 'react';
import { DollarSign, Clock, ShieldCheck, Phone } from 'lucide-react';

const TRUST_FEATURES = [
  {
    icon: DollarSign,
    title: 'No hidden consultation fees',
    description: 'The price you see is the price you pay. No surprises at the clinic.',
    color: 'from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Clock,
    title: 'Real-time slot availability',
    description: 'See exactly when clinics are available. No more calling to check.',
    color: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: ShieldCheck,
    title: 'Only verified clinics listed',
    description: 'Every clinic is vetted and verified before appearing on our platform.',
    color: 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: Phone,
    title: 'Book without calling',
    description: 'Complete your booking online in seconds. No phone calls needed.',
    color: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
];

export function TrustSection() {
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
      id="why-trust"
      className="py-16 md:py-20 bg-slate-50 dark:bg-slate-900/50"
      aria-label="Why people trust WellSathi"
    >
      <div className="container max-w-[1100px]">
        {/* Section header */}
        <div
          className={`text-center mb-12 md:mb-14 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-[28px] md:text-[36px] font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Why people trust WellSathi
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto text-[15px] leading-relaxed">
            Transparent pricing, verified clinics, and real-time availability — all in one place.
          </p>
        </div>

        {/* Trust features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {TRUST_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex items-start gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg dark:shadow-none hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-300 group ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              {/* Icon container */}
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shrink-0 group-hover:-translate-y-1 group-hover:shadow-lg transition-all duration-300`}
              >
                <feature.icon
                  className={`h-7 w-7 ${feature.iconColor} stroke-[2] group-hover:scale-110 transition-transform duration-300`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[17px] md:text-[18px] font-extrabold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-[13px] md:text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
