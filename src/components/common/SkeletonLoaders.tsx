import { Skeleton } from "@/components/ui/skeleton";

// Clinic Card Skeleton
export function ClinicCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

// Appointment Card Skeleton
export function AppointmentCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// Doctor Card Skeleton
export function DoctorCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

// Search Results Skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <ClinicCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Profile Form Skeleton
export function ProfileFormSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  );
}

// Booking Sidebar Skeleton
export function BookingSidebarSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

// Time Slot Skeleton
export function TimeSlotSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[...Array(9)].map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 p-4 border-b border-border">
      {[...Array(columns)].map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// ─── Clinic Dashboard Skeletons ───────────────────────────────────────────────

export function ClinicOverviewStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-[20px] p-6 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ClinicAppointmentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 border border-border rounded-2xl">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-xl" />
    </div>
  );
}

export function ClinicDoctorCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[24px] p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}

export function ClinicPatientRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-24 hidden md:block" />
      <Skeleton className="h-4 w-24 hidden md:block" />
      <Skeleton className="h-6 w-16 rounded-lg" />
    </div>
  );
}

export function ClinicSlotRowSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-border items-center">
      <Skeleton className="col-span-3 h-4 w-20" />
      <Skeleton className="col-span-2 h-6 w-16 rounded-full" />
      <Skeleton className="col-span-3 h-10 rounded-xl" />
      <Skeleton className="col-span-3 h-10 rounded-xl" />
      <Skeleton className="col-span-1 h-8 w-8 rounded-lg mx-auto" />
    </div>
  );
}
