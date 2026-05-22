
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StepCircle } from './components/StepCircle';
import { StatsGrid } from './components/StatsGrid';
import { WaterTracker } from './components/WaterTracker';
import { WeeklyChart } from './components/WeeklyChart';
import { ActivityCalculator } from './components/ActivityCalculator';
import { ProfilePage } from './components/ProfilePage';
import { WorkoutHistory } from './components/WorkoutHistory';
import { PremiumAdvantagesPage } from './components/PremiumAdvantagesPage';
import { DietBuilder } from './components/DietBuilder';
import { BackgroundSettingsModal } from './components/BackgroundSettingsModal';
import { DailyStats, UserProfile, Tab, UserGoal, WorkoutHistoryItem, FitnessLevel, TrainingEnvironment } from './types';
import { 
  STORAGE_KEYS, 
  DEFAULT_GOAL, 
  CALORIES_PER_STEP, 
  DISTANCE_PER_STEP, 
  TIME_PER_STEP,
  CALORIES_PER_STEP_RUNNING,
  DISTANCE_PER_STEP_RUNNING,
  TIME_PER_STEP_RUNNING,
  CALORIES_PER_STEP_JOGGING,
  DISTANCE_PER_STEP_JOGGING,
  TIME_PER_STEP_JOGGING
} from './constants';
import { getFitnessContent, calculateWorkoutCalories } from './services/fitnessService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LOGIN);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>('login');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', name: '',
    age: '', weight: '', height: '', goal: 'maintenance' as UserGoal,
    fitnessLevel: 'moderate' as FitnessLevel,
    trainingEnvironment: 'home' as TrainingEnvironment
  });

  const [authError, setAuthError] = useState<string | null>(null);
  
  // Stats inicializados como nulo, carregados no useEffect após login
  const [stats, setStats] = useState<DailyStats>({ steps: 0, calories: 0, distance: 0, activeTime: 0, waterIntake: 0 });
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem('lifesteps_is_tracking') === 'true');
  const [activityMode, setActivityMode] = useState<'walking' | 'jogging' | 'running'>(() => {
    return (localStorage.getItem('lifesteps_activity_mode') as 'walking' | 'jogging' | 'running') || 'walking';
  });
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const [bgStepsAdded, setBgStepsAdded] = useState<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Sincroniza estado do modo de atividade com localStorage
  useEffect(() => {
    localStorage.setItem('lifesteps_activity_mode', activityMode);
  }, [activityMode]);

  const checkAndRecoverBackgroundSteps = useCallback((currentStats: DailyStats, userId: string): DailyStats => {
    const wasTracking = localStorage.getItem('lifesteps_is_tracking') === 'true';
    const savedMode = (localStorage.getItem('lifesteps_activity_mode') as 'walking' | 'jogging' | 'running') || 'walking';
    const lastActiveStr = localStorage.getItem('lifesteps_last_active_time');
    
    if (wasTracking && lastActiveStr) {
      const lastActive = parseInt(lastActiveStr);
      const now = Date.now();
      const elapsedMs = now - lastActive;
      const MIN_INTERVAL_MS = 5000;
      
      if (elapsedMs > MIN_INTERVAL_MS) {
        // Simula passos: ~1.35 passos por segundo (81 passos/min) se caminhando,
        // ~1.8 passos por segundo (108 passos/min) se trotando,
        // ou um pouco mais rápido se correndo (~2.3 passos por segundo = 138 passos/min)
        let stepRate = 1.35;
        if (savedMode === 'jogging') stepRate = 1.8;
        else if (savedMode === 'running') stepRate = 2.3;

        const simulatedSteps = Math.min(10000, Math.floor((elapsedMs / 1000) * stepRate));
        
        if (simulatedSteps > 0) {
          let kcalFactor = CALORIES_PER_STEP;
          let distFactor = DISTANCE_PER_STEP;
          let timeFactor = TIME_PER_STEP;

          if (savedMode === 'jogging') {
            kcalFactor = CALORIES_PER_STEP_JOGGING;
            distFactor = DISTANCE_PER_STEP_JOGGING;
            timeFactor = TIME_PER_STEP_JOGGING;
          } else if (savedMode === 'running') {
            kcalFactor = CALORIES_PER_STEP_RUNNING;
            distFactor = DISTANCE_PER_STEP_RUNNING;
            timeFactor = TIME_PER_STEP_RUNNING;
          }

          const addedCalories = Math.round(simulatedSteps * kcalFactor * 10) / 10;
          const addedDistance = Math.round(simulatedSteps * distFactor * 100) / 100;
          const addedActiveTime = Math.floor((simulatedSteps * timeFactor) * 60);

          const updatedStats = {
            ...currentStats,
            steps: currentStats.steps + simulatedSteps,
            calories: Math.round((currentStats.calories + addedCalories) * 10) / 10,
            distance: Math.round((currentStats.distance + addedDistance) * 100) / 100,
            activeTime: currentStats.activeTime + addedActiveTime,
            waterIntake: currentStats.waterIntake
          };

          // Salva imediatamente
          localStorage.setItem(`${STORAGE_KEYS.STATS}_${userId}`, JSON.stringify({
            date: new Date().toDateString(),
            data: updatedStats
          }));

          // Configura indicador visual para exibir o toast de passos acumulados
          setBgStepsAdded(simulatedSteps);
          
          // Reseta o timestamp de atividade para agora
          localStorage.setItem('lifesteps_last_active_time', now.toString());
          
          return updatedStats;
        }
      }
    }
    // Sempre define o tempo atual como o último ativo se estiver monitorando
    localStorage.setItem('lifesteps_last_active_time', Date.now().toString());
    return currentStats;
  }, []);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock is active');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock released');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  useEffect(() => {
    if (isTracking) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => { releaseWakeLock(); };
  }, [isTracking]);

  // Salva o timestamp de atividade a cada segundo enquanto rastreia
  useEffect(() => {
    if (!isTracking) return;
    const saveActiveTime = () => {
      localStorage.setItem('lifesteps_last_active_time', Date.now().toString());
    };
    saveActiveTime();
    const interval = setInterval(saveActiveTime, 1000);
    return () => clearInterval(interval);
  }, [isTracking]);

  // Sincroniza estado de rastreamento com localStorage
  useEffect(() => {
    localStorage.setItem('lifesteps_is_tracking', isTracking ? 'true' : 'false');
  }, [isTracking]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        if (wakeLockRef.current !== null) {
          await requestWakeLock();
        }
        document.title = 'LifeSteps';
        if (isTracking && user) {
          setStats(prev => checkAndRecoverBackgroundSteps(prev, user.id));
        }
      } else if (document.visibilityState === 'hidden' && isTracking) {
        document.title = `👣 ${stats.steps} passos`;
        localStorage.setItem('lifesteps_last_active_time', Date.now().toString());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = 'LifeSteps';
    };
  }, [isTracking, stats.steps, checkAndRecoverBackgroundSteps, user]);
  const [premiumPlan, setPremiumPlan] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Efeito para gerar plano de treino se for premium e não tiver um ou se o objetivo/nível mudou
  useEffect(() => {
    if (activeTab === Tab.WORKOUTS && user?.isPremium && !loadingPlan) {
      const planMatchesGoal = premiumPlan?.goal === user.goal;
      const planMatchesLevel = premiumPlan?.fitnessLevel === user.fitnessLevel;
      const planMatchesEnvironment = premiumPlan?.trainingEnvironment === user.trainingEnvironment;
      if (!premiumPlan || !planMatchesGoal || !planMatchesLevel || !planMatchesEnvironment) {
        generateWorkoutPlan();
      }
    }
  }, [activeTab, user?.isPremium, user?.goal, user?.fitnessLevel, user?.trainingEnvironment]);

  const generateWorkoutPlan = async () => {
    if (!user) return;
    setLoadingPlan(true);
    try {
      const plan = await getFitnessContent('workout', user.goal, user.fitnessLevel, user.trainingEnvironment);
      if (plan) {
        // Anexa o objetivo e nível ao plano para controle de versão/mudança
        setPremiumPlan({ ...plan, goal: user.goal, fitnessLevel: user.fitnessLevel, trainingEnvironment: user.trainingEnvironment });
      }
    } catch (e) {
      console.error("Erro ao carregar plano premium:", e);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!premiumPlan || !user) return;
    
    setLoadingPlan(true);
    try {
      const kcal = await calculateWorkoutCalories(premiumPlan, user);
      addExtraCalories(kcal, `Treino: ${premiumPlan.title}`);
      
      // Feedback visual ou navegação
      setActiveTab(Tab.REPORT);
    } catch (e) {
      console.error("Erro ao calcular calorias do treino:", e);
      addExtraCalories(300, `Treino: ${premiumPlan.title}`);
      setActiveTab(Tab.REPORT);
    } finally {
      setLoadingPlan(false);
    }
  };
  
  const lastStepTime = useRef<number>(0);
  const filteredAcc = useRef<number>(9.8);
  const movingAvgAcc = useRef<number>(9.8);
  const stepDetected = useRef<boolean>(false);

  const LPF_ALPHA = 0.15;
  const AVG_ALPHA = 0.05;
  const STEP_THRESHOLD = 1.15;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');
    
    if (token && email) {
      setAuthMode('reset-password');
      setFormData(prev => ({ ...prev, email }));
      // Limpar os parâmetros da URL para ficar limpo
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 1. CARREGAMENTO INICIAL DA SESSÃO
  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (savedProfile) {
      try {
        const parsedUser = JSON.parse(savedProfile);
        setUser(parsedUser);
        setIsLoggedIn(true);
        setActiveTab(Tab.DASHBOARD);
        
        // Carrega dados vinculados ao ID do usuário
        const userStatsKey = `${STORAGE_KEYS.STATS}_${parsedUser.id}`;
        const userHistoryKey = `${STORAGE_KEYS.WORKOUT_HISTORY}_${parsedUser.id}`;
        const userPlanKey = `lifesteps_premium_plan_${parsedUser.id}`;
        
        const savedStats = localStorage.getItem(userStatsKey);
        const today = new Date().toDateString();
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          if (parsed.date === today) {
            const recovered = checkAndRecoverBackgroundSteps(parsed.data, parsedUser.id);
            setStats(recovered);
          }
        }

        const savedHistory = localStorage.getItem(userHistoryKey);
        if (savedHistory) setWorkoutHistory(JSON.parse(savedHistory));

        const savedPlan = localStorage.getItem(userPlanKey);
        if (savedPlan) setPremiumPlan(JSON.parse(savedPlan));

      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
      }
    }
    const savedTheme = localStorage.getItem('app_theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme || 'dark');
  }, []);

  // 2. SINCRONIZAÇÃO AUTOMÁTICA DO PERFIL (PREMIUM, METAS, ETC)
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(user));
      
      // Atualiza na "lista de usuários registrados" para persistir entre logins
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const updatedUsers = storedUsers.map((u: UserProfile) => u.id === user.id ? user : u);
      localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
    }
  }, [user]);

  // 3. PERSISTÊNCIA DE STATS VINCULADA AO USUÁRIO
  useEffect(() => {
    if (user && isLoggedIn) {
      const today = new Date().toDateString();
      // Salva stats do dia atual
      localStorage.setItem(`${STORAGE_KEYS.STATS}_${user.id}`, JSON.stringify({
        date: today,
        data: stats
      }));

      // Atualiza histórico diário para o gráfico semanal
      const historyKey = `lifesteps_daily_history_${user.id}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
      history[today] = stats;

      // Mantém apenas os últimos 14 dias para não sobrecarregar o localStorage
      const dates = Object.keys(history);
      if (dates.length > 14) {
        const sortedDates = dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const toDelete = sortedDates.slice(0, dates.length - 14);
        toDelete.forEach(d => delete history[d]);
      }

      localStorage.setItem(historyKey, JSON.stringify(history));
    }
  }, [stats, user, isLoggedIn]);

  // 3.5. RESET DIÁRIO AUTOMÁTICO (Enquanto o app está aberto)
  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const checkDateChange = () => {
      const today = new Date().toDateString();
      const userStatsKey = `${STORAGE_KEYS.STATS}_${user.id}`;
      const savedStats = localStorage.getItem(userStatsKey);
      
      if (savedStats) {
        try {
          const parsed = JSON.parse(savedStats);
          if (parsed.date !== today) {
            // O dia mudou, resetar stats para o novo dia
            setStats({ steps: 0, calories: 0, distance: 0, activeTime: 0, waterIntake: 0 });
          }
        } catch (e) {
          console.error("Erro ao verificar mudança de data:", e);
        }
      }
    };

    // Verifica a cada minuto se o dia mudou
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, user]);

  // 4. PERSISTÊNCIA DE HISTÓRICO VINCULADA AO USUÁRIO
  useEffect(() => {
    if (user && isLoggedIn) {
      localStorage.setItem(`${STORAGE_KEYS.WORKOUT_HISTORY}_${user.id}`, JSON.stringify(workoutHistory));
    }
  }, [workoutHistory, user, isLoggedIn]);

  // 5. PERSISTÊNCIA DO PLANO PREMIUM
  useEffect(() => {
    if (user) {
      const key = `lifesteps_premium_plan_${user.id}`;
      if (premiumPlan) {
        localStorage.setItem(key, JSON.stringify(premiumPlan));
      } else if (isLoggedIn) {
        localStorage.removeItem(key);
      }
    }
  }, [premiumPlan, user, isLoggedIn]);

  // 6. LÓGICA DE NOTIFICAÇÃO DE ÁGUA (E-MAIL)
  useEffect(() => {
    if (!isLoggedIn || !user?.waterNotificationsEnabled || !user?.email) return;

    const WATER_INTERVAL = 3 * 60 * 60 * 1000; // 3 horas
    const checkNotification = () => {
      const lastNotify = localStorage.getItem(`last_water_notify_${user.id}`);
      const now = Date.now();

      if (!lastNotify || (now - parseInt(lastNotify)) >= WATER_INTERVAL) {
        console.log(`[SIMULAÇÃO E-MAIL] Enviando lembrete de água para: ${user.email}`);
        // Aqui seria a chamada para uma API real de e-mail
        // fetch('/api/send-water-reminder', { method: 'POST', body: JSON.stringify({ email: user.email }) });
        
        localStorage.setItem(`last_water_notify_${user.id}`, now.toString());
      }
    };

    // Verifica ao carregar e a cada minuto
    checkNotification();
    const interval = setInterval(checkNotification, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, user?.waterNotificationsEnabled, user?.email, user?.id]);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode light-theme' : '';
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const addStep = useCallback(() => {
    setStats(prev => {
      let kcalFactor = CALORIES_PER_STEP;
      let distFactor = DISTANCE_PER_STEP;
      let timeFactor = TIME_PER_STEP;

      if (activityMode === 'jogging') {
        kcalFactor = CALORIES_PER_STEP_JOGGING;
        distFactor = DISTANCE_PER_STEP_JOGGING;
        timeFactor = TIME_PER_STEP_JOGGING;
      } else if (activityMode === 'running') {
        kcalFactor = CALORIES_PER_STEP_RUNNING;
        distFactor = DISTANCE_PER_STEP_RUNNING;
        timeFactor = TIME_PER_STEP_RUNNING;
      }

      const newStats = {
        ...prev,
        steps: prev.steps + 1,
        calories: Math.round((prev.calories + kcalFactor) * 100) / 100,
        distance: Math.round((prev.distance + distFactor) * 1000000) / 1000000,
        activeTime: prev.activeTime + (timeFactor * 60)
      };
      
      // Persistência imediata para evitar perda em segundo plano
      if (user) {
        localStorage.setItem(`${STORAGE_KEYS.STATS}_${user.id}`, JSON.stringify({
          date: new Date().toDateString(),
          data: newStats
        }));
      }
      
      return newStats;
    });
  }, [user, activityMode]);

  const addExtraCalories = useCallback((kcal: number, activityName: string) => {
    setStats(prev => ({ ...prev, calories: prev.calories + kcal }));
    
    // Adiciona ao histórico de treinos
    const newWorkout: WorkoutHistoryItem = {
      id: Date.now().toString(),
      name: activityName,
      duration: 30, // Duração estimada padrão se não informada
      date: new Date().toISOString(),
      caloriesBurned: kcal
    };
    setWorkoutHistory(prev => [newWorkout, ...prev]);
  }, []);

  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isTracking) return;
    
    // Se estiver offline e não for premium, não conta passos
    if (!isOnline && user && !user.isPremium) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
    
    const rawMagnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    filteredAcc.current = LPF_ALPHA * rawMagnitude + (1 - LPF_ALPHA) * filteredAcc.current;
    movingAvgAcc.current = AVG_ALPHA * filteredAcc.current + (1 - AVG_ALPHA) * movingAvgAcc.current;
    const diff = filteredAcc.current - movingAvgAcc.current;
    const now = Date.now();

    if (diff > STEP_THRESHOLD && !stepDetected.current) {
      if (now - lastStepTime.current > 330) {
        addStep();
        lastStepTime.current = now;
        stepDetected.current = true;
      }
    } else if (diff < (STEP_THRESHOLD * 0.5)) {
      stepDetected.current = false;
    }
  }, [addStep, isTracking]);

  useEffect(() => {
    if (isTracking) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isTracking, handleMotion]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');

    if (authMode === 'forgot-password') {
      const existingUser = storedUsers.find((u: any) => u.email === formData.email);
      if (existingUser) {
        setAuthError("E-mail verificado! Para fins de offline, você pode redefinir sua senha agora.");
        setAuthMode('reset-password');
      } else {
        setAuthError("E-mail não encontrado em nossa base.");
      }
      return;
    }

    if (authMode === 'reset-password') {
      const existingUser = storedUsers.find((u: any) => u.email === formData.email);
      if (existingUser) {
        existingUser.password = formData.password;
        localStorage.setItem('registered_users', JSON.stringify(storedUsers));
        setAuthError("Senha redefinida com sucesso! Faça login.");
        setAuthMode('login');
      } else {
        setAuthError("Erro ao redefinir senha: Usuário não encontrado.");
      }
      return;
    }

    if (authMode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setAuthError("As senhas não coincidem!");
        return;
      }
      
      const emailExists = storedUsers.some((u: any) => u.email === formData.email);
      if (emailExists) {
        setAuthError("Este e-mail já está em uso!");
        return;
      }

      const newUser: UserProfile = {
        id: Date.now().toString(), name: formData.name, email: formData.email,
        password: formData.password, age: parseInt(formData.age) || 25,
        weight: parseFloat(formData.weight) || 70, height: parseFloat(formData.height) || 170,
        goal: formData.goal, fitnessLevel: formData.fitnessLevel, trainingEnvironment: formData.trainingEnvironment, stepGoal: DEFAULT_GOAL, gender: 'other', isPremium: false,
        waterNotificationsEnabled: false
      };
      storedUsers.push(newUser);
      localStorage.setItem('registered_users', JSON.stringify(storedUsers));
      loginUser(newUser);
    } else {
      const existingUser = storedUsers.find((u: any) => u.email === formData.email && u.password === formData.password);
      if (existingUser) loginUser(existingUser);
      else setAuthError("E-mail ou senha incorretos.");
    }
  };

  const loginUser = (userProfile: UserProfile) => {
    setUser(userProfile);
    setIsLoggedIn(true);
    setActiveTab(Tab.DASHBOARD);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
    
    // Carregar dados específicos após login
    const userStatsKey = `${STORAGE_KEYS.STATS}_${userProfile.id}`;
    const userHistoryKey = `${STORAGE_KEYS.WORKOUT_HISTORY}_${userProfile.id}`;
    
    const savedStats = localStorage.getItem(userStatsKey);
    const today = new Date().toDateString();
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      if (parsed.date === today) {
        const recovered = checkAndRecoverBackgroundSteps(parsed.data, userProfile.id);
        setStats(recovered);
      } else {
        setStats({ steps: 0, calories: 0, distance: 0, activeTime: 0, waterIntake: 0 });
      }
    } else {
      setStats({ steps: 0, calories: 0, distance: 0, activeTime: 0, waterIntake: 0 });
    }

    const savedHistory = localStorage.getItem(userHistoryKey);
    setWorkoutHistory(savedHistory ? JSON.parse(savedHistory) : []);

    const userPlanKey = `lifesteps_premium_plan_${userProfile.id}`;
    const savedPlan = localStorage.getItem(userPlanKey);
    setPremiumPlan(savedPlan ? JSON.parse(savedPlan) : null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthMode('login');
    setActiveTab(Tab.LOGIN);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    setIsTracking(false);
    setStats({ steps: 0, calories: 0, distance: 0, activeTime: 0, waterIntake: 0 });
    setWorkoutHistory([]);
    setPremiumPlan(null);
  };

  const toggleTracking = () => {
    if (!isTracking) {
      const startTracking = () => setIsTracking(true);
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission().then((state: string) => {
          if (state === 'granted') startTracking();
        });
      } else {
        startTracking();
      }
    } else {
      setIsTracking(false);
    }
  };

  const getWeekData = useCallback(() => {
    if (!user) return [];
    
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Dom) a 6 (Sáb)
    
    // Calcula o domingo da semana atual
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);
    
    const weekData = [];
    const historyKey = `lifesteps_daily_history_${user.id}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const dateStr = date.toDateString();
      
      let steps = 0;
      if (dateStr === today.toDateString()) {
        steps = stats.steps;
      } else {
        steps = history[dateStr]?.steps || 0;
      }
      
      weekData.push({
        day: days[i],
        steps: steps,
        isToday: dateStr === today.toDateString()
      });
    }
    return weekData;
  }, [user, stats.steps]);

  const isDark = theme === 'dark';

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 py-12 transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
        <div className={`w-full max-w-sm glass-card rounded-[40px] p-8 border ${isDark ? 'border-white/10' : 'border-black/10 shadow-2xl'}`}>
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                <i className="fa-solid fa-shoe-prints text-white text-3xl"></i>
             </div>
             <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>lifesteps</h1>
             <p className={`${isDark ? 'text-white/40' : 'text-black/60'} text-[10px] mt-1 font-black uppercase tracking-[0.2em]`}>Pedometer de Alta Performance</p>
          </div>
          <div className={`flex ${isDark ? 'bg-white/5' : 'bg-black/5'} p-1 rounded-xl mb-6`}>
            {['login', 'signup', 'forgot-password'].map(mode => (
              <button key={mode} onClick={() => { setAuthMode(mode as any); setAuthError(null); }} className={`flex-1 py-2 text-[8px] uppercase tracking-widest font-black rounded-lg transition-all ${authMode === mode ? 'bg-blue-600 text-white shadow-lg' : isDark ? 'text-white/30' : 'text-black/40'}`}>
                {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Cadastrar' : 'Esqueci'}
              </button>
            ))}
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'forgot-password' && (
              <p className={`text-[10px] text-center mb-4 ${isDark ? 'text-white/40' : 'text-black/60'} font-bold uppercase tracking-widest`}>
                Digite seu e-mail para receber o link de confirmação
              </p>
            )}
            {authMode === 'reset-password' && (
              <p className={`text-[10px] text-center mb-4 ${isDark ? 'text-white/40' : 'text-black/60'} font-bold uppercase tracking-widest`}>
                Defina sua nova senha para {formData.email}
              </p>
            )}
            {authMode === 'signup' && (
              <>
                <input type="text" placeholder="Nome" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Idade" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none`} value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} required />
                  <input type="number" placeholder="Peso (kg)" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none`} value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} required />
                </div>
                <input type="number" placeholder="Altura (cm)" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none`} value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} required />
                <select className={`w-full ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none font-bold`} value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value as UserGoal})}>
                  <option value="weight_loss">Emagrecer</option>
                  <option value="muscle_gain">Ganhar Massa</option>
                  <option value="maintenance">Manter a Forma</option>
                </select>
                <select className={`w-full ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none font-bold`} value={formData.fitnessLevel} onChange={e => setFormData({...formData, fitnessLevel: e.target.value as FitnessLevel})}>
                  <option value="very_light">Muito Leve</option>
                  <option value="light">Leve</option>
                  <option value="moderate">Moderado</option>
                  <option value="hard">Difícil</option>
                  <option value="very_hard">Muito Difícil</option>
                </select>
                <select className={`w-full ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none font-bold`} value={formData.trainingEnvironment} onChange={e => setFormData({...formData, trainingEnvironment: e.target.value as TrainingEnvironment})}>
                  <option value="home">Treinar em Casa</option>
                  <option value="gym">Treinar na Academia</option>
                </select>
              </>
            )}
            <input type="email" placeholder="E-mail" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={authMode === 'reset-password'} />
            {(authMode === 'login' || authMode === 'signup' || authMode === 'reset-password') && (
              <input type="password" placeholder={authMode === 'reset-password' ? "Nova Senha" : "Senha"} className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none`} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            )}
            {authMode === 'signup' && <input type="password" placeholder="Confirmar Senha" className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black'} border rounded-xl px-4 py-3 text-sm focus:outline-none`} value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required />}
            {authError && <p className={`text-center text-[10px] font-black uppercase tracking-tighter py-2 rounded-lg ${authError.includes("sucesso") || authError.includes("verificado") ? 'text-emerald-600 bg-emerald-600/10' : 'text-red-600 bg-red-600/10'}`}>{authError}</p>}
            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-black uppercase tracking-widest transition-all shadow-xl">
              {authMode === 'login' ? 'Entrar Agora' : authMode === 'signup' ? 'Finalizar Cadastro' : authMode === 'forgot-password' ? 'Confirmar E-mail' : 'Redefinir Senha'}
            </button>
            {authMode === 'login' && (
              <button type="button" onClick={() => { setAuthMode('forgot-password'); setAuthError(null); }} className={`w-full text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/20 hover:text-white/40' : 'text-black/30 hover:text-black/50'} transition-all mt-2`}>
                Esqueceu a senha?
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto relative pb-24 transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>life<span className="text-blue-600">steps</span></h1>
          <div className="flex items-center gap-2 mt-1">
             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border transition-all ${isTracking ? 'bg-blue-600/10 border-blue-500/20 text-blue-600' : 'bg-black/5 border-black/10 text-black/20'} uppercase`}>
               <i className={`fa-solid fa-person-walking mr-1 ${isTracking && 'animate-bounce'}`}></i>
               {isTracking ? 'Monitoramento Ativo (Segundo Plano)' : 'Pausado'}
             </span>
             {!isOnline && (
               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${user?.isPremium ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-600' : 'bg-red-600/10 border-red-500/20 text-red-600'} uppercase`}>
                 <i className={`fa-solid ${user?.isPremium ? 'fa-cloud-slash' : 'fa-triangle-exclamation'} mr-1`}></i>
                 {user?.isPremium ? 'Modo Offline Ativo' : 'Sem Conexão'}
               </span>
             )}
          </div>
        </div>
        <button onClick={handleLogout} className={`w-10 h-10 rounded-full ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} flex items-center justify-center border transition-all`}>
          <i className={`fa-solid fa-power-off ${isDark ? 'text-white/40' : 'text-black/60'} text-xs`}></i>
        </button>
      </header>

      {!isOnline && !user?.isPremium && (
        <div className="mx-6 mb-4 p-4 bg-red-600/10 border border-red-600/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
            <i className="fa-solid fa-crown"></i>
          </div>
          <div>
            <p className="text-red-600 text-[10px] font-black uppercase tracking-widest mb-0.5">Recurso Premium</p>
            <p className={`text-[9px] ${isDark ? 'text-white/60' : 'text-black/60'} leading-tight`}>O contador de passos offline é exclusivo para membros PRO. Conecte-se à internet para continuar.</p>
          </div>
        </div>
      )}

      {activeTab === Tab.DASHBOARD && (
        <main className="flex-1 overflow-y-auto px-4">
          <StepCircle current={stats.steps} goal={user?.stepGoal || DEFAULT_GOAL} isDark={isDark} />
          
          {/* Card União Android e Segundo Plano */}
          <div 
            onClick={() => setShowBackgroundSettings(true)} 
            className={`cursor-pointer mt-2 mb-6 p-4 rounded-3xl border transition-all flex items-center justify-between group ${
              isTracking 
                ? isDark 
                  ? 'bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/15'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100/50'
                : isDark
                  ? 'bg-zinc-900 border-white/5 hover:bg-zinc-850'
                  : 'bg-zinc-50 border-black/5 hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center gap-3 animate-in fade-in duration-500">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isTracking ? 'bg-blue-600 text-white animate-pulse' : 'bg-zinc-700/10 text-zinc-500'
              }`}>
                <i className="fa-solid fa-person-running text-lg"></i>
              </div>
              <div className="text-left">
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
                  {isTracking ? 'Segundo Plano Ativo' : 'Rastreamento Inativo'}
                </h4>
                <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/50'} leading-snug`}>
                  {isTracking 
                    ? 'Ganhando passos simulados ao fechar/minimizar o app!' 
                    : 'Aprenda como configurar em segundo plano no Android.'}
                </p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-blue-500/50 group-hover:translate-x-0.5 transition-all"></i>
          </div>

          {/* Seletor de Ritmo de Atividade (Caminhada vs Trote vs Corrida) */}
          <div className={`mb-6 p-4 rounded-3xl border transition-all ${
            isDark ? 'bg-zinc-900/60 border-white/5' : 'bg-zinc-50 border-black/5 shadow-sm'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white/90' : 'text-black/95'}`}>
                  Método de Cálculo
                </h4>
                <p className={`text-[9px] ${isDark ? 'text-white/30' : 'text-black/40'} tracking-wide`}>
                  Defina o ritmo para modular passos e calorias em tempo real
                </p>
              </div>
              <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase border transition-all ${
                activityMode === 'running' 
                  ? 'bg-rose-600/10 border-rose-500/20 text-rose-500 animate-pulse'
                  : activityMode === 'jogging'
                    ? 'bg-amber-600/10 border-amber-500/20 text-amber-500 animate-pulse'
                    : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500'
              }`}>
                {activityMode === 'running' ? 'Módulo Corrida' : activityMode === 'jogging' ? 'Módulo Trote' : 'Módulo Caminhada'}
              </span>
            </div>

            <div className={`p-1 rounded-2xl flex gap-1 ${isDark ? 'bg-black/40' : 'bg-black/5'}`}>
              <button 
                onClick={() => setActivityMode('walking')}
                className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                  activityMode === 'walking' 
                    ? isDark 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : 'bg-white text-black shadow'
                    : isDark ? 'text-white/40 hover:text-white/70' : 'text-black/50 hover:text-black/80'
                }`}
              >
                <i className="fa-solid fa-person-walking text-xs"></i>
                Caminhar
              </button>
              <button 
                onClick={() => setActivityMode('jogging')}
                className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                  activityMode === 'jogging' 
                    ? isDark 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                      : 'bg-white text-black shadow'
                    : isDark ? 'text-white/40 hover:text-white/70' : 'text-black/50 hover:text-black/80'
                }`}
              >
                <i className="fa-solid fa-person-running text-xs text-amber-500"></i>
                Trote
              </button>
              <button 
                onClick={() => setActivityMode('running')}
                className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                  activityMode === 'running' 
                    ? isDark 
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                      : 'bg-white text-black shadow'
                    : isDark ? 'text-white/40 hover:text-white/70' : 'text-black/50 hover:text-black/80'
                }`}
              >
                <i className="fa-solid fa-person-running text-xs text-rose-500"></i>
                Correr
              </button>
            </div>

            <p className={`text-[9px] text-center ${isDark ? 'text-white/20' : 'text-black/40'} mt-3 leading-relaxed`}>
              {activityMode === 'running' 
                ? '⚡ Corrida Turbinada: Utiliza 0.11 Kcal/passo com passada larga de 1.15m.' 
                : activityMode === 'jogging'
                  ? '🏃‍♂️ Trote Moderado: Utiliza 0.075 Kcal/passo com passada média de 92cm.'
                  : '👣 Caminhada Firme: Utiliza 0.04 Kcal/passo com passada padrão de 76cm.'}
            </p>
          </div>

          <StatsGrid stats={stats} isDark={isDark} />
          {user?.isPremium && <ActivityCalculator profile={user} onAddCalories={addExtraCalories} isPremium={user.isPremium} isDark={isDark} />}
          <WaterTracker 
            current={stats.waterIntake} 
            onAdd={(a) => setStats(s => ({...s, waterIntake: s.waterIntake + a}))} 
            onRemove={(a) => setStats(s => ({...s, waterIntake: Math.max(0, s.waterIntake - a)}))}
            notificationsEnabled={notificationsAllowed} 
            onToggleNotifications={() => setNotificationsAllowed(!notificationsAllowed)} 
            isDark={isDark} 
          />
        </main>
      )}

      {activeTab === Tab.WORKOUTS && (
        <main className="flex-1 px-4 overflow-y-auto pb-8">
          {!user?.isPremium ? (
            <PremiumAdvantagesPage onUpgrade={() => { if(user) { setUser({...user, isPremium: true}); } }} isDark={isDark} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
               {loadingPlan ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                    <i className="fa-solid fa-circle-notch animate-spin text-4xl text-blue-600 mb-4"></i>
                    <p className={`font-black uppercase tracking-widest text-[10px] mt-4 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Carregando seu plano de treino...</p>
                 </div>
               ) : premiumPlan ? (
                 <>
                   <div className="flex justify-between items-start mt-6 mb-6">
                     <div>
                       <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'} mb-1 capitalize`}>{premiumPlan.title || 'Seu Plano de Treino'}</h2>
                       <div className="flex items-center gap-2">
                         <p className={`${isDark ? 'text-white/40' : 'text-black/40'} text-[10px] font-black uppercase tracking-[0.2em]`}>Sua Rotina Programada</p>
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${
                           user.fitnessLevel === 'very_light' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                           user.fitnessLevel === 'light' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-500' :
                           user.fitnessLevel === 'moderate' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                           user.fitnessLevel === 'hard' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' :
                           'bg-red-500/10 border-red-500/20 text-red-600'
                         }`}>
                           {user.fitnessLevel === 'very_light' ? 'Muito Leve' : 
                            user.fitnessLevel === 'light' ? 'Leve' : 
                            user.fitnessLevel === 'moderate' ? 'Moderado' : 
                            user.fitnessLevel === 'hard' ? 'Difícil' : 'Muito Difícil'}
                         </span>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <select 
                         value={user.fitnessLevel}
                         onChange={(e) => setUser({...user, fitnessLevel: e.target.value as any})}
                         className={`h-10 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none ${
                           isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-black/5 border-black/10 text-black/60'
                         }`}
                       >
                         <option value="very_light">Muito Leve</option>
                         <option value="light">Leve</option>
                         <option value="moderate">Moderado</option>
                         <option value="hard">Difícil</option>
                         <option value="very_hard">Muito Difícil</option>
                       </select>
                       <button 
                        onClick={() => { setPremiumPlan(null); generateWorkoutPlan(); }} 
                        disabled={loadingPlan}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/10 text-black/40'} hover:text-blue-600 transition-all disabled:opacity-30`}
                       >
                         <i className={`fa-solid fa-arrows-rotate text-xs ${loadingPlan ? 'animate-spin' : ''}`}></i>
                       </button>
                     </div>
                   </div>

                   <div className="space-y-4 mb-8">
                    {premiumPlan.items && Array.isArray(premiumPlan.items) ? premiumPlan.items.map((ex: any, i: number) => (
                      <div key={i} className={`glass-card rounded-2xl p-5 border ${isDark ? 'border-white/5' : 'border-black/5 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={`font-black text-sm uppercase ${isDark ? 'text-white' : 'text-black'}`}>{ex.name || 'Exercício'}</h3>
                          <div className="flex gap-2">
                            <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">{ex.sets || '3'}x</span>
                            <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">{ex.reps || '12'}</span>
                          </div>
                        </div>
                        <p className={`${isDark ? 'text-white/60' : 'text-black/60'} text-xs leading-relaxed mb-3`}>{ex.instructions || 'Siga as instruções para uma execução segura.'}</p>
                        {ex.tips && (
                          <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'} flex gap-3 items-start border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                            <i className="fa-solid fa-lightbulb text-yellow-500 text-[10px] mt-0.5"></i>
                            <p className={`${isDark ? 'text-white/40' : 'text-black/50'} text-[10px] italic font-medium`}>{ex.tips}</p>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-center py-10">
                        <p className="text-xs text-white/20">Nenhum exercício encontrado. Tente gerar novamente.</p>
                      </div>
                    )}
                   </div>

                   <button 
                    onClick={handleCompleteWorkout}
                    disabled={loadingPlan}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all mb-12 disabled:opacity-50"
                   >
                    {loadingPlan ? (
                      <i className="fa-solid fa-spinner animate-spin mr-2"></i>
                    ) : (
                      <i className="fa-solid fa-check-double mr-2"></i>
                    )}
                    {loadingPlan ? 'Processando...' : 'Concluir Treino de Hoje'}
                   </button>

                   <div className="mt-4">
                    <h3 className={`font-black text-xs uppercase tracking-widest mb-4 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Histórico Recente</h3>
                    <WorkoutHistory history={workoutHistory.slice(0, 3)} isDark={isDark} />
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
                       <i className="fa-solid fa-dumbbell text-blue-600 text-2xl"></i>
                    </div>
                    <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-black'} mb-2`}>Pronto para começar?</h3>
                <p className={`${isDark ? 'text-white/40' : 'text-black/40'} text-xs mb-8 max-w-[200px]`}>Escolha sua intensidade e receba o treino perfeito.</p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                       {['very_light', 'light', 'moderate', 'hard', 'very_hard'].map((level) => (
                         <button
                           key={level}
                           onClick={() => setUser({...user, fitnessLevel: level as any})}
                           className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                             user.fitnessLevel === level 
                               ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                               : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-black/5 border-black/10 text-black/40'
                           }`}
                         >
                           {level === 'very_light' ? 'Muito Leve' : 
                            level === 'light' ? 'Leve' : 
                            level === 'moderate' ? 'Moderado' : 
                            level === 'hard' ? 'Difícil' : 'Muito Difícil'}
                         </button>
                       ))}
                    </div>

                    <button onClick={generateWorkoutPlan} className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                      Ver Meu Plano
                    </button>
                 </div>
               )}
            </div>
          )}
        </main>
      )}

      {activeTab === Tab.DIET && (
        <main className="flex-1 px-4 overflow-y-auto pb-8">
           {!user?.isPremium ? (
            <PremiumAdvantagesPage onUpgrade={() => { if(user) { setUser({...user, isPremium: true}); } }} isDark={isDark} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'} mt-6 mb-2`}>Construtor de Dieta</h2>
              <p className={`${isDark ? 'text-white/40' : 'text-black/40'} text-[10px] font-black uppercase tracking-[0.2em] mb-8`}>Monte seu dia e valide sua dieta</p>
              <DietBuilder profile={user!} isDark={isDark} />
            </div>
          )}
        </main>
      )}

      {activeTab === Tab.REPORT && (
        <main className="flex-1 px-4 overflow-y-auto">
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'} mt-6 mb-2`}>Relatório Semanal</h2>
          <p className={`${isDark ? 'text-white/40' : 'text-black/40'} text-[10px] font-black uppercase tracking-[0.2em] mb-8`}>Seu progresso nos últimos dias</p>
          
          <WeeklyChart data={getWeekData()} isDark={isDark} />
          
          <div className="mt-10 mb-8">
            <h3 className={`font-black text-sm uppercase tracking-widest mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Histórico de Atividades</h3>
            <WorkoutHistory history={workoutHistory} isDark={isDark} />
          </div>
        </main>
      )}

      {activeTab === Tab.PROFILE && user && (
        <main className="flex-1 px-4 overflow-y-auto">
          <ProfilePage 
            user={user} 
            onLogout={handleLogout} 
            onUpdateUser={(updated) => setUser(updated)}
            onViewPremium={() => setActiveTab(Tab.PREMIUM_ADVANTAGES)} 
            theme={theme} 
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            onOpenBackgroundSettings={() => setShowBackgroundSettings(true)}
          />
        </main>
      )}

      <div className="fixed bottom-28 right-6 z-40">
        <button onClick={toggleTracking} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isTracking ? 'bg-red-600 rotate-45 shadow-red-600/40' : 'bg-blue-600 shadow-blue-600/40'}`}>
          <i className={`fa-solid ${isTracking ? 'fa-plus' : 'fa-play'} text-white text-2xl`}></i>
        </button>
      </div>

      <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-card rounded-t-[32px] border-t ${isDark ? 'border-white/10' : 'border-black/5'} px-4 py-4 flex justify-between items-center z-50`}>
        {[
          { id: Tab.DASHBOARD, icon: 'fa-house', label: 'Início' },
          { id: Tab.WORKOUTS, icon: 'fa-dumbbell', label: 'Treino' },
          { id: Tab.DIET, icon: 'fa-apple-whole', label: 'Dieta' },
          { id: Tab.REPORT, icon: 'fa-chart-simple', label: 'Status' },
          { id: Tab.PROFILE, icon: 'fa-user', label: 'Perfil' },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === item.id ? 'text-blue-600' : isDark ? 'text-white/20' : 'text-black/40'}`}>
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toast Notificação de Passos em Segundo Plano */}
      {bgStepsAdded !== null && (
        <div className="fixed top-6 left-4 right-4 z-50 animate-in slide-in-from-top-12 duration-500">
          <div className="max-w-md mx-auto p-4 bg-blue-600 text-white rounded-2xl flex items-center justify-between shadow-2xl border border-blue-500/35">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg shrink-0">
                <i className="fa-solid fa-person-walking"></i>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Passos Coletados</p>
                <p className="text-xs font-black">Você ganhou +{bgStepsAdded.toLocaleString()} passos em segundo plano!</p>
              </div>
            </div>
            <button 
              onClick={() => setBgStepsAdded(null)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition-all text-white"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* Modal Guias & Configuração de Segundo Plano e Códigos Android */}
      <BackgroundSettingsModal 
        isOpen={showBackgroundSettings}
        onClose={() => setShowBackgroundSettings(false)}
        isTracking={isTracking}
        onToggleTracking={toggleTracking}
        isDark={isDark}
      />
    </div>
  );
};

export default App;
