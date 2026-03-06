import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface DailyChallenge {
  date: string;
  start_page: string;
  target_page: string;
  language?: string;
}

export interface DailyResult {
  id: string;
  date: string;
  player_name: string;
  steps: number;
  time_ms: number | null;
  finished: boolean;
  path: string[];
  created_at: string;
  language?: string;
}

export interface HallOfFameEntry {
  id: string;
  player_name: string;
  start_page: string;
  target_page: string;
  steps: number;
  time_ms: number;
  path: string[];
  is_daily: boolean;
  created_at: string;
  language?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  async getDailyChallenge(lang = 'es'): Promise<DailyChallenge | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await this.client
      .from('daily_challenges')
      .select('date, start_page, target_page, language')
      .eq('date', today)
      .eq('language', lang)
      .single();
    if (error || !data) return null;
    return data as DailyChallenge;
  }

  async getDailyPodio(date?: string, lang = 'es'): Promise<DailyResult[]> {
    const day = date || new Date().toISOString().slice(0, 10);
    let query = this.client
      .from('daily_results')
      .select('*')
      .eq('date', day)
      .eq('finished', true);
    if (lang) query = query.eq('language', lang);
    const { data, error } = await query
      .order('steps', { ascending: true })
      .order('time_ms', { ascending: true })
      .limit(100);
    if (error || !data) return [];
    // Keep only best result per player
    const seen = new Set<string>();
    return (data as DailyResult[]).filter(e => {
      if (seen.has(e.player_name)) return false;
      seen.add(e.player_name);
      return true;
    }).slice(0, 10);
  }

  async getHallOfFame(lang?: string): Promise<HallOfFameEntry[]> {
    let query = this.client
      .from('hall_of_fame')
      .select('*');
    if (lang) query = query.eq('language', lang);
    const { data, error } = await query
      .order('steps', { ascending: true })
      .order('time_ms', { ascending: true })
      .limit(200);
    if (error || !data) return [];
    // Keep only best result per player
    const seen = new Set<string>();
    return (data as HallOfFameEntry[]).filter(e => {
      if (seen.has(e.player_name)) return false;
      seen.add(e.player_name);
      return true;
    }).slice(0, 50);
  }

  async getPlayerHistory(playerName: string, lang?: string): Promise<HallOfFameEntry[]> {
    if (!playerName.trim()) return [];
    let query = this.client
      .from('hall_of_fame')
      .select('*')
      .eq('player_name', playerName);
    if (lang) query = query.eq('language', lang);
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data) return [];
    return data as HallOfFameEntry[];
  }
}
