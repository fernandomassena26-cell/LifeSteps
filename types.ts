
export type UserGoal = 'weight_loss' | 'muscle_gain' | 'maintenance';
export type FitnessLevel = 'very_light' | 'light' | 'moderate' | 'hard' | 'very_hard';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  age: number;
  goal: UserGoal;
  fitnessLevel: FitnessLevel;
  stepGoal: number;
  weight: number; // em kg
  height: number; // em cm
  gender: 'male' | 'female' | 'other';
  isPremium: boolean;
  waterNotificationsEnabled?: boolean;
}

export interface DailyStats {
  steps: number;
  calories: number;
  distance: number;
  activeTime: number; 
  waterIntake: number;
}

export interface WorkoutHistoryItem {
  id: string;
  name: string;
  duration: number; // em minutos
  date: string;
  caloriesBurned?: number;
}

export interface HistoryItem {
  date: string;
  steps: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export enum Tab {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  WORKOUTS = 'WORKOUTS',
  DIET = 'DIET',
  COACH = 'COACH',
  REPORT = 'REPORT',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  PREMIUM_ADVANTAGES = 'PREMIUM_ADVANTAGES'
}
