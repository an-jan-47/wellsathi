import { CheckCircle2, Zap, ShieldCheck, Clock, Users, HeartPulse, Award, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const features = [
  {
    icon: CheckCircle2,
    title: 'Verified Clinics',
    description: 'Every clinic is thoroughly vetted to ensure you receive the highest standard of care and professionalism.',
    color: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Zap,
    title: 'Instant Booking',
    description: 'Book appointments in seconds with real-time availability. No more waiting on hold or playing phone tag.',
    color: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    description: 'Your health data is encrypted and stored securely with bank-level security, accessible only by you.',
    color: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Our dedicated support team is available round the clock to assist you with any queries or concerns.',
    color: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: Users,
    title: 'Expert Doctors',
    description: 'Access to a network of highly qualified and experienced healthcare professionals across specialties.',
    color: 'from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    icon: HeartPulse,
    title: 'Health Records',
    description: 'Keep all your medical records, prescriptions, and reports organized in one secure digital location.',
    color: 'from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
];

export function FeaturesSection() {
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
    <section ref={sectionRef} id="why-wellsathi" className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-background dark:to-slate-900/50">
      <div className="container max-w-[1200px]">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
            Why Choose WellSathi?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-[15px] leading-relaxed">
            Experience healthcare booking designed for your peace of mind with features that put you first.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className={`flex flex-col items-center group transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              {/* Enhanced floating animated icon container with unique colors */}
              <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 ${feature.iconColor} group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-300 ease-out group-hover:scale-110`}>
                <feature.icon className="h-8 w-8 stroke-[2.5] group-hover:rotate-6 transition-transform duration-300" />
              </div>
              <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[280px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
