import { useEffect, useState } from 'react';
import { getPopularClinics } from '@/services/clinicService';
import type { Clinic } from '@/types';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { Sparkles } from 'lucide-react';
import { ClinicCardSkeleton } from '@/components/common/SkeletonLoaders';

export function PopularClinicsSection() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopular() {
      try {
        const data = await getPopularClinics(4);
        setClinics(data);
      } catch (error) {
        console.error('Failed to fetch popular clinics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPopular();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white dark:bg-background">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <h2 className="text-[28px] md:text-[36px] font-black text-slate-900 dark:text-white text-center tracking-tight">
              Most popular clinics near you right now
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-10 max-w-2xl mx-auto text-[15px] font-medium leading-relaxed">
            Ranked by how often patients book them, not by how much clinics pay us
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ClinicCardSkeleton />
            <ClinicCardSkeleton />
            <ClinicCardSkeleton />
            <ClinicCardSkeleton />
          </div>
        </div>
      </section>
    );
  }

  if (clinics.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white dark:bg-background">
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-8 justify-center animate-in slide-in-from-bottom-4 duration-700">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-[28px] md:text-[36px] font-black text-slate-900 dark:text-white text-center tracking-tight">
            Most popular clinics near you right now
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-10 max-w-2xl mx-auto text-[15px] font-medium leading-relaxed animate-in slide-in-from-bottom-5 duration-700 delay-100 fill-mode-both">
          Ranked by how often patients book them, not by how much clinics pay us
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {clinics.map((clinic, index) => (
            <div
              key={clinic.id}
              className="animate-in slide-in-from-bottom-6 duration-700 fill-mode-both hover:scale-[1.02] transition-transform duration-300"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <ClinicCard clinic={clinic} layout="vertical" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
