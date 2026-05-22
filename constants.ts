
export const DEFAULT_GOAL = 6000;
export const CALORIES_PER_STEP = 0.04;
export const DISTANCE_PER_STEP = 0.000762; // Comprimento médio do passo em km (aprox 76cm)
export const TIME_PER_STEP = 0.00016; // Horas aprox por passo (velocidade de caminhada)

// Constantes de Corrida: gasto calórico cerca de 2.7x mais alto por passo, passo mais largo e rápido
export const CALORIES_PER_STEP_RUNNING = 0.11; 
export const DISTANCE_PER_STEP_RUNNING = 0.00115; // Aprox 1.15 metros por passada
export const TIME_PER_STEP_RUNNING = 0.00008; // Menor intervalo de tempo por passada

// Constantes de Trote: valores intermediários entre caminhada e corrida
export const CALORIES_PER_STEP_JOGGING = 0.075;
export const DISTANCE_PER_STEP_JOGGING = 0.00092; // Aprox 92cm por passada
export const TIME_PER_STEP_JOGGING = 0.00011; // Tempo intermediário por passada

export const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const STORAGE_KEYS = {
  STATS: 'steptrack_daily_stats',
  HISTORY: 'steptrack_history',
  PROFILE: 'steptrack_user_profile',
  WORKOUT_HISTORY: 'steptrack_workout_history'
};
