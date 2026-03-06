import { createClient } from '@supabase/supabase-js';
import { getValidRandomPage } from './wiki.helpers';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

export interface DailyChallenge {
  date: string;
  start_page: string;
  target_page: string;
  language: string;
}

export interface DailyResultInput {
  date: string;
  player_name: string;
  steps: number;
  time_ms: number | null;
  finished: boolean;
  path: string[];
  user_id?: string;
  language?: string;
}

export interface HallOfFameInput {
  player_name: string;
  start_page: string;
  target_page: string;
  steps: number;
  time_ms: number;
  path: string[];
  is_daily: boolean;
  user_id?: string;
  language?: string;
}

// Returns today's challenge for the given language, creating it if it doesn't exist yet
export async function getDailyChallenge(lang = 'es'): Promise<DailyChallenge> {
  const date = todayUTC();

  if (supabase) {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('date, start_page, target_page, language')
      .eq('date', date)
      .eq('language', lang)
      .single();

    if (data && !error) return data as DailyChallenge;

    // Create today's challenge for this language
    const start = await getValidRandomPage(10, undefined, lang);
    const target = await getValidRandomPage(10, start, lang);

    const { data: created, error: insertError } = await supabase
      .from('daily_challenges')
      .insert({ date, start_page: start, target_page: target, language: lang })
      .select('date, start_page, target_page, language')
      .single();

    if (created && !insertError) return created as DailyChallenge;
    console.error('[Supabase] Error creating daily challenge:', insertError?.message);
  }

  // Fallback: generate random pages without persisting
  const start = await getValidRandomPage(10, undefined, lang);
  const target = await getValidRandomPage(10, start, lang);
  return { date, start_page: start, target_page: target, language: lang };
}

export async function saveDailyResult(result: DailyResultInput): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('daily_results').insert(result);
  if (error) console.error('[Supabase] Error saving daily result:', error.message);
}

export async function saveHallOfFame(entry: HallOfFameInput): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('hall_of_fame').insert(entry);
  if (error) console.error('[Supabase] Error saving hall of fame:', error.message);
}

export async function verifyUserToken(token: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
