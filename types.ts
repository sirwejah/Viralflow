
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

export interface UserProfile {
  name: string;
  platforms: Platform[];
  creatorType: CreatorType;
  niche: Niche[];
}

export interface VideoIdea {
  id: string;
  title: string;
  hook: string;
  viralityScore: number;
  script?: string;
  status: 'idea' | 'scripted' | 'generating' | 'ready' | 'scheduled' | 'posted';
  scheduledAt?: string;
}

export interface Metric {
  label: string;
  value: string;
  trend: number;
}
