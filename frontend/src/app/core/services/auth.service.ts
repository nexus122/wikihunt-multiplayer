import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
  user_id: string;
  display_name: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // undefined = loading, null = not authenticated, User = authenticated
  private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
  user$: Observable<User | null | undefined> = this.userSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    // onAuthStateChange fires immediately with INITIAL_SESSION, which covers
    // both the normal load and the post-OAuth redirect token exchange.
    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  get currentUser(): User | null | undefined {
    return this.userSubject.value;
  }

  async getAccessToken(): Promise<string> {
    const { data } = await this.supabaseService.client.auth.getSession();
    return data.session?.access_token ?? '';
  }

  signInWithGoogle(redirectTo: string): Promise<any> {
    return this.supabaseService.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }

  signInWithEmail(email: string, password: string): Promise<any> {
    return this.supabaseService.client.auth.signInWithPassword({ email, password });
  }

  signUpWithEmail(email: string, password: string): Promise<any> {
    return this.supabaseService.client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
  }

  signInWithMagicLink(email: string): Promise<any> {
    return this.supabaseService.client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
  }

  signOut(): Promise<any> {
    return this.supabaseService.client.auth.signOut();
  }

  async getProfile(): Promise<UserProfile | null> {
    const user = this.currentUser;
    if (!user) return null;
    const { data, error } = await this.supabaseService.client
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (error || !data) return null;
    return data as UserProfile;
  }

  async isNameAvailable(name: string): Promise<boolean> {
    const { count, error } = await this.supabaseService.client
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('display_name', name);
    if (error) return false;
    return (count ?? 0) === 0;
  }

  async getStreak(): Promise<number> {
    const user = this.currentUser;
    if (!user) return 0;
    const { data } = await this.supabaseService.client
      .from('user_profiles')
      .select('streak, last_daily_date')
      .eq('user_id', user.id)
      .single();
    if (!data) return 0;
    // If streak was last updated more than 1 day ago, it's broken
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const last = data.last_daily_date;
    if (last !== today && last !== yesterdayStr) return 0;
    return data.streak || 0;
  }

  async createProfile(displayName: string): Promise<{ error?: string }> {
    const user = this.currentUser;
    if (!user) return { error: 'No user session' };
    const { error } = await this.supabaseService.client
      .from('user_profiles')
      .insert({ user_id: user.id, display_name: displayName });
    if (error) return { error: error.message };
    return {};
  }
}
