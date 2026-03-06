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
    return this.supabaseService.client.auth.signUp({ email, password });
  }

  signInWithMagicLink(email: string): Promise<any> {
    return this.supabaseService.client.auth.signInWithOtp({ email });
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
