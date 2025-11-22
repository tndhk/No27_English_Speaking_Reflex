import { useState, useCallback } from 'react';
import { APP_STATES } from '../constants/appStates';

/**
 * useSessionManager Hook
 * Manages drill session state machine
 * Handles state transitions and session flow
 *
 * @param {Object} options
 *   - onSessionStart: Callback when session starts
 *   - onSessionComplete: Callback when session completes
 *
 * @returns {Object} Session state and control functions
 */
export function useSessionManager(options = {}) {
  const { onSessionStart, onSessionComplete } = options;

  const [status, setStatus] = useState(APP_STATES.DASHBOARD);
  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  /**
   * Initializes a new drill session
   * @param {Array} drills - Array of drill objects to present
   */
  const startSession = useCallback((drills) => {
    if (!drills || drills.length === 0) {
      setStatus(APP_STATES.DASHBOARD);
      return;
    }

    setSessionQueue(drills);
    setCurrentIndex(0);
    setIsRevealed(false);
    setStatus(APP_STATES.DRILL);

    onSessionStart?.();
  }, [onSessionStart]);

  /**
   * Advances to the next drill in the session
   * Completes session if at the last drill
   */
  const nextDrill = useCallback(() => {
    if (currentIndex < sessionQueue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
    } else {
      completeSession();
    }
  }, [currentIndex, sessionQueue.length]);

  /**
   * Completes the current session
   */
  const completeSession = useCallback(() => {
    setStatus(APP_STATES.COMPLETE);
    onSessionComplete?.();
  }, [onSessionComplete]);

  /**
   * Returns to dashboard from any state
   */
  const returnToDashboard = useCallback(() => {
    setStatus(APP_STATES.DASHBOARD);
    setSessionQueue([]);
    setCurrentIndex(0);
    setIsRevealed(false);
  }, []);

  /**
   * Toggles card reveal state
   */
  const toggleReveal = useCallback(() => {
    setIsRevealed(prev => !prev);
  }, []);

  /**
   * Sets loading state
   */
  const setLoading = useCallback(() => {
    setStatus(APP_STATES.LOADING);
  }, []);

  return {
    // State
    status,
    sessionQueue,
    currentIndex,
    isRevealed,
    currentDrill: sessionQueue[currentIndex] || null,
    sessionProgress: sessionQueue.length > 0 ? ((currentIndex + 1) / sessionQueue.length) * 100 : 0,

    // Actions
    startSession,
    nextDrill,
    completeSession,
    returnToDashboard,
    toggleReveal,
    setLoading,
    setStatus
  };
}
