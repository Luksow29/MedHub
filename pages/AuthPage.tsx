import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from './shared/Button';

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [message, setMessage] = useState('');

  const { signIn, signUp, signInWithGoogle, resetPassword, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (isSignUp) {
      if (password !== confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setMessage('Password must be at least 6 characters long');
        return;
      }

      const { error } = await signUp(email, password);
      if (!error) {
        setMessage('Check your email for verification link!');
      }
    } else {
      await signIn(email, password);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await resetPassword(resetEmail);
    if (!error) {
      setMessage('Password reset email sent! Check your inbox.');
      setShowResetPassword(false);
      setResetEmail('');
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 p-4">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-sky-700 mb-2">Reset Password</h1>
          <p className="text-center text-slate-600 mb-8">Enter your email to receive a reset link</p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{message}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>

            <div className="space-y-3">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
                Send Reset Email
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="lg" 
                className="w-full" 
                onClick={() => setShowResetPassword(false)}
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-sky-700 mb-2">MedRemind Hub</h1>
        <p className="text-center text-slate-600 mb-8">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
          )}

          <div className="space-y-3">
            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="secondary" 
              size="lg" 
              className="w-full flex items-center justify-center" 
              onClick={handleGoogleSignIn}
              isLoading={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-sky-600 hover:text-sky-500 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="block w-full text-sm text-slate-600 hover:text-slate-500"
              >
                Forgot your password?
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;