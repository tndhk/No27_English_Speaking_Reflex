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

    const getDueDrills = useCallback(async () => {
        if (!user) return [];
        try {
            const userDrillsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'userDrills');
            const snapshot = await getDocs(userDrillsRef);
            const now = new Date();
            const allDueReviews = [];

            // Fetch full content details from contentPool
            for (const userDrillDoc of snapshot.docs) {
                const userDrillData = userDrillDoc.data();
                if (userDrillData.nextReviewAt && userDrillData.nextReviewAt.toDate() <= now) {
                    try {
                        const contentRef = doc(db, 'artifacts', appId, 'contentPool', userDrillDoc.id);
                        const contentDocSnapshot = await getDoc(contentRef);
                        if (contentDocSnapshot.exists()) {
                            const contentData = contentDocSnapshot.data();
                            allDueReviews.push({
                                ...contentData,
                                id: userDrillDoc.id,
                                type: 'review',
                                userProgress: userDrillData
                            });
                        }
                    } catch (err) {
                        console.error("Error fetching content for due drill:", err);
                    }
                }
            }
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
