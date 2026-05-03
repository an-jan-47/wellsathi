import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Loader2, Navigation, Stethoscope, CheckCircle } from 'lucide-react';
import { getUniqueCities } from '@/services/clinicService';
import { SPECIALIZATIONS } from '@/constants';
import { getSpecialtyIcon } from '@/constants/icons';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function HeroSection() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');

  // Autocomplete & logic states
  const [dbCities, setDbCities] = useState<string[]>([]);
  const [searchLocations, setSearchLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [geolocationRequested, setGeolocationRequested] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const specialtyRef = useRef<HTMLDivElement>(null);
  
  const debouncedLocation = useDebouncedValue(location, 400);

  // Fetch db cities on mount
  useEffect(() => {
    getUniqueCities()
      .then((data) => setDbCities(data))
      .catch(console.error);
  }, []);

  // Fetch from global location API if user types
  useEffect(() => {
    if (debouncedLocation.length > 2) {
      setIsLoadingLocation(true);
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          debouncedLocation + ' Delhi NCR'
        )}&countrycodes=in&featuretype=city&limit=8`
      )
        .then((res) => res.json())
        .then((data) => {
          const places = data
            .map((d: any) => d.display_name.split(',')[0].trim())
            .filter((place: string) => {
              const lowerPlace = place.toLowerCase();
              const delhiNCRKeywords = ['delhi', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad', 'greater noida', 'dwarka', 'rohini', 'janakpuri', 'saket', 'vasant kunj', 'nehru place', 'connaught place', 'karol bagh'];
              return delhiNCRKeywords.some(keyword => lowerPlace.includes(keyword));
            });
          setSearchLocations(Array.from(new Set(places as string[])));
          setIsLoadingLocation(false);
        })
        .catch((err) => {
          console.error('Location search failed', err);
          setIsLoadingLocation(false);
        });
    } else {
      setSearchLocations([]);
    }
  }, [debouncedLocation]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (specialtyRef.current && !specialtyRef.current.contains(event.target as Node)) {
        setShowSpecialtyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback((e?: React.FormEvent, overrideSpecialty?: string) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    const specialtyToUse = overrideSpecialty || specialty;
    if (specialtyToUse) params.set('specialty', specialtyToUse);
    navigate(`/search?${params.toString()}`);
  }, [location, specialty, navigate]);

  const handleGeolocation = useCallback(() => {
    if (location || geolocationRequested) return;

    setGeolocationRequested(true);
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`
            );
            const data = await res.json();
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county;
            if (city) {
              setLocation(city);
            }
          } catch (error) {
            console.error('Reverse geocoding failed', error);
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.warn('Geolocation denied or error:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  }, [location, geolocationRequested]);

  const filteredCities = useMemo(() => {
    return location.length > 2 
      ? searchLocations 
      : dbCities.filter((c) => c.toLowerCase().includes(location.toLowerCase()));
  }, [location, searchLocations, dbCities]);

  const filteredSpecialties = useMemo(() => {
    return SPECIALIZATIONS.filter((s) =>
      s.toLowerCase().includes(specialty.toLowerCase())
    );
  }, [specialty]);

  return (
    <section className="relative bg-slate-50 dark:bg-background pt-16 pb-10 md:pt-20 md:pb-16 min-h-[460px] md:min-h-[580px] overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 top-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-slate-50 to-slate-50 dark:from-primary/10 dark:via-background dark:to-background pointer-events-none animate-gradient"></div>
      
      {/* Floating orbs for depth */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
      <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float-slower pointer-events-none"></div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Improved trust strip with check icons */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300 text-[11px] sm:text-[12px] font-bold tracking-wide mb-6 animate-fade-in cursor-default">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Fees shown upfront</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>No signup required</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Verified clinics only</span>
            </span>
          </div>

          {/* Main headline — transparency positioning */}
          <h1 className="text-[34px] sm:text-[46px] md:text-[60px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-5 animate-in slide-in-from-bottom-4 duration-700 ease-out">
            Find a clinic near you.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-500 to-primary animate-gradient-x block sm:inline">
              See the fee before you go.
            </span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-slate-600 dark:text-slate-400 font-medium max-w-xl mx-auto mb-8 animate-in slide-in-from-bottom-5 duration-700 delay-150 fill-mode-both">
            Search by area or specialty. Fees shown upfront. Book in under a minute.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            aria-label="Search for clinics"
            className="flex flex-col md:flex-row items-center max-w-[700px] mx-auto bg-white dark:bg-slate-800 rounded-2xl md:rounded-full p-2 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 animate-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both relative hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.4)] transition-all duration-300 gap-2 md:gap-0 group"
          >
            {/* Location Input */}
            <div
              ref={locationRef}
              className="relative flex-1 w-full md:border-r border-slate-100 dark:border-slate-700 flex items-center pr-4 rounded-xl md:rounded-none bg-slate-50 dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent"
            >
              <div className="pl-6 pr-2 py-4 flex items-center justify-center">
                {isLoadingLocation ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <MapPin className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <input
                id="location-search"
                aria-label="Enter your area"
                placeholder="Your area — e.g., Noida, Dwarka"
                value={location}
                onFocus={() => {
                  setShowLocationDropdown(true);
                  handleGeolocation();
                }}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowLocationDropdown(true);
                }}
                className="w-full bg-transparent text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none h-full py-4"
              />
              {/* Location Dropdown */}
              {showLocationDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar z-[9999] py-2">
                  <div
                    className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-primary text-sm font-medium border-b border-slate-50 dark:border-slate-700"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setGeolocationRequested(false);
                      handleGeolocation();
                    }}
                  >
                    <Navigation className="h-4 w-4 shrink-0" />
                    Use my current location
                  </div>
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <div
                        key={city}
                        className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setLocation(city);
                          setShowLocationDropdown(false);
                        }}
                      >
                        {city}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">
                      {location.length > 0 ? "That's okay — just type your neighbourhood." : 'Type your area or neighbourhood'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Specialty Input */}
            <div
              ref={specialtyRef}
              className="relative flex-1 w-full flex items-center pr-4 rounded-xl md:rounded-none bg-slate-50 dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent"
            >
              <div className="pl-6 pr-2 py-4 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="specialty-search"
                aria-label="What do you need?"
                placeholder="What do you need? e.g., Dentist"
                value={specialty}
                onFocus={() => setShowSpecialtyDropdown(true)}
                onChange={(e) => {
                  setSpecialty(e.target.value);
                  setShowSpecialtyDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && specialty) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="w-full bg-transparent text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none h-full py-4"
              />
              {/* Specialty Dropdown */}
              {showSpecialtyDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar z-[9999] py-2">
                  {filteredSpecialties.length > 0 ? (
                    filteredSpecialties.map((spec) => {
                      const Icon = getSpecialtyIcon(spec);
                      return (
                        <div
                          key={spec}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSpecialty(spec);
                            setShowSpecialtyDropdown(false);
                            handleSearch(undefined, spec);
                          }}
                        >
                          <Icon className="w-4 h-4 text-primary opacity-70 shrink-0" />
                          {spec}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">
                      No specialties found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              aria-label="Find clinics"
              className="w-full md:w-auto md:min-w-[160px] mt-2 md:mt-0 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-white font-bold text-[15px] rounded-xl md:rounded-full px-8 py-4 md:py-4 flex items-center justify-center gap-2 transition-all duration-200 will-change-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/30 dark:shadow-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none hover:shadow-xl hover:shadow-primary/40 dark:hover:shadow-primary/30"
            >
              <Search className="h-4 w-4 stroke-[3]" />
              Find Clinics
            </button>
          </form>

          {/* Microcopy under search — reduces friction */}
          <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium mt-4 animate-in slide-in-from-bottom-6 duration-700 delay-400 fill-mode-both">
            No account needed to browse · Cancellation is free
          </p>
        </div>
      </div>
    </section>
  );
}
