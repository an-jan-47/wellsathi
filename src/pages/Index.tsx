import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';

// Lazy load all sections for better performance
const BrowseBySpecialty = lazy(() => import('@/components/home/BrowseBySpecialty').then(m => ({ default: m.BrowseBySpecialty })));
const PopularClinicsSection = lazy(() => import('@/components/home/PopularClinicsSection').then(m => ({ default: m.PopularClinicsSection })));
const FeaturesSection = lazy(() => import('@/components/home/FeaturesSection').then(m => ({ default: m.FeaturesSection })));
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

  useDocumentTitle('Find & Book Top-Rated Clinics');

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
        <FeaturesSection />
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
