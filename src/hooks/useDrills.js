import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { getNextReviewDate } from '../utils';

export function useDrills(user) {
    const [stats, setStats] = useState({ totalReviewed: 0, dueToday: 0 });
    const [loadingStats, setLoadingStats] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!user) return;
        setLoadingStats(true);
        try {
            const userDrillsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'drills');
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

    const getDueDrills = useCallback(async () => {
        if (!user) return [];
        try {
            const userDrillsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'drills');
            const snapshot = await getDocs(userDrillsRef);
            const now = new Date();
            const allDueReviews = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.nextReviewAt && data.nextReviewAt.toDate() <= now) {
                    allDueReviews.push({ ...data, id: doc.id, type: 'review' });
                }
            });
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
            const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'drills', drill.id);
            await setDoc(docRef, {
                ...drill,
                lastReviewedAt: Timestamp.now(),
                nextReviewAt: Timestamp.fromDate(nextDate),
                lastRating: rating,
            }, { merge: true });

            // Refresh stats after saving? Or let the caller handle it?
            // For now, let's trigger a stats refresh silently if possible, or just rely on next mount.
            // We can expose fetchStats to manually refresh.
        } catch (e) {
            console.error("Error saving drill progress:", e);
            throw e;
        }
    }, [user]);

    return { stats, loadingStats, fetchStats, getDueDrills, saveDrillResult };
}
