// Plan definitions for ArchViz API
export interface Plan {
  id: string;
  name: string;
  tokensLimit: number;
  description: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tokensLimit: 1000,
    description: 'Plan gratuito con 1,000 tokens al mes'
  },
  {
    id: 'pro',
    name: 'Pro',
    tokensLimit: 10000,
    description: 'Plan Pro con 10,000 tokens al mes'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tokensLimit: 100000,
    description: 'Plan Enterprise con 100,000 tokens al mes'
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    tokensLimit: -1, // -1 means unlimited
    description: 'Plan ilimitado sin restricciones'
  }
];

export interface User {
  id: string;
  email: string;
  api_key: string;
  plan_id: string;
  tokens_used: number;
  tokens_limit: number;
  is_active: boolean;
  requires_api_key: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  endpoint: string;
  tokens_used: number;
  created_at: string;
}

export interface ValidateResponse {
  valid: boolean;
  plan?: string;
  tokens_used?: number;
  tokens_limit?: number;
  requires_api_key?: boolean;
  remaining?: number;
  error?: string;
}
