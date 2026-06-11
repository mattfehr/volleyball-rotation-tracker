import { useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { setDoc, doc } from 'firebase/firestore';

const HERO_IMAGE = "/hero-stadium.png";

export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = `${username}@vbrt.com`;

    try {
      if (isRegistering) {
        await setPersistence(auth, browserSessionPersistence);
        await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', auth.currentUser!.uid), { username });
      } else {
        await setPersistence(
          auth,
          keepLoggedIn ? browserLocalPersistence : browserSessionPersistence
        );
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const switchMode = () => {
    setIsRegistering(prev => !prev);
    setError(null);
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setKeepLoggedIn(false);
  };

  return (
    <div className="flex min-h-screen bg-surface font-sans text-on-surface overflow-hidden">

      {/* ── Left: Cinematic Hero Panel ── */}
      <section className="hidden lg:flex lg:w-[60%] xl:w-[65%] relative overflow-hidden bg-court-green">
        {/* Background image */}
        <img
          src={HERO_IMAGE}
          alt="Volleyball Stadium"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Green gradient overlay */}
        <div className="absolute inset-0 z-10 hero-overlay flex flex-col justify-between px-16 xl:px-24 py-12">
          {/* Top: Brand mark */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-athletic-orange rounded-lg flex items-center justify-center shadow-lg">
              <span
                className="material-symbols-outlined text-white text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sports_volleyball
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              VolleyTactics Pro
            </h1>
          </div>

          {/* Middle: Tagline + description + badge pills */}
          <div className="space-y-6">
            <h2 className="font-display text-5xl font-extrabold text-white leading-tight tracking-tight max-w-2xl">
              Precision Strategy,<br />
              <span className="text-athletic-orange">Championship Results.</span>
            </h2>
            <p className="text-white/80 text-lg max-w-xl leading-relaxed">
              The ultimate tactical command center for elite volleyball programs. Design rotations,
              analyze legality, and dominate the court with data-driven playbooks.
            </p>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span
                  className="material-symbols-outlined text-athletic-orange text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="text-white text-xs font-bold tracking-widest uppercase">
                  V-League Approved
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span
                  className="material-symbols-outlined text-athletic-orange text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  analytics
                </span>
                <span className="text-white text-xs font-bold tracking-widest uppercase">
                  Real-Time Stats
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: Social proof counters */}
          <div className="flex gap-12 border-t border-white/20 pt-8">
            <div>
              <div className="text-white text-xl font-bold">500+</div>
              <div className="text-white/60 text-xs uppercase tracking-widest">Pro Teams</div>
            </div>
            <div>
              <div className="text-white text-xl font-bold">12k+</div>
              <div className="text-white/60 text-xs uppercase tracking-widest">Tactical Drills</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Right: Form Panel ── */}
      <section className="w-full lg:w-[40%] xl:w-[35%] bg-surface-container-lowest flex flex-col justify-center px-8 sm:px-12 md:px-16 xl:px-20 py-12 relative overflow-y-auto shadow-2xl z-20">

        {/* Mobile-only brand header */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-athletic-orange rounded flex items-center justify-center">
            <span
              className="material-symbols-outlined text-white text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sports_volleyball
            </span>
          </div>
          <span className="font-display text-lg font-bold text-court-green">VolleyTactics Pro</span>
        </div>

        <div className="w-full max-w-md mx-auto space-y-8">

          {/* Form heading */}
          <header className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-on-surface">
              {isRegistering ? "Create Coach Account" : "Coach Login"}
            </h3>
            <p className="text-on-surface-variant text-base">
              {isRegistering
                ? "Enter your details to begin your tactical journey."
                : "Enter your credentials to access your playbook."}
            </p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="flex items-center gap-1.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[14px]">badge</span>
                Username
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-court-green transition-colors text-[20px]">
                  person
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="e.g. coach_smith"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 pl-11 text-sm focus:ring-2 focus:ring-court-green focus:border-court-green outline-none transition-all placeholder:text-outline"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="flex items-center gap-1.5 text-on-surface-variant text-xs font-bold uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-court-green transition-colors text-[20px]">
                  {isRegistering ? "lock" : "key"}
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 pl-11 pr-12 text-sm focus:ring-2 focus:ring-court-green focus:border-court-green outline-none transition-all placeholder:text-outline"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface-variant transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {isRegistering && (
                <p className="text-[11px] text-outline px-1">
                  Use a strong password you don't use elsewhere.
                </p>
              )}
            </div>

            {!isRegistering && (
              <div className="flex items-center gap-3">
                <input
                  id="remember"
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={e => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant text-athletic-orange focus:ring-athletic-orange/20 cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm cursor-pointer select-none">
                  Keep me logged in
                </label>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-error-red text-sm text-center">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-athletic-orange text-white font-semibold text-lg py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all duration-150"
            >
              {isRegistering ? "Create Account" : "Login"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          {/* Toggle: switch between Login / Register */}
          <footer className="pt-6 border-t border-outline-variant/40 space-y-4 text-center">
            <p className="text-on-surface-variant text-sm">
              {isRegistering ? "Already have an account?" : "New to VolleyTactics Pro?"}
            </p>
            <button
              type="button"
              onClick={switchMode}
              className="w-full border-2 border-court-green text-court-green font-semibold py-2.5 rounded-lg hover:bg-court-green hover:text-white transition-all duration-200 active:scale-95"
            >
              {isRegistering ? "Return to Login" : "Register New Account"}
            </button>
            <div className="flex justify-center gap-6 text-xs text-on-surface-variant/60">
              <a href="#" className="hover:text-court-green transition-colors">Terms</a>
              <a href="#" className="hover:text-court-green transition-colors">Privacy</a>
              <a href="#" className="hover:text-court-green transition-colors">Support</a>
            </div>
          </footer>

        </div>
      </section>

      {/* Ambient glow accents */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-athletic-orange/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 -z-10 w-64 h-64 bg-court-green/5 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
}
