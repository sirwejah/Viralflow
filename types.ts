
export type Platform = 'TikTok' | 'Instagram' | 'YouTube';

export type CreatorType = 
  | 'Personal Brand' 
  | 'Business' 
  | 'Coach' 
  | 'Influencer' 
  | 'Faceless Channel';

export type Niche = 
  | 'AI' 
  | 'Finance' 
  | 'Fitness' 
  | 'Motivation' 
  | 'Education' 
  | 'Ecommerce'
  | 'Tech'
  | 'Lifestyle';

export type SubscriptionPlan = 'Starter' | 'Pro' | 'Studio';

export type ScriptArchetype = 'Storyteller' | 'Tutorial' | 'Myth-Buster' | 'Listicle' | 'POV';

export interface UserProfile {
  name: string;
  platforms: Platform[];
  creatorType: CreatorType;
  niche: Niche[];
  plan?: SubscriptionPlan;
}

export interface VideoIdea {
  id: string;
  title: string;
  hook: string;
  viralityScore: number;
  script?: string;
  archetype?: ScriptArchetype;
  status: 'idea' | 'scripted' | 'generating' | 'ready' | 'scheduled' | 'posted';
  scheduledAt?: string;
}

export interface Metric {
  label: string;
  value: string;
  trend: number;
}
