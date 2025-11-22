import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { getNextReviewDate } from '../utils';

export function useDrills(user) {
    const [stats, setStats] = useState({ totalReviewed: 0, dueToday: 0 });
    const [loadingStats, setLoadingStats] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoadingStats(true);
        try {
            const userDrillsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'userDrills');
            const snapshot = await getDocs(userDrillsRef);
            const now = new Date();
            let due = 0;
            snapshot.forEach(doc => {
                const d = doc.data();
                if (d.nextReviewAt && d.nextReviewAt.toDate() <= now) due++;
            });
            setStats({ totalReviewed: snapshot.size, dueToday: due });
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
     * Uses parallel batch reads instead of sequential N+1 queries for optimal performance
     * @returns {Promise<Array>} Array of drill objects with content and progress data
     * @throws {Error} If user is not authenticated or Firestore query fails
     */
    const getDueDrills = useCallback(async () => {
        if (!user) return [];
        try {
            const userDrillsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'userDrills');
            const snapshot = await getDocs(userDrillsRef);
            const now = new Date();

            // Filter due drills first
            const dueDrillDocs = snapshot.docs.filter(userDrillDoc => {
                const userDrillData = userDrillDoc.data();
                return userDrillData.nextReviewAt &&
                       userDrillData.nextReviewAt.toDate() <= now;
            });

            // If no due drills, return early
            if (dueDrillDocs.length === 0) {
                return [];
            }

            // Fetch all contentPool data in parallel (batch reads)
            const contentDataPromises = dueDrillDocs.map(userDrillDoc => {
                const contentRef = doc(db, 'artifacts', appId, 'contentPool', userDrillDoc.id);
                return getDoc(contentRef)
                    .then(contentDocSnapshot => ({
                        userDrillDoc,
                        contentDocSnapshot
                    }))
                    .catch(err => {
                        console.error("Error fetching content for due drill:", userDrillDoc.id, err);
                        return { userDrillDoc, contentDocSnapshot: null };
                    });
            });

            const contentResults = await Promise.all(contentDataPromises);

            // Combine results
            const allDueReviews = contentResults
                .filter(({ contentDocSnapshot }) => contentDocSnapshot && contentDocSnapshot.exists())
                .map(({ userDrillDoc, contentDocSnapshot }) => ({
                    ...contentDocSnapshot.data(),
                    id: userDrillDoc.id,
                    type: 'review',
                    userProgress: userDrillDoc.data()
                }));

            return allDueReviews;
        } catch (error) {
            console.error("Error fetching due drills:", error);
            throw error;
        }
    }, [user]);

    const saveDrillResult = useCallback(async (drill, rating) => {
        if (!user) return;
        const nextDate = getNextReviewDate(rating);
        try {
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userDrills', drill.id);
            await setDoc(docRef, {
                lastReviewedAt: Timestamp.now(),
                nextReviewAt: Timestamp.fromDate(nextDate),
                lastRating: rating,
            }, { merge: true });
        } catch (e) {
            console.error("Error saving drill progress:", e);
            throw e;
        }
    }, [user]);

    const assignContentToUser = useCallback(async (contentId) => {
        if (!user) return;
        try {
            const nextDate = getNextReviewDate('easy'); // First review in 7 days
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'userDrills', contentId);
            await setDoc(docRef, {
                nextReviewAt: Timestamp.fromDate(nextDate),
                createdAt: Timestamp.now(),
            });
        } catch (e) {
            console.error("Error assigning content to user:", e);
            throw e;
        }
    }, [user]);

    const recordDownvote = useCallback(async (contentId) => {
        try {
            const contentRef = doc(db, 'artifacts', appId, 'contentPool', contentId);
            const contentDoc = await getDoc(contentRef);
            if (contentDoc.exists()) {
                const currentDownvotes = contentDoc.data().downvotes || 0;
                await setDoc(contentRef, {
                    downvotes: currentDownvotes + 1
                }, { merge: true });
            }
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
