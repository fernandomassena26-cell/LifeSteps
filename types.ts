
export type UserGoal = 'weight_loss' | 'muscle_gain' | 'maintenance';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  age: number;
  goal: UserGoal;
  stepGoal: number;
  weight: number; // em kg
  height: number; // em cm
  gender: 'male' | 'female' | 'other';
  isPremium: boolean;
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

export enum Tab {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  WORKOUTS = 'WORKOUTS',
  DIET = 'DIET',
  REPORT = 'REPORT',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  PREMIUM_ADVANTAGES = 'PREMIUM_ADVANTAGES'
}
