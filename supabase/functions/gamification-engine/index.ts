import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// XP pour le bonus quotidien basé sur le streak
const getDailyBonusXP = (streak: number): number => {
  if (streak >= 365) return 200;
  if (streak >= 100) return 150;
  if (streak >= 30) return 100;
  if (streak >= 14) return 75;
  if (streak >= 7) return 50;
  return 25;
};

// Popcorn points basés sur le streak
const getDailyPopcorn = (streak: number): number => {
  if (streak >= 100) return 20;
  if (streak >= 30) return 15;
  if (streak >= 7) return 10;
  return 5;
};

// Mettre à jour le streak d'un utilisateur
async function updateUserStreak(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Récupérer ou créer le streak
  const { data: existingStreak, error: fetchError } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching streak:', fetchError);
    return null;
  }

  if (!existingStreak) {
    // Créer un nouveau streak
    const { data: newStreak, error: insertError } = await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_login_date: today
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating streak:', insertError);
      return null;
    }
    return { streak: newStreak, isNewDay: true, streakBroken: false };
  }

  // Vérifier si c'est un nouveau jour
  const lastLogin = existingStreak.last_login_date;
  if (lastLogin === today) {
    return { streak: existingStreak, isNewDay: false, streakBroken: false };
  }

  // Calculer la différence de jours
  const lastDate = new Date(lastLogin);
  const todayDate = new Date(today);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let newCurrentStreak = existingStreak.current_streak;
  let streakBroken = false;

  // Vérifier si le streak est gelé
  const frozenUntil = existingStreak.streak_frozen_until;
  const isFrozen = frozenUntil && new Date(frozenUntil) >= todayDate;

  if (diffDays === 1) {
    // Jour consécutif - augmenter le streak
    newCurrentStreak += 1;
  } else if (diffDays > 1 && !isFrozen) {
    // Streak cassé
    newCurrentStreak = 1;
    streakBroken = true;
  }

  const newLongestStreak = Math.max(existingStreak.longest_streak, newCurrentStreak);

  const { data: updatedStreak, error: updateError } = await supabase
    .from('user_streaks')
    .update({
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_login_date: today,
      streak_frozen_until: null // Reset freeze
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating streak:', updateError);
    return null;
  }

  return { streak: updatedStreak, isNewDay: true, streakBroken };
}

// Réclamer le bonus quotidien
async function claimDailyBonus(userId: string, streak: number) {
  const today = new Date().toISOString().split('T')[0];

  // Vérifier si déjà réclamé
  const { data: existing } = await supabase
    .from('daily_bonuses')
    .select('*')
    .eq('user_id', userId)
    .eq('claimed_date', today)
    .single();

  if (existing) {
    return { alreadyClaimed: true, bonus: existing };
  }

  const xpEarned = getDailyBonusXP(streak);
  const popcornEarned = getDailyPopcorn(streak);

  // Insérer le bonus
  const { data: bonus, error: insertError } = await supabase
    .from('daily_bonuses')
    .insert({
      user_id: userId,
      claimed_date: today,
      xp_earned: xpEarned,
      bonus_type: streak >= 7 ? 'streak_bonus' : 'standard'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting daily bonus:', insertError);
    return { alreadyClaimed: false, error: insertError };
  }

  // Mettre à jour l'XP et les popcorn points
  await supabase
    .from('profiles')
    .update({
      total_xp: supabase.rpc('increment_field', { row_id: userId, field: 'total_xp', amount: xpEarned }),
      popcorn_points: supabase.rpc('increment_field', { row_id: userId, field: 'popcorn_points', amount: popcornEarned })
    })
    .eq('id', userId);

  // Alternative: faire un update avec une requête SQL
  const { error: xpError } = await supabase.rpc('add_xp_and_popcorn', {
    p_user_id: userId,
    p_xp: xpEarned,
    p_popcorn: popcornEarned
  });

  if (xpError) {
    // Fallback: mettre à jour directement
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, popcorn_points')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          total_xp: (profile.total_xp || 0) + xpEarned,
          popcorn_points: (profile.popcorn_points || 0) + popcornEarned
        })
        .eq('id', userId);
    }
  }

  return { alreadyClaimed: false, bonus, xpEarned, popcornEarned };
}

// Récupérer les défis hebdomadaires actifs
async function getWeeklyChallenges(userId: string) {
  // Calculer le début de la semaine (lundi)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];

  // Récupérer les défis actifs
  const { data: challenges } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('is_active', true);

  if (!challenges) return [];

  // Récupérer la progression de l'utilisateur
  const { data: userProgress } = await supabase
    .from('user_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart);

  const progressMap = new Map(userProgress?.map(p => [p.challenge_id, p]) || []);

  return challenges.map(challenge => ({
    ...challenge,
    progress: progressMap.get(challenge.id) || {
      current_progress: 0,
      is_completed: false,
      reward_claimed: false
    }
  }));
}

/**
 * PATCH pour supabase/functions/gamification-engine/index.ts
 * 
 * MODIFICATION: Dans la fonction updateChallengeProgress, ajouter la création
 * d'une notification quand un défi est complété.
 * 
 * Remplacer la fonction updateChallengeProgress existante par celle-ci:
 */

// Mettre à jour la progression d'un défi
async function updateChallengeProgress(userId: string, challengeType: string, value?: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];

  // Trouver les défis correspondants
  const { data: challenges } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('is_active', true)
    .eq('challenge_type', challengeType);

  if (!challenges) return;

  for (const challenge of challenges) {
    // Vérifier si le défi correspond à la valeur (format/genre)
    if (challenge.target_value && challenge.target_value !== value) continue;

    // Récupérer ou créer la progression
    const { data: existingProgress } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challenge.id)
      .eq('week_start', weekStart)
      .single();

    if (existingProgress?.is_completed) continue;

    if (existingProgress) {
      const newProgress = existingProgress.current_progress + 1;
      const isCompleted = newProgress >= challenge.target_count;

      await supabase
        .from('user_challenges')
        .update({
          current_progress: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', existingProgress.id);

      // ✅ NOUVEAU: Créer une notification si le défi est complété
      if (isCompleted) {
        await createChallengeCompletedNotification(userId, challenge);
      }
    } else {
      const isCompleted = challenge.target_count <= 1;
      
      await supabase
        .from('user_challenges')
        .insert({
          user_id: userId,
          challenge_id: challenge.id,
          week_start: weekStart,
          current_progress: 1,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        });

      // ✅ NOUVEAU: Créer une notification si le défi est complété immédiatement
      if (isCompleted) {
        await createChallengeCompletedNotification(userId, challenge);
      }
    }
  }
}

// ✅ NOUVELLE FONCTION: Créer une notification de défi complété
async function createChallengeCompletedNotification(userId: string, challenge: any) {
  try {
    // Vérifier les préférences de notification de l'utilisateur
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('challenges')
      .eq('user_id', userId)
      .single();

    // Si l'utilisateur a désactivé les notifications de défis, ne pas créer
    if (prefs && prefs.challenges === false) {
      return;
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'challenge_completed',
        title: '🏆 Défi complété !',
        message: `Vous avez complété le défi "${challenge.title}". Réclamez votre récompense de ${challenge.xp_reward} XP et ${challenge.popcorn_reward} 🍿 !`,
        metadata: {
          challenge_id: challenge.id,
          challenge_title: challenge.title,
          xp_reward: challenge.xp_reward,
          popcorn_reward: challenge.popcorn_reward,
          type: 'challenge_completed'
        }
      });

    console.log(`[Gamification] Created notification for completed challenge: ${challenge.title}`);
  } catch (error) {
    console.error('[Gamification] Error creating challenge notification:', error);
  }
}

    // Récupérer ou créer la progression
    const { data: existingProgress } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challenge.id)
      .eq('week_start', weekStart)
      .single();

    if (existingProgress?.is_completed) continue;

    if (existingProgress) {
      const newProgress = existingProgress.current_progress + 1;
      const isCompleted = newProgress >= challenge.target_count;

      await supabase
        .from('user_challenges')
        .update({
          current_progress: newProgress,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', existingProgress.id);
    } else {
      const isCompleted = challenge.target_count <= 1;
      
      await supabase
        .from('user_challenges')
        .insert({
          user_id: userId,
          challenge_id: challenge.id,
          week_start: weekStart,
          current_progress: 1,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        });
    }
  }
}

// Réclamer la récompense d'un défi
async function claimChallengeReward(userId: string, challengeId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];

  // Vérifier que le défi est complété
  const { data: userChallenge } = await supabase
    .from('user_challenges')
    .select('*, weekly_challenges(*)')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .eq('week_start', weekStart)
    .single();

  if (!userChallenge || !userChallenge.is_completed || userChallenge.reward_claimed) {
    return { success: false, error: 'Challenge not completed or already claimed' };
  }

  const challenge = userChallenge.weekly_challenges;

  // Marquer comme réclamé
  await supabase
    .from('user_challenges')
    .update({ reward_claimed: true })
    .eq('id', userChallenge.id);

  // Ajouter les récompenses
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp, popcorn_points')
    .eq('id', userId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        total_xp: (profile.total_xp || 0) + challenge.xp_reward,
        popcorn_points: (profile.popcorn_points || 0) + challenge.popcorn_reward
      })
      .eq('id', userId);
  }

  return {
    success: true,
    xpEarned: challenge.xp_reward,
    popcornEarned: challenge.popcorn_reward
  };
}

// Récupérer les événements saisonniers actifs
async function getActiveEvents() {
  const today = new Date().toISOString().split('T')[0];

  const { data: events } = await supabase
    .from('seasonal_events')
    .select('*, event_badges(*)')
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today);

  return events || [];
}

// Vérifier et débloquer les badges (appelé après actions)
async function checkAndUnlockBadges(userId: string) {
  // Cette logique est déjà dans badgeService.ts côté client
  // Ici on peut ajouter des vérifications serveur supplémentaires
  
  const { data: definitions } = await supabase
    .from('badge_definitions')
    .select('*');

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const existingBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

  // Récupérer les stats utilisateur
  const { count: movieCount } = await supabase
    .from('physical_movies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single();

  const stats = {
    movie_count: movieCount || 0,
    review_count: reviewCount || 0,
    current_streak: streakData?.current_streak || 0
  };

  const newBadges = [];

  for (const def of definitions || []) {
    if (existingBadgeIds.has(def.id)) continue;

    const criteria = def.criteria;
    let eligible = false;

    switch (criteria.type) {
      case 'movie_count':
      case 'physical_count':
        eligible = stats.movie_count >= (criteria.count || 1);
        break;
      case 'review_count':
        eligible = stats.review_count >= (criteria.count || 1);
        break;
      case 'streak':
        eligible = stats.current_streak >= (criteria.count || 1);
        break;
    }

    if (eligible) {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: def.id,
          rarity: def.base_rarity
        });

      if (!error) {
        newBadges.push(def.id);
        
        // Créer une notification pour le badge débloqué
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'badge_earned',
            title: `🏆 Badge débloqué : ${def.title}`,
            message: def.description,
            metadata: { badgeId: def.id, rarity: def.base_rarity, xpReward: def.xp_reward }
          });
      }
    }
  }

  return newBadges;
}

// Vérifier les récompenses débloquables
async function checkUnlockableRewards(userId: string) {
  const { data: definitions } = await supabase
    .from('reward_definitions')
    .select('*')
    .eq('is_active', true);

  const { data: userRewards } = await supabase
    .from('user_rewards')
    .select('reward_id')
    .eq('user_id', userId);

  const existingRewardIds = new Set(userRewards?.map(r => r.reward_id) || []);

  // Stats utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .single();

  const { count: badgeCount } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: movieCount } = await supabase
    .from('physical_movies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .single();

  const stats = {
    xp: profile?.total_xp || 0,
    badge_count: badgeCount || 0,
    movie_count: movieCount || 0,
    streak: streakData?.current_streak || 0
  };

  const newRewards = [];

  for (const def of definitions || []) {
    if (existingRewardIds.has(def.id)) continue;

    const criteria = def.unlock_criteria;
    let eligible = false;

    switch (criteria.type) {
      case 'xp':
        eligible = stats.xp >= (criteria.count || 1);
        break;
      case 'badge_count':
        eligible = stats.badge_count >= (criteria.count || 1);
        break;
      case 'movie_count':
        eligible = stats.movie_count >= (criteria.count || 1);
        break;
      case 'streak':
        eligible = stats.streak >= (criteria.count || 1);
        break;
    }

    if (eligible) {
      const { error } = await supabase
        .from('user_rewards')
        .insert({
          user_id: userId,
          reward_type: def.reward_type,
          reward_id: def.id,
          reward_name: def.name,
          reward_data: def.preview_data
        });

      if (!error) {
        newRewards.push(def);
      }
    }
  }

  return newRewards;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, data } = await req.json();

    console.log(`[Gamification] Action: ${action}, User: ${userId}`);

    let result: any = {};

    switch (action) {
      case 'daily_login':
        // Mettre à jour le streak et récupérer le bonus quotidien
        const streakResult = await updateUserStreak(userId);
        if (streakResult?.isNewDay) {
          const currentStreak = streakResult.streak.current_streak;
          const bonusResult = await claimDailyBonus(userId, currentStreak);
          const newBadges = await checkAndUnlockBadges(userId);
          const newRewards = await checkUnlockableRewards(userId);
          
          // Vérifier si un palier de streak a été atteint
          const milestones = [7, 14, 30, 100, 365];
          if (milestones.includes(currentStreak)) {
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                type: 'streak_milestone',
                title: `🔥 Palier de ${currentStreak} jours atteint !`,
                message: `Félicitations ! Vous avez maintenu votre streak pendant ${currentStreak} jours consécutifs.`,
                metadata: { milestone: currentStreak, streak: currentStreak }
              });
          }
          
          result = {
            streak: streakResult.streak,
            streakBroken: streakResult.streakBroken,
            bonus: bonusResult,
            newBadges,
            newRewards
          };
        } else {
          result = { streak: streakResult?.streak, alreadyLoggedIn: true };
        }
        break;

      case 'get_challenges':
        result = await getWeeklyChallenges(userId);
        break;

      case 'update_challenge':
        await updateChallengeProgress(userId, data.challengeType, data.value);
        result = { success: true };
        break;

      case 'claim_challenge':
        result = await claimChallengeReward(userId, data.challengeId);
        break;

      case 'get_events':
        result = await getActiveEvents();
        break;

      case 'check_badges':
        const badges = await checkAndUnlockBadges(userId);
        const rewards = await checkUnlockableRewards(userId);
        result = { newBadges: badges, newRewards: rewards };
        break;

      case 'get_user_rewards':
        const { data: userRewards } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', userId);
        result = userRewards || [];
        break;

      case 'equip_reward':
        const { reward_type, reward_id, equip } = data;
        
        if (reward_type === 'frame') {
          await supabase
            .from('profiles')
            .update({ equipped_frame: equip ? reward_id : null })
            .eq('id', userId);
        } else if (reward_type === 'theme') {
          await supabase
            .from('profiles')
            .update({ equipped_theme: equip ? reward_id : null })
            .eq('id', userId);
        }

        // Mettre à jour is_equipped
        if (equip) {
          // Déséquiper les autres du même type
          await supabase
            .from('user_rewards')
            .update({ is_equipped: false })
            .eq('user_id', userId)
            .eq('reward_type', reward_type);
        }

        await supabase
          .from('user_rewards')
          .update({ is_equipped: equip })
          .eq('user_id', userId)
          .eq('reward_id', reward_id);

        result = { success: true };
        break;

      default:
        result = { error: 'Unknown action' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[Gamification] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
