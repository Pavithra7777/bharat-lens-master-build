import { useState, useEffect } from 'react';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { useRouter } from '../lib/Router';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'email' | 'password' | 'general' | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const { user, setUser } = useApp();
  const { navigate } = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Immediate redirect on login success
  useEffect(() => {
    if (loginSuccess) {
      // Small delay for success feedback, then redirect
      const timer = setTimeout(() => {
        navigate('/');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, navigate]);

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function getFriendlyErrorMessage(result: { ok: boolean; message?: string }): { message: string; type: 'email' | 'password' | 'general' } {
    if (!result.ok && result.message) {
      const msg = result.message.toLowerCase();
      
      // Check for invalid credentials
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('auth')) {
        if (!email.trim()) {
          return { message: 'Please enter your email address', type: 'email' };
        }
        if (!password.trim()) {
          return { message: 'Please enter your password', type: 'password' };
        }
        return { 
          message: 'Incorrect email or password. Please check your credentials and try again.', 
          type: 'general' 
        };
      }
      
      // User not found
      if (msg.includes('user') && (msg.includes('not found') || msg.includes('exist') || msg.includes('invalid'))) {
        return { 
          message: 'No account found with this email. Please check your email or sign up for a new account.', 
          type: 'email' 
        };
      }
      
      // Wrong password
      if (msg.includes('password') && (msg.includes('wrong') || msg.includes('incorrect') || msg.includes('invalid'))) {
        return { 
          message: 'Incorrect password. Please try again or use "Forgot Password" to reset it.', 
          type: 'password' 
        };
      }
      
      // Email already exists
      if (msg.includes('email') && (msg.includes('already') || msg.includes('exist'))) {
        return { 
          message: 'An account with this email already exists. Try logging in instead.', 
          type: 'email' 
        };
      }
      
      // Rate limiting
      if (msg.includes('rate') || msg.includes('too many') || msg.includes('attempt')) {
        return { 
          message: 'Too many attempts. Please wait a few minutes before trying again.', 
          type: 'general' 
        };
      }
    }
    
    return { message: 'Something went wrong. Please try again.', type: 'general' };
  }

  function getInlineValidation(): string | null {
    if (!emailTouched && !passwordTouched) return null;
    
    if (isLogin) {
      if (emailTouched && email && !validateEmail(email)) {
        return 'Please enter a valid email address';
      }
      if (passwordTouched && password && password.length < 6) {
        return 'Password must be at least 6 characters';
      }
    } else {
      if (emailTouched && email && !validateEmail(email)) {
        return 'Please enter a valid email address';
      }
      if (passwordTouched && password && password.length < 6) {
        return 'Password must be at least 6 characters';
      }
      if (name && name.trim().length < 2) {
        return 'Name must be at least 2 characters';
      }
    }
    
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setErrorType('email');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setErrorType('password');
      return;
    }
    
    if (!isLogin && name.trim().length < 2) {
      setError('Please enter your full name');
      setErrorType('general');
      return;
    }

    setError('');
    setErrorType(null);
    setLoading(true);

    try {
      if (isLogin) {
        const result = await db.auth.login({ email, password });
        if (result.ok) {
          // Set user in context
          setUser({ id: result.userId || email, email });
          // Show success and trigger redirect
          setLoginSuccess(true);
        } else {
          const friendlyError = getFriendlyErrorMessage(result);
          setError(friendlyError.message);
          setErrorType(friendlyError.type);
        }
      } else {
        const result = await db.auth.signup({ email, password, name });
        if (result.ok) {
          // Set user in context
          setUser({ id: result.userId || email, email, name });
          // Redirect to onboarding for new users
          setLoginSuccess(true);
          setTimeout(() => navigate('/onboarding'), 300);
        } else {
          const friendlyError = getFriendlyErrorMessage(result);
          setError(friendlyError.message);
          setErrorType(friendlyError.type);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please check your connection and try again.');
      setErrorType('general');
    } finally {
      if (!loginSuccess) {
        setLoading(false);
      }
    }
  }

  const inlineError = getInlineValidation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A6B] to-[#2A4A8B] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-4xl">🇮🇳</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Bharat Lens</h1>
        <p className="text-white/70 text-sm mt-1">One AI. Every Citizen. Every Service.</p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        {loginSuccess ? (
          // Success State - immediate visual feedback before redirect
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-2">
              {isLogin ? 'Welcome back!' : 'Account created!'}
            </h2>
            <p className="text-gray-500">Redirecting you now...</p>
            <div className="mt-4 flex justify-center">
              <div className="w-8 h-8 border-3 border-[#1B3A6B] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          // Login/Signup Form
          <>
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-6 text-center">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => {
                      if (name) setEmailTouched(true);
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition ${
                      errorType === 'general' && name && name.trim().length < 2
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent'
                    }`}
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  errorType === 'email' ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorType === 'email') {
                      setError('');
                      setErrorType(null);
                    }
                  }}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition ${
                    errorType === 'email'
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent'
                  }`}
                  required
                />
              </div>

              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  errorType === 'password' ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorType === 'password') {
                      setError('');
                      setErrorType(null);
                    }
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl outline-none transition ${
                    errorType === 'password'
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent'
                  }`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Inline Validation Error */}
              {inlineError && !error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{inlineError}</span>
                </div>
              )}

              {/* Main Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium hover:bg-[#2A4A8B] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Log In' : 'Sign Up'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setErrorType(null);
                  setEmailTouched(false);
                  setPasswordTouched(false);
                }}
                className="text-[#1B3A6B] font-medium hover:underline"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Language hint */}
      <p className="mt-6 text-white/60 text-sm text-center">
        Continue in your preferred language after logging in
      </p>
    </div>
  );
}
