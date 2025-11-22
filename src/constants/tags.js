// Tag definitions for the shared content pool system

export const PROFICIENCY_LEVELS = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    promptInstruction: 'Use simple sentence structures (SVO/SVOO). Focus on basic verbs and tenses. Target CEFR A2.'
  },
  intermediate: {
    id: 'intermediate',
    label: 'Intermediate',
    promptInstruction: 'Use standard business English structures. Present Perfect, Passive, Modals. Target CEFR B1/B2.'
  },
  advanced: {
    id: 'advanced',
    label: 'Advanced',
    promptInstruction: 'Use sophisticated sentence structures. Subjunctive Mood, Idioms. Target CEFR C1.'
  }
};

export const JOB_ROLES = {
  software_engineer: 'Software Engineer',
  product_manager: 'Product Manager',
  designer: 'Designer',
  marketing: 'Marketing',
  sales: 'Sales',
  finance: 'Finance',
  healthcare: 'Healthcare',
  education: 'Education',
  business_development: 'Business Development',
  general_business: 'General Business'
};

export const INTERESTS = {
  technology: 'Technology',
  business: 'Business',
  travel: 'Travel',
  food: 'Food',
  sports: 'Sports',
  culture: 'Culture',
  daily_life: 'Daily Life',
  entertainment: 'Entertainment',
  health: 'Health',
  finance: 'Finance'
};

export const GRAMMAR_PATTERNS = {
  present_simple: 'Present Simple',
  present_continuous: 'Present Continuous',
  present_perfect: 'Present Perfect',
  past_simple: 'Past Simple',
  past_perfect: 'Past Perfect',
  passive_voice: 'Passive Voice',
  conditionals: 'Conditionals',
  modals: 'Modals',
  phrasal_verbs: 'Phrasal Verbs',
  idioms: 'Idioms'
};

export const CONTEXTS = {
  business_meeting: 'Business Meeting',
  email_writing: 'Email Writing',
  casual_conversation: 'Casual Conversation',
  presentation: 'Presentation',
  negotiation: 'Negotiation',
  customer_service: 'Customer Service',
  travel: 'Travel',
  restaurant: 'Restaurant',
  interview: 'Interview',
  small_talk: 'Small Talk'
};

// Normalization functions
export function normalizeJobRole(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();

  // Check for exact matches first
  for (const [key] of Object.entries(JOB_ROLES)) {
    if (lower === key) return key;
  }

  // Check for partial matches
  const aliases = {
    'swe': 'software_engineer',
    'engineer': 'software_engineer',
    'dev': 'software_engineer',
    'developer': 'software_engineer',
    'pm': 'product_manager',
    'ui': 'designer',
    'ux': 'designer',
    'mark': 'marketing',
    'sales': 'sales',
    'biz': 'business_development',
    'finance': 'finance',
    'health': 'healthcare',
    'med': 'healthcare',
    'teach': 'education'
  };

  for (const [alias, key] of Object.entries(aliases)) {
    if (lower.includes(alias)) return key;
  }

  return 'general_business'; // fallback
}

export function normalizeInterest(input) {
  if (!input) return 'general_business';
  const lower = input.toLowerCase().trim();

  // Check for exact matches
  for (const [key] of Object.entries(INTERESTS)) {
    if (lower === key) return key;
  }

  // Check for partial matches
  const aliases = {
    'tech': 'technology',
    'ai': 'technology',
    'startup': 'technology',
    'biz': 'business',
    'work': 'business',
    'trip': 'travel',
    'eat': 'food',
    'cook': 'food',
    'sport': 'sports',
    'gym': 'sports',
    'cult': 'culture',
    'art': 'culture',
    'life': 'daily_life',
    'entertain': 'entertainment',
    'movie': 'entertainment',
    'music': 'entertainment',
    'health': 'health',
    'fit': 'health',
    'money': 'finance'
  };

  for (const [alias, key] of Object.entries(aliases)) {
    if (lower.includes(alias)) return key;
  }

  return 'general_business'; // fallback
}

// Get all tag values for Gemini prompt
export function getTagsForPrompt() {
  return {
    jobRoles: Object.keys(JOB_ROLES),
    interests: Object.keys(INTERESTS),
    grammarPatterns: Object.keys(GRAMMAR_PATTERNS),
    contexts: Object.keys(CONTEXTS)
  };
}
