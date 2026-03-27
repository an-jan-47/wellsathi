import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { useSearchClinics } from '@/hooks/queries/useClinics';
import { SPECIALIZATIONS } from '@/constants';
import { Search as SearchIcon, MapPin, SlidersHorizontal, Loader2, List, Map, Star, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { SortOption } from '@/constants';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    specialty: searchParams.get('specialty') || '',
    maxFees: searchParams.get('maxFees') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: (searchParams.get('sortBy') as SortOption) || 'rating',
    query: searchParams.get('query') || '',
  });

  const searchFilters = {
    location: searchParams.get('location') || undefined,
    specialty: searchParams.get('specialty') || undefined,
    maxFees: searchParams.get('maxFees') || undefined,
    minRating: searchParams.get('minRating') || undefined,
    sortBy: (searchParams.get('sortBy') as SortOption) || 'rating',
    query: searchParams.get('query') || undefined,
  };

  const { data: clinics = [], isLoading } = useSearchClinics(searchFilters);

  const updateParams = (updates: any) => {
     const newFilters = { ...filters, ...updates };
     setFilters(newFilters);
     const params = new URLSearchParams();
     Object.entries(newFilters).forEach(([key, val]) => {
        if (val && val !== 'rating' && val !== 'all') params.set(key, val as string);
     });
     setSearchParams(params);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#fafafa] font-sans">
        
        {/* Header Section */}
        <div className="bg-white pt-10 pb-6 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.03)] relative z-10">
          <div className="container max-w-[1400px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <span className="text-[11px] font-black text-primary uppercase tracking-widest">Medical Directory</span>
                <h1 className="text-[36px] md:text-[42px] font-black text-slate-900 tracking-tight leading-tight mt-1 mb-2">Explore Specialized Clinics</h1>
                <p className="text-[15px] font-medium text-slate-500 max-w-xl">
                  Discover the highest-rated medical facilities tailored to your specific health journey.
                </p>
              </div>
              
              {/* View Toggles */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shrink-0">
                <button 
                   onClick={() => setViewMode('list')}
                   className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                   <List className="w-4 h-4" /> List View
                </button>
                <button 
                   onClick={() => setViewMode('map')}
                   className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all ${viewMode === 'map' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                   <Map className="w-4 h-4" /> Map View
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
               <div className="relative flex-1 min-w-[300px]">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                     value={filters.query}
                     onChange={e => updateParams({ query: e.target.value })}
                     placeholder="Search by clinic name or specialty..."
                     className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-[14.5px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/50/10"
                  />
               </div>
               
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-[14px] font-bold text-slate-700 outline-none focus:border-primary cursor-pointer hover:bg-slate-50 transition-colors">
                     {filters.specialty || 'Specialty'} <ChevronDown className="w-4 h-4 text-slate-400" />
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto rounded-2xl shadow-xl border-slate-100 p-2" align="start">
                    <DropdownMenuItem onClick={() => updateParams({ specialty: '' })} className="font-bold py-2.5 px-4 cursor-pointer text-slate-600 focus:bg-primary/5 focus:text-primary rounded-xl">
                      All Specialties
                    </DropdownMenuItem>
                    {SPECIALIZATIONS.map(s => (
                       <DropdownMenuItem key={s} onClick={() => updateParams({ specialty: s })} className={`font-bold py-2.5 px-4 cursor-pointer rounded-xl ${filters.specialty === s ? 'bg-primary/10 text-primary' : 'text-slate-600 focus:bg-primary/5 focus:text-primary'}`}>
                          {s}
                       </DropdownMenuItem>
                    ))}
                 </DropdownMenuContent>
               </DropdownMenu>

               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-[14px] font-bold text-slate-700 outline-none focus:border-primary cursor-pointer hover:bg-slate-50 transition-colors">
                     <Star className="w-4 h-4 text-primary fill-primary" />
                     {filters.minRating ? `${filters.minRating}+` : 'Rating'} <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-44 rounded-2xl shadow-xl border-slate-100 p-2" align="start">
                    <DropdownMenuItem onClick={() => updateParams({ minRating: '' })} className="font-bold py-2.5 px-4 cursor-pointer text-slate-600 focus:bg-primary/5 focus:text-primary rounded-xl">
                      Any Rating
                    </DropdownMenuItem>
                    {['4.5', '4.0'].map(r => (
                       <DropdownMenuItem key={r} onClick={() => updateParams({ minRating: r })} className={`font-bold py-2.5 px-4 cursor-pointer rounded-xl ${filters.minRating === r ? 'bg-primary/10 text-primary' : 'text-slate-600 focus:bg-primary/5 focus:text-primary'}`}>
                          {r}+
                       </DropdownMenuItem>
                    ))}
                 </DropdownMenuContent>
               </DropdownMenu>

               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-[14px] font-bold text-slate-700 outline-none focus:border-primary cursor-pointer hover:bg-slate-50 transition-colors">
                     <MapPin className="w-4 h-4 text-primary" />
                     {filters.location || 'Location'} <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                   </button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-48 rounded-2xl shadow-xl border-slate-100 p-2" align="start">
                    <DropdownMenuItem onClick={() => updateParams({ location: '' })} className="font-bold py-2.5 px-4 cursor-pointer text-slate-600 focus:bg-primary/5 focus:text-primary rounded-xl">
                      Any Location
                    </DropdownMenuItem>
                    {['Under 5 mi', 'Under 10 mi', 'Under 25 mi'].map(loc => (
                       <DropdownMenuItem key={loc} onClick={() => updateParams({ location: loc })} className={`font-bold py-2.5 px-4 cursor-pointer rounded-xl ${filters.location === loc ? 'bg-primary/10 text-primary' : 'text-slate-600 focus:bg-primary/5 focus:text-primary'}`}>
                          {loc}
                       </DropdownMenuItem>
                    ))}
                 </DropdownMenuContent>
               </DropdownMenu>

               <button className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl text-[14px] font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                 <SlidersHorizontal className="w-4 h-4 text-primary" /> All Filters
               </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="container max-w-[1400px] py-8">
          <div className="flex flex-col lg:flex-row gap-8">
             
             {/* Left Column: Listings */}
             <div className="flex-1 flex flex-col min-w-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : clinics.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {clinics.map(clinic => (
                      <ClinicCard key={clinic.id} clinic={clinic} />
                    ))}

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-2 mt-8 mb-12">
                       <button className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                       <button className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white font-bold shadow-md">1</button>
                       <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">2</button>
                       <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">3</button>
                       <button className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                      <SearchIcon className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-[22px] font-black text-slate-900 mb-2">No clinics found</h3>
                    <p className="text-[15px] font-medium text-slate-500 max-w-md mx-auto">
                      We couldn't find any medical facilities matching your specific criteria. Try expanding your search area or removing some filters.
                    </p>
                  </div>
                )}
             </div>

             {/* Right Column: Sidebar Map & CTA */}
             <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 space-y-6 hidden lg:block overflow-hidden relative">
                <div className="sticky top-[104px] space-y-6">
                   
                   {/* Static Map Widget Mockup */}
                   <div className="bg-white rounded-[32px] shadow-[0_8px_30px_-5px_rgba(0,0,0,0.03)] border border-slate-100/60 p-4 aspect-[4/3] flex flex-col">
                     <div className="flex-1 bg-slate-100 rounded-[20px] overflow-hidden relative">
                        {/* Grid Pattern overlay mimicking map */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-full shadow-lg shadow-primary/50/30 flex items-center justify-center animate-bounce">
                           <MapPin className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div className="absolute right-4 top-4 flex flex-col gap-2">
                           <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 font-bold hover:text-primary">+</button>
                           <button className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 font-bold hover:text-primary">-</button>
                        </div>
                     </div>
                     <button className="w-full mt-4 bg-primary/5 text-primary font-bold text-[14px] py-3 rounded-2xl hover:bg-primary/10 transition-colors">
                        ⛶ Expand to Fullscreen Map
                     </button>
                   </div>

                   {/* Needs a Specialist CTA */}
                   <div className="bg-primary rounded-[32px] p-8 shadow-xl shadow-primary/50/20 text-white relative overflow-hidden">
                     {/* Background decorative ring */}
                     <div className="absolute -right-16 -top-16 w-64 h-64 border-[40px] border-white/10 rounded-full pointer-events-none"></div>
                     
                     <h3 className="text-[24px] font-black leading-tight mb-2 relative z-10">Need a Specialist?</h3>
                     <p className="text-[14px] font-medium text-white/80 leading-relaxed mb-6 relative z-10">
                       Connect with top-tier practitioners in your area within 24 hours.
                     </p>

                     <div className="space-y-3 mb-8 relative z-10">
                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                           <img src="/favicon.ico" className="w-10 h-10 rounded-full bg-white object-cover p-1" />
                           <div>
                             <h4 className="font-bold text-[14px]">Dr. Elena Rodriguez</h4>
                             <p className="text-[11px] text-white/70 uppercase tracking-widest font-bold">Rheumatologist • 12 Years Exp.</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
                           <img src="/favicon.ico" className="w-10 h-10 rounded-full bg-white object-cover p-1" />
                           <div>
                             <h4 className="font-bold text-[14px]">Dr. Julian Vance</h4>
                             <p className="text-[11px] text-white/70 uppercase tracking-widest font-bold">Orthopedist • 8 Years Exp.</p>
                           </div>
                        </div>
                     </div>

                     <button className="w-full bg-white text-primary hover:bg-slate-50 font-black text-[15px] py-4 rounded-2xl shadow-lg transition-transform active:scale-95 relative z-10">
                       Find a Specialist
                     </button>
                   </div>

                </div>
             </div>
             
          </div>
        </div>

      </div>
    </Layout>
  );
}
