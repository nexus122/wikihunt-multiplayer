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
  avatar_emoji?: string;
  accent_color?: string;
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
  game_type?: 'solo' | 'multi' | null;
  avatar_emoji?: string;
  accent_color?: string;
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

  async getChallengeLeaderboard(start: string, target: string, lang?: string): Promise<HallOfFameEntry[]> {
    let query = this.client
      .from('hall_of_fame')
      .select('*')
      .eq('start_page', start)
      .eq('target_page', target);
    if (lang) query = query.eq('language', lang);
    const { data, error } = await query
      .order('steps', { ascending: true })
      .order('time_ms', { ascending: true })
      .limit(100);
    if (error || !data) return [];
    const seen = new Set<string>();
    return (data as HallOfFameEntry[]).filter(e => {
      if (seen.has(e.player_name)) return false;
      seen.add(e.player_name);
      return true;
    }).slice(0, 20);
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

  // Community stats for today's daily challenge (best result per player).
  async getDailyStats(date?: string, lang = 'es'): Promise<{
    solvedBy: number;
    avgSteps: number | null;
    avgTimeMs: number | null;
    bestSteps: number | null;
    bestTimeMs: number | null;
    bestBy: string | null;
    bestEmoji: string | null;
  }> {
    const empty = { solvedBy: 0, avgSteps: null, avgTimeMs: null, bestSteps: null, bestTimeMs: null, bestBy: null, bestEmoji: null };
    const day = date || new Date().toISOString().slice(0, 10);
    let query = this.client
      .from('daily_results')
      .select('player_name, steps, time_ms, finished, avatar_emoji')
      .eq('date', day)
      .eq('finished', true);
    if (lang) query = query.eq('language', lang);
    const { data, error } = await query
      .order('steps', { ascending: true })
      .order('time_ms', { ascending: true });
    if (error || !data || data.length === 0) return empty;

    // Keep best result per player (data is already sorted best-first)
    const best = new Map<string, DailyResult>();
    for (const row of data as DailyResult[]) {
      if (!best.has(row.player_name)) best.set(row.player_name, row);
    }
    const rows = Array.from(best.values());
    const totalSteps = rows.reduce((s, r) => s + (r.steps || 0), 0);
    const timed = rows.filter(r => r.time_ms != null);
    const totalTime = timed.reduce((s, r) => s + (r.time_ms || 0), 0);
    const top = rows[0]; // overall best (sorted)

    return {
      solvedBy: rows.length,
      avgSteps: rows.length ? Math.round((totalSteps / rows.length) * 10) / 10 : null,
      avgTimeMs: timed.length ? Math.round(totalTime / timed.length) : null,
      bestSteps: top?.steps ?? null,
      bestTimeMs: top?.time_ms ?? null,
      bestBy: top?.player_name ?? null,
      bestEmoji: top?.avatar_emoji ?? null,
    };
  }

  async getStats(): Promise<{ games: number; players: number }> {
    const [hofResult, profilesResult] = await Promise.all([
      this.client.from('hall_of_fame').select('*', { count: 'exact', head: true }),
      this.client.from('user_profiles').select('*', { count: 'exact', head: true }),
    ]);
    return {
      games: hofResult.count ?? 0,
      players: profilesResult.count ?? 0,
    };
  }
}
