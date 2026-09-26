import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail,
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Crown,
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthUser, UserRole } from '@/types/auth';
import { loginUser, registerUser } from '@/lib/auth';
import { toast } from 'sonner';

interface LoginProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign in fields
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('superadmin');

  // Visibility toggles
  // Reversed icon: when visible show Eye, when hidden show EyeOff
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signInIdentifier.trim()) {
      setErrorMessage('Please enter your username or email.');
      return;
    }
    if (!signInPassword.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser(signInIdentifier, signInPassword);
      toast.success(`Welcome back, ${user.name}! Logged in as ${user.role === 'superadmin' ? 'Super Admin' : 'Admin'}.`);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials or sign up.');
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!signUpUsername.trim()) {
      setErrorMessage('Please enter a username.');
      return;
    }
    if (signUpUsername.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }
    if (!signUpPassword) {
      setErrorMessage('Please create a password.');
      return;
    }
    if (signUpPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-type your password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await registerUser({
        name: signUpName,
        username: signUpUsername,
        email: signUpEmail,
        password: signUpPassword,
        role: signUpRole,
      });
      toast.success(`Account created successfully! Welcome, ${user.name}.`);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-white flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient Luxury Background Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[550px] h-[550px] bg-[#B08D57]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-[#B08D57]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-black/60 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B08D57] to-[#785D32] flex items-center justify-center shadow-lg shadow-[#B08D57]/20 border border-[#B08D57]/40">
            <span className="font-serif font-black text-xl text-white tracking-widest">J</span>
          </div>
          <div>
            <h1 className="text-xl font-serif tracking-[0.25em] text-[#E8D4B0] uppercase font-bold">
              Johya Fashions
            </h1>
            <p className="text-[10px] tracking-[0.25em] text-white/50 uppercase font-medium">
              Management Portal
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>Role-Based Access • Admin & Super Admin</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md">
          <div className="bg-[#141418]/95 backdrop-blur-xl border border-[#B08D57]/30 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 relative">
            
            {/* Top Accent Gold Line */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#B08D57] to-transparent" />

            {/* Mode Switcher: Sign In vs Sign Up */}
            <div className="bg-black/50 border border-white/10 rounded-2xl p-1 grid grid-cols-2 gap-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-[#B08D57] to-[#8C6D39] text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-[#B08D57] to-[#8C6D39] text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Account (Sign Up)
              </button>
            </div>

            {/* Title / Description */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B08D57]/15 border border-[#B08D57]/40 text-[#E8D4B0] text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{mode === 'signin' ? 'Management Access' : 'Create Custom Credentials'}</span>
              </div>
              <h2 className="text-2xl font-serif text-white tracking-wide font-normal">
                {mode === 'signin' ? 'Sign In to Dashboard' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-white/60 mt-1">
                {mode === 'signin'
                  ? 'Enter your username & password to access the dashboard'
                  : 'Register as an Admin or Super Admin with your own credentials'}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80">Username or Email</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="text"
                      required
                      value={signInIdentifier}
                      onChange={(e) => {
                        setSignInIdentifier(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Enter your username or email"
                      className="w-full bg-black/50 border-white/15 focus:border-[#B08D57] text-white pl-10 pr-4 py-5 rounded-xl text-sm placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/80">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => {
                        setSignInPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Enter your password"
                      className="w-full bg-black/50 border-white/15 focus:border-[#B08D57] text-white pl-10 pr-10 py-5 rounded-xl text-sm placeholder:text-white/30"
                    />
                    {/* Password Visibility Toggle - Reversed icon logic: when showPassword is true -> Eye, when false -> EyeOff */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#E8D4B0] transition-colors cursor-pointer"
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 bg-gradient-to-r from-[#B08D57] via-[#C39E67] to-[#B08D57] hover:brightness-110 text-black font-semibold rounded-xl text-sm shadow-lg shadow-[#B08D57]/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-black">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In & Open Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-white/50">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMessage(null);
                      }}
                      className="text-[#E8D4B0] hover:underline font-semibold cursor-pointer"
                    >
                      Create your own username & password
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/80">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => {
                        setSignUpName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="e.g. Saharsh Reddy"
                      className="w-full bg-black/50 border-white/15 focus:border-[#B08D57] text-white pl-10 pr-4 py-4.5 rounded-xl text-sm placeholder:text-white/30"
                    />
                  </div>
                </div>

                {/* Choose Username */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/80">Choose Username</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="text"
                      required
                      value={signUpUsername}
                      onChange={(e) => {
                        setSignUpUsername(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="e.g. myusername"
                      className="w-full bg-black/50 border-white/15 focus:border-[#B08D57] text-white pl-10 pr-4 py-4.5 rounded-xl text-sm placeholder:text-white/30"
                    />
                  </div>
                </div>

                {/* Optional Email */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/80">
                    Email Address <span className="text-white/40">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="e.g. admin@johyafashions.com"
                      className="w-full bg-black/50 border-white/15 focus:border-[#B08D57] text-white pl-10 pr-4 py-4.5 rounded-xl text-sm placeholder:text-white/30"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/80">Select Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSignUpRole('superadmin')}
                      className={`py-2 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                        signUpRole === 'superadmin'
                          ? 'bg-[#B08D57]/20 border-[#B08D57] text-white'
                          : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E8D4B0]">
                        <Crown className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>Super Admin</span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5">Full authority & point rules</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignUpRole('admin')}
                      className={`py-2 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                        signUpRole === 'admin'
                          ? 'bg-[#B08D57]/20 border-[#B08D57] text-white'
                          : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E8D4B0]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>Store Admin</span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5">Customer & orders management</p>
                    </button>
                  </div>
                </div>

                {/* Password with reversed icon */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/80">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Minimum 4 characters"
                      className="w-full bg-black/50 border-white/15 focus:border-[#B08D57] text-white pl-10 pr-10 py-4.5 rounded-xl text-sm placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#E8D4B0] transition-colors cursor-pointer"
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password with reversed icon */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/80">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={signUpConfirmPassword}
                      onChange={(e) => {
                        setSignUpConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Confirm your password"
                      className="w-full bg-black/50 border-white/15 focus:border-[#B08D57] text-white pl-10 pr-10 py-4.5 rounded-xl text-sm placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#E8D4B0] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign Up */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 bg-gradient-to-r from-[#B08D57] via-[#C39E67] to-[#B08D57] hover:brightness-110 text-black font-semibold rounded-xl text-sm shadow-lg shadow-[#B08D57]/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-black">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <>
                      <span>Register & Open Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-white/50">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setErrorMessage(null);
                      }}
                      className="text-[#E8D4B0] hover:underline font-semibold cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Security note */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-white/40">
              <KeyRound className="w-3.5 h-3.5 text-[#B08D57]/70" />
              <span>Accounts are role-validated for Admin or Super Admin access</span>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-white/40">
        <p>&copy; {new Date().getFullYear()} Johya Fashions Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
