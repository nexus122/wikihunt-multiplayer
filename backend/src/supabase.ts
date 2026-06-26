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

export async function updateUserStreak(userId: string, date: string): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('streak, last_daily_date')
    .eq('user_id', userId)
    .single();
  if (error || !data) return;

  const lastDate: string | null = data.last_daily_date;
  if (lastDate === date) return; // already counted today

  const yesterday = new Date(date);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = lastDate === yesterdayStr ? (data.streak || 0) + 1 : 1;

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ streak: newStreak, last_daily_date: date })
    .eq('user_id', userId);
  if (updateError) console.error('[Supabase] Streak update error:', updateError.message);
  else console.log(`[Supabase] Streak updated for ${userId}: ${newStreak}`);
}

export async function isNameTakenByRegisteredUser(name: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id')
    .ilike('display_name', name)
    .limit(1);
  if (error) {
    console.error('[Supabase] Error checking name conflict:', error.message);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

export async function verifyUserToken(token: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

// Returns cosmetics for a user profile (avatar + color). Used at socket connect time.
export async function getPlayerCosmetics(userId: string): Promise<{ avatarEmoji: string; accentColor: string } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('avatar_emoji, accent_color')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return { avatarEmoji: data.avatar_emoji, accentColor: data.accent_color };
}

// Sets is_supporter=true for the user matching the given email (called from Ko-fi webhook).
export async function markSupporter(email: string): Promise<boolean> {
  if (!supabase) return false;
  // Find the auth user by email using the admin API
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error || !data) return false;
  const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) return false;
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ is_supporter: true })
    .eq('user_id', user.id);
  if (updateError) {
    console.error('[Supabase] Error marking supporter:', updateError.message);
    return false;
  }
  console.log(`[Ko-fi] Marked supporter: ${email} (${user.id})`);
  return true;
}
