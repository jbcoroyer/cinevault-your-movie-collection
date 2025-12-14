import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNCTION_URL = "https://excnpqcvjixmwqbkocum.supabase.co/functions/v1/gamification-engine";

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_login_date: string;
}

export interface DailyBonus {
  xp_earned: number;
  bonus_type: string;
  claimed_date: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  challenge_type: string;
  target_count: number;
  target_value?: string;
  xp_reward: number;
  popcorn_reward: number;
  progress: {
    current_progress: number;
    is_completed: boolean;
    reward_claimed: boolean;
  };
}

export interface SeasonalEvent {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  theme_color: string;
  start_date: string;
  end_date: string;
  event_type: string;
  event_badges: EventBadge[];
}

export interface EventBadge {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  criteria: any;
  xp_reward: number;
  rarity: string;
}

export interface UserReward {
  id: string;
  reward_type: 'title' | 'frame' | 'theme';
  reward_id: string;
  reward_name: string;
  reward_data: any;
  is_equipped: boolean;
  unlocked_at: string;
}

export interface DailyLoginResult {
  streak: UserStreak;
  streakBroken: boolean;
  bonus?: {
    alreadyClaimed: boolean;
    xpEarned?: number;
    popcornEarned?: number;
  };
  newBadges: string[];
  newRewards: any[];
  alreadyLoggedIn?: boolean;
}

// Appel générique à l'edge function
async function callGamificationEngine(action: string, userId: string, data?: any) {
  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
      },
      body: JSON.stringify({ action, userId, data }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Gamification] Error calling ${action}:`, error);
    throw error;
  }
}

// Connexion quotidienne - met à jour streak et bonus
export async function processDailyLogin(userId: string): Promise<DailyLoginResult | null> {
  try {
    const result = await callGamificationEngine('daily_login', userId);
    console.log('[Gamification] Daily login result:', result);
    return result;
  } catch (error) {
    console.error('[Gamification] Daily login error:', error);
    return null;
  }
}

// Récupérer les défis hebdomadaires
export async function getWeeklyChallenges(userId: string): Promise<WeeklyChallenge[]> {
  try {
    return await callGamificationEngine('get_challenges', userId);
  } catch (error) {
    console.error('[Gamification] Get challenges error:', error);
    return [];
  }
}

// Mettre à jour la progression d'un défi
export async function updateChallengeProgress(
  userId: string, 
  challengeType: string, 
  value?: string
): Promise<void> {
  try {
    await callGamificationEngine('update_challenge', userId, { challengeType, value });
  } catch (error) {
    console.error('[Gamification] Update challenge error:', error);
  }
}

// Réclamer une récompense de défi
export async function claimChallengeReward(
  userId: string, 
  challengeId: string
): Promise<{ success: boolean; xpEarned?: number; popcornEarned?: number }> {
  try {
    return await callGamificationEngine('claim_challenge', userId, { challengeId });
  } catch (error) {
    console.error('[Gamification] Claim challenge error:', error);
    return { success: false };
  }
}

// Récupérer les événements saisonniers actifs
export async function getActiveEvents(): Promise<SeasonalEvent[]> {
  try {
    const { data } = await supabase
      .from('seasonal_events')
      .select('*, event_badges(*)')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString().split('T')[0])
      .gte('end_date', new Date().toISOString().split('T')[0]);
    
    return data || [];
  } catch (error) {
    console.error('[Gamification] Get events error:', error);
    return [];
  }
}

// Vérifier les badges et récompenses
export async function checkBadgesAndRewards(userId: string): Promise<{
  newBadges: string[];
  newRewards: any[];
}> {
  try {
    return await callGamificationEngine('check_badges', userId);
  } catch (error) {
    console.error('[Gamification] Check badges error:', error);
    return { newBadges: [], newRewards: [] };
  }
}

// Récupérer les récompenses de l'utilisateur
export async function getUserRewards(userId: string): Promise<UserReward[]> {
  try {
    const { data } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });
    
    return (data as UserReward[]) || [];
  } catch (error) {
    console.error('[Gamification] Get rewards error:', error);
    return [];
  }
}

// Équiper/déséquiper une récompense
export async function equipReward(
  userId: string,
  rewardType: string,
  rewardId: string,
  equip: boolean
): Promise<boolean> {
  try {
    await callGamificationEngine('equip_reward', userId, {
      reward_type: rewardType,
      reward_id: rewardId,
      equip
    });
    return true;
  } catch (error) {
    console.error('[Gamification] Equip reward error:', error);
    return false;
  }
}

// Récupérer le streak utilisateur directement
export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  try {
    const { data } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return data;
  } catch (error) {
    console.error('[Gamification] Get streak error:', error);
    return null;
  }
}

// Récupérer l'historique des bonus quotidiens
export async function getDailyBonusHistory(userId: string, limit = 7): Promise<DailyBonus[]> {
  try {
    const { data } = await supabase
      .from('daily_bonuses')
      .select('*')
      .eq('user_id', userId)
      .order('claimed_date', { ascending: false })
      .limit(limit);
    
    return data || [];
  } catch (error) {
    console.error('[Gamification] Get bonus history error:', error);
    return [];
  }
}

// Toutes les définitions de récompenses
export async function getRewardDefinitions(): Promise<any[]> {
  try {
    const { data } = await supabase
      .from('reward_definitions')
      .select('*')
      .eq('is_active', true);
    
    return data || [];
  } catch (error) {
    console.error('[Gamification] Get reward definitions error:', error);
    return [];
  }
}
