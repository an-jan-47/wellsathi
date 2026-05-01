import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';

// Lazy load all sections for better performance
const BrowseBySpecialty = lazy(() => import('@/components/home/BrowseBySpecialty').then(m => ({ default: m.BrowseBySpecialty })));
const PopularClinicsSection = lazy(() => import('@/components/home/PopularClinicsSection').then(m => ({ default: m.PopularClinicsSection })));
const HowItWorksSection = lazy(() => import('@/components/home/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })));
const TrustSection = lazy(() => import('@/components/home/TrustSection').then(m => ({ default: m.TrustSection })));
const CTASection = lazy(() => import('@/components/home/CTASection').then(m => ({ default: m.CTASection })));

import { useAuthStore } from '@/stores/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Skeleton loader component
const SectionSkeleton = ({ height = '200px' }: { height?: string }) => (
  <div 
    className="w-full animate-pulse bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900/50 dark:via-slate-800/50 dark:to-slate-900/50" 
    style={{ height }}
  />
);

const Index = () => {
  const navigate = useNavigate();
  const { user, roles, isInitialized, isLoading } = useAuthStore();

  useDocumentTitle('Find & Book Clinics — Fees Shown Upfront');

  // Redirect clinic users to their dashboard
  useEffect(() => {
    if (user && isInitialized && !isLoading) {
      if (roles.includes('clinic')) {
        navigate('/dashboard/clinic');
      } else if (roles.includes('admin')) {
        navigate('/admin');
      }
      // Regular users stay on the home page
    }
  }, [user, roles, isInitialized, isLoading, navigate]);

  return (
    <Layout>
      <HeroSection />
      
      <Suspense fallback={<SectionSkeleton height="300px" />}>
        <BrowseBySpecialty />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton height="500px" />}>
        <PopularClinicsSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton height="400px" />}>
        <HowItWorksSection />
      </Suspense>
      
      <Suspense fallback={<SectionSkeleton height="350px" />}>
        <TrustSection />
      </Suspense>
      
      {!user && (
        <Suspense fallback={<SectionSkeleton height="300px" />}>
          <CTASection />
        </Suspense>
      )}
    </Layout>
  );
};

export default Index;
