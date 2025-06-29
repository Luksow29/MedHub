import { useState, useEffect } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to get session'
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : 'Sign up failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : 'Sign in failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : 'Google sign in failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { data: null, error: errorMessage }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : 'Password reset failed'
      return { error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof AuthError ? error.message : 'Sign out failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { error: errorMessage }
    }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    signOut
  }
}