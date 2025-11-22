import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { getNextReviewDate } from '../utils';

export function useDrills(user) {
    const [stats, setStats] = useState({ totalReviewed: 0, dueToday: 0 });
    const [loadingStats, setLoadingStats] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoadingStats(true);
        try {
            // Fetch all user drills from Supabase
            const { data: allDrills, error: allError } = await supabase
                .from('user_drills')
                .select('*')
                .eq('user_id', user.id);

            if (allError) throw allError;

            // Count total reviewed and due today
            const now = new Date();
            let due = 0;

            if (allDrills) {
                allDrills.forEach(drill => {
                    if (drill.next_review_at && new Date(drill.next_review_at) <= now) {
                        due++;
                    }
                });
            }

            setStats({ totalReviewed: allDrills?.length || 0, dueToday: due });
        } catch (error) {
            console.error("Error fetching stats:", error);
            setStats({ totalReviewed: 0, dueToday: 0 });
        } finally {
            setLoadingStats(false);
        }
    }, [user]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    /**
     * Fetches all due drills for the current user
     * Uses single optimized SQL query with JOIN instead of sequential N+1 queries
     * @returns {Promise<Array>} Array of drill objects with content and progress data
     * @throws {Error} If user is not authenticated or Supabase query fails
     */
    const getDueDrills = useCallback(async () => {
        if (!user) return [];
        try {
            const now = new Date().toISOString();

            // Single optimized query: JOIN user_drills with content_pool
            const { data: dueReviews, error } = await supabase
                .from('user_drills')
                .select(`
                    id,
                    next_review_at,
                    last_review_at,
                    last_rating,
                    review_count,
                    content_pool:content_id (
                        id,
                        jp,
                        en,
                        level,
                        grammar_patterns,
                        contexts,
                        downvotes,
                        generated_by
                    )
                `)
                .eq('user_id', user.id)
                .lte('next_review_at', now);

            if (error) throw error;

            // Transform to match expected format
            const allDueReviews = (dueReviews || [])
                .filter(drill => drill.content_pool !== null)
                .map(drill => ({
                    ...drill.content_pool,
                    id: drill.id,
                    type: 'review',
                    userProgress: {
                        nextReviewAt: drill.next_review_at,
                        lastReviewedAt: drill.last_review_at,
                        lastRating: drill.last_rating,
                        reviewCount: drill.review_count
                    }
                }));

            return allDueReviews;
        } catch (error) {
            console.error("Error fetching due drills:", error);
            throw error;
        }
    }, [user]);

    const saveDrillResult = useCallback(async (drill, rating) => {
        if (!user) return;

        // Validate rating value
        const VALID_RATINGS = ['hard', 'soso', 'easy'];
        if (!VALID_RATINGS.includes(rating)) {
            console.error('Invalid rating value:', rating);
            return;
        }

        const nextDate = getNextReviewDate(rating);
        try {
            const { error } = await supabase
                .from('user_drills')
                .update({
                    last_reviewed_at: new Date().toISOString(),
                    next_review_at: nextDate.toISOString(),
                    last_rating: rating,
                    review_count: (drill.userProgress?.reviewCount || 0) + 1
                })
                .eq('id', drill.id)
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (e) {
            console.error("Error saving drill progress:", e);
            throw e;
        }
    }, [user]);

    const assignContentToUser = useCallback(async (contentId) => {
        if (!user) return;
        try {
            const nextDate = getNextReviewDate('easy'); // First review in 7 days

            const { error } = await supabase
                .from('user_drills')
                .insert({
                    user_id: user.id,
                    content_id: contentId,
                    next_review_at: nextDate.toISOString(),
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (e) {
            console.error("Error assigning content to user:", e);
            throw e;
        }
    }, [user]);

    const recordDownvote = useCallback(async (contentId) => {
        try {
            // Fetch current downvote count
            const { data: content, error: fetchError } = await supabase
                .from('content_pool')
                .select('downvotes')
                .eq('id', contentId)
                .single();

            if (fetchError) throw fetchError;

            const currentDownvotes = content?.downvotes || 0;
            const maxDownvotes = 1000; // Prevent abuse

            // Only allow increment if under limit
            if (currentDownvotes >= maxDownvotes) {
                if (import.meta.env.DEV) {
                    console.warn('Downvote limit reached for content:', contentId);
                }
                return;
            }

            // Increment downvotes
            const { error: updateError } = await supabase
                .from('content_pool')
                .update({
                    downvotes: currentDownvotes + 1,
                    last_downvoted_at: new Date().toISOString()
                })
                .eq('id', contentId);

            if (updateError) throw updateError;
        } catch (e) {
            console.error("Error recording downvote:", e);
            throw e;
        }
    }, []);

    return {
        stats,
        loadingStats,
        fetchStats,
        getDueDrills,
        saveDrillResult,
        assignContentToUser,
        recordDownvote
    };
}
