import { Link } from 'react-router-dom';

export function CTASection() {
  return (
    <section className="py-16 bg-white flex justify-center px-4">
      <div className="w-full max-w-[900px] bg-primary/5 rounded-[32px] px-8 py-16 text-center border border-primary/10 animate-in slide-in-from-bottom-10 duration-1000 ease-out">
        <h2 className="text-3xl font-black text-slate-900 mb-4">
          Are You a Clinic Owner?
        </h2>
        <p className="text-[15px] font-medium text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join our network of top-rated healthcare providers. Manage appointments, 
          grow your practice, and deliver better patient experiences.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/register-clinic"
            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3.5 rounded-full transition-all active:scale-95 shadow-lg shadow-primary/50/20"
          >
            Partner With Us
          </Link>
          <Link 
            to="/search"
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-8 py-3.5 rounded-full transition-all active:scale-95"
          >
            Browse as Patient
          </Link>
        </div>
      </div>
    </section>
  );
}
