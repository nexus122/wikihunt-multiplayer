import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export interface DailyChallenge {
  date: string;
  start_page: string;
  target_page: string;
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
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  async getDailyChallenge(): Promise<DailyChallenge | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await this.client
      .from('daily_challenges')
      .select('date, start_page, target_page')
      .eq('date', today)
      .single();
    if (error || !data) return null;
    return data as DailyChallenge;
  }

  async getDailyPodio(date?: string): Promise<DailyResult[]> {
    const day = date || new Date().toISOString().slice(0, 10);
    const { data, error } = await this.client
      .from('daily_results')
      .select('*')
      .eq('date', day)
      .eq('finished', true)
      .order('steps', { ascending: true })
      .order('time_ms', { ascending: true })
      .limit(10);
    if (error || !data) return [];
    return data as DailyResult[];
  }

  async getHallOfFame(): Promise<HallOfFameEntry[]> {
    const { data, error } = await this.client
      .from('hall_of_fame')
      .select('*')
      .order('steps', { ascending: true })
      .order('time_ms', { ascending: true })
      .limit(50);
    if (error || !data) return [];
    return data as HallOfFameEntry[];
  }

  async getPlayerHistory(playerName: string): Promise<HallOfFameEntry[]> {
    const { data, error } = await this.client
      .from('hall_of_fame')
      .select('*')
      .eq('player_name', playerName)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data) return [];
    return data as HallOfFameEntry[];
  }
}
