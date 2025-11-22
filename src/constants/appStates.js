/**
 * Application State Machine Constants
 * Defines all possible states and transitions in the app
 */

export const APP_STATES = {
  /** Loading authentication state */
  AUTH_LOADING: 'auth_loading',

  /** Dashboard/settings view */
  DASHBOARD: 'dashboard',

  /** Loading session content */
  LOADING: 'loading',

  /** Active drill session */
  DRILL: 'drill',

  /** Session completion screen */
  COMPLETE: 'complete'
};

/**
 * Spaced Repetition Intervals
 * Determines when cards should be reviewed based on difficulty rating
 */
export const SPACED_REPETITION_INTERVALS = {
  /** Hard - Review in 1 day (for cards the user struggled with) */
  HARD: 1,

  /** Good/So-so - Review in 3 days (standard interval) */
  GOOD: 3,

  /** Easy - Review in 7 days (for cards the user knows well) */
  EASY: 7
};

/**
 * Drill Rating Options
 * User feedback on card difficulty
 */
export const DRILL_RATINGS = {
  HARD: 'hard',
  GOOD: 'soso',
  EASY: 'easy'
};

/**
 * Content Downvote Threshold
 * Content with downvotes >= this value should be considered low quality
 */
export const DOWNVOTE_THRESHOLD = 5;

/**
 * API Configuration
 */
export const API_CONFIG = {
  /** Gemini API timeout in milliseconds */
  GEMINI_TIMEOUT_MS: 15000,

  /** Maximum retries for API calls */
  MAX_RETRIES: 2
};

/**
 * Question Count Options
 * Available session sizes
 */
export const QUESTION_COUNTS = [5, 10, 20];
