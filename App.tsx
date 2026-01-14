
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StepCircle } from './components/StepCircle';
import { StatsGrid } from './components/StatsGrid';
import { WaterTracker } from './components/WaterTracker';
import { WeeklyChart } from './components/WeeklyChart';
import { ActivityCalculator } from './components/ActivityCalculator';
import { ProfilePage } from './components/ProfilePage';
import { WorkoutHistory } from './components/WorkoutHistory';
import { PremiumAdvantagesPage } from './components/PremiumAdvantagesPage';
import { DailyStats, UserProfile, Tab, UserGoal, WorkoutHistoryItem } from './types';
import { STORAGE_KEYS, DEFAULT_GOAL, CALORIES_PER_STEP, DISTANCE_PER_STEP, TIME_PER_STEP } from './constants';
import { getHealthAdvice, getFitnessContent } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LOGIN);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    weight: '',
    height: '',
    goal: 'maintenance' as UserGoal
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [stats, setStats] = useState<DailyStats>({
    steps: 0, calories: 0, distance: 0, activeTime: 0, waterIntake: 0
  });
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>("Pronto para sua caminhada?");
  const [isTracking, setIsTracking] = useState(false);
  const [premiumContent, setPremiumContent] = useState<string>("");
  
  const lastStepTime = useRef<number>(0);
  const filteredAcc = useRef<number>(9.8);
  const movingAvgAcc = useRef<number>(9.8);
  const stepDetected = useRef<boolean>(false);

  const LPF_ALPHA = 0.15;
  const AVG_ALPHA = 0.05;
  const STEP_THRESHOLD = 1.15;

  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (savedProfile) {
      try {
        const parsedUser = JSON.parse(savedProfile);
        setUser(parsedUser);
        setIsLoggedIn(true);
        setActiveTab(Tab.DASHBOARD);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
      }
    }

    if ("Notification" in window) {
      setNotificationsAllowed(Notification.permission === "granted");
    }
    const savedHistory = localStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
    if (savedHistory) setWorkoutHistory(JSON.parse(savedHistory));
    
    const savedTheme = localStorage.getItem('app_theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme || 'dark');
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-mode');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Busca conselho da IA quando no dashboard ou quando os stats mudam
  useEffect(() => {
    if (isLoggedIn && user && activeTab === Tab.DASHBOARD) {
      const updateAdvice = async () => {
        const advice = await getHealthAdvice(stats, user);
        setAiAdvice(advice);
      };
      const timer = setTimeout(updateAdvice, 5000);
      return () => clearTimeout(timer);
    }
  }, [stats.steps, stats.waterIntake, isLoggedIn, user, activeTab]);

  // Busca conteúdo premium para abas de treino ou dieta
  useEffect(() => {
    if (isLoggedIn && user?.isPremium && (activeTab === Tab.WORKOUTS || activeTab === Tab.DIET)) {
      const fetchPremiumContent = async () => {
        setPremiumContent("Gerando seu plano exclusivo com IA...");
        const type = activeTab === Tab.WORKOUTS ? 'workout' : 'diet';
        const content = await getFitnessContent(type, user.goal);
        setPremiumContent(content);
      };
      fetchPremiumContent();
    }
  }, [activeTab, isLoggedIn, user]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleToggleNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Seu navegador não suporta notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsAllowed(permission === "granted");
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    const storedUsersString = localStorage.getItem('registered_users');
    const storedUsers = storedUsersString ? JSON.parse(storedUsersString) : [];

    if (authMode === 'signup') {
      if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
        setAuthError("Preencha todos os campos obrigatórios.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setAuthError("As senhas não coincidem!");
        return;
      }
      if (formData.password.length < 6) {
        setAuthError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
      
      const emailExists = storedUsers.some((u: any) => u.email === formData.email);
      if (emailExists) {
        setAuthError("Este e-mail já está cadastrado.");
        return;
      }

      const newUser: UserProfile = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age) || 25,
        weight: parseFloat(formData.weight) || 70,
        height: parseFloat(formData.height) || 170,
        goal: formData.goal,
        stepGoal: DEFAULT_GOAL,
        gender: 'other',
        isPremium: false
      };
      
      storedUsers.push(newUser);
      localStorage.setItem('registered_users', JSON.stringify(storedUsers));
      loginUser(newUser);
    } else {
      const existingUser = storedUsers.find((u: any) => u.email === formData.email && u.password === formData.password);
      if (existingUser) {
        loginUser(existingUser);
      } else {
        setAuthError("E-mail ou senha incorretos.");
      }
    }
  };

  const loginUser = (userProfile: UserProfile) => {
    setUser(userProfile);
    setIsLoggedIn(true);
    setActiveTab(Tab.DASHBOARD);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
    setFormData({
      email: '', password: '', confirmPassword: '', name: '',
      age: '', weight: '', height: '', goal: 'maintenance'
    });
  };

  const handleUpgrade = () => {
    if (user) {
      const updatedUser = { ...user, isPremium: true };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedUser));
      
      const storedUsersString = localStorage.getItem('registered_users');
      if (storedUsersString) {
        try {
          const storedUsers = JSON.parse(storedUsersString);
          const index = storedUsers.findIndex((u: any) => u.email === user.email);
          if (index !== -1) {
            storedUsers[index] = updatedUser;
            localStorage.setItem('registered_users', JSON.stringify(storedUsers));
          }
        } catch (e) {
          console.error("Erro ao atualizar lista de usuários", e);
        }
      }
      setActiveTab(Tab.DASHBOARD);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthMode('login');
    setActiveTab(Tab.LOGIN);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  };

  const addStep = useCallback(() => {
    setStats(prev => ({
      ...prev,
      steps: prev.steps + 1,
      calories: prev.calories + CALORIES_PER_STEP,
      distance: prev.distance + DISTANCE_PER_STEP,
      activeTime: prev.activeTime + (TIME_PER_STEP * 60)
    }));
  }, []);

  const addExtraCalories = useCallback((kcal: number) => {
    setStats(prev => ({ ...prev, calories: prev.calories + kcal }));
  }, []);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
    
    const rawMagnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    filteredAcc.current = LPF_ALPHA * rawMagnitude + (1 - LPF_ALPHA) * filteredAcc.current;
    movingAvgAcc.current = AVG_ALPHA * filteredAcc.current + (1 - AVG_ALPHA) * movingAvgAcc.current;
    const diff = filteredAcc.current - movingAvgAcc.current;
    const now = Date.now();

    // Detecção de impacto via acelerômetro
    if (diff > STEP_THRESHOLD && !stepDetected.current) {
      if (now - lastStepTime.current > 330) {
        addStep();
        lastStepTime.current = now;
        stepDetected.current = true;
      }
    } else if (diff < (STEP_THRESHOLD * 0.5)) {
      stepDetected.current = false;
    }
  }, [addStep]);

  const toggleTracking = () => {
    if (!isTracking) {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission().then((state: string) => {
          if (state === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
            setIsTracking(true);
          }
        });
      } else {
        window.addEventListener('devicemotion', handleMotion);
        setIsTracking(true);
      }
    } else {
      window.removeEventListener('devicemotion', handleMotion);
      setIsTracking(false);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  const isDark = theme === 'dark';

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 py-12 overflow-y-auto transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
        <div className={`w-full max-w-sm glass-card rounded-[40px] p-8 border ${isDark ? 'border-white/10' : 'border-black/10 shadow-2xl'}`}>
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                <i className="fa-solid fa-shoe-prints text-white text-3xl"></i>
             </div>
             <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>lifesteps</h1>
             <p className={`${isDark ? 'text-white/40' : 'text-black/60'} text-xs mt-1 font-bold`}>Sua jornada fitness começa aqui</p>
          </div>

          <div className={`flex ${isDark ? 'bg-white/5' : 'bg-black/5'} p-1 rounded-xl mb-6`}>
            <button 
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-lg' : isDark ? 'text-white/30' : 'text-black/40'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); setAuthError(null); }}
              className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg transition-all ${authMode === 'signup' ? 'bg-blue-600 text-white shadow-lg' : isDark ? 'text-white/30' : 'text-black/40'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-sm'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600`} 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="number" 
                    placeholder="Idade" 
                    className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-sm'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600`} 
                    value={formData.age} 
                    onChange={e => setFormData({...formData, age: e.target.value})} 
                    required 
                  />
                  <input 
                    type="number" 
                    placeholder="Peso (kg)" 
                    className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-sm'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600`} 
                    value={formData.weight} 
                    onChange={e => setFormData({...formData, weight: e.target.value})} 
                    required 
                  />
                </div>
                <input 
                  type="number" 
                  placeholder="Altura (cm)" 
                  className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-sm'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600`} 
                  value={formData.height} 
                  onChange={e => setFormData({...formData, height: e.target.value})} 
                  required 
                />
                <select 
                  className={`w-full ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-sm'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 appearance-none`} 
                  value={formData.goal} 
                  onChange={e => setFormData({...formData, goal: e.target.value as UserGoal})}
                >
                  <option value="weight_loss">Emagrecer</option>
                  <option value="muscle_gain">Ganhar Massa</option>
                  <option value="maintenance">Manter Forma</option>
                </select>
              </>
            )}

            <input 
              type="email" 
              placeholder="E-mail" 
              className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-sm'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600`} 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="Senha" 
              className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-sm'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600`} 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
            
            {authMode === 'signup' && (
              <input 
                type="password" 
                placeholder="Confirmar Senha" 
                className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/10 text-black shadow-sm'} border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600`} 
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                required 
              />
            )}

            {authError && (
              <div className="bg-red-600/10 border border-red-600/20 py-3 px-4 rounded-xl">
                <p className="text-red-600 text-[11px] font-black text-center uppercase tracking-tighter">
                  <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                  {authError}
                </p>
              </div>
            )}

            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">
              {authMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen max-w-md mx-auto relative pb-24 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>life<span className="text-blue-600">steps</span></h1>
          <div className="flex items-center gap-2 mt-1">
            {user?.isPremium && <span className="text-yellow-600 text-[8px] font-black border border-yellow-600/30 px-1.5 rounded uppercase tracking-tighter">Premium</span>}
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${isTracking ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-black/5 border-black/5 text-black/30'} uppercase transition-all`}>
              <i className={`fa-solid fa-sensor mr-1 ${isTracking && 'animate-pulse'}`}></i>
              {isTracking ? 'Monitorando' : 'Sensor Desligado'}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className={`w-10 h-10 rounded-full ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} flex items-center justify-center border active:scale-90 transition-all`}>
          <i className={`fa-solid fa-right-from-bracket ${isDark ? 'text-white/40' : 'text-black/60'} text-xs`}></i>
        </button>
      </header>

      {activeTab === Tab.DASHBOARD && (
        <main className="flex-1 overflow-y-auto px-4 pb-4">
          <StepCircle current={stats.steps} goal={user?.stepGoal || DEFAULT_GOAL} isDark={isDark} />
          <StatsGrid stats={stats} isDark={isDark} />
          
          <div className={`bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-2xl p-4 mb-8 mx-4 border border-blue-500/20 flex gap-4`}>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
               <i className="fa-solid fa-robot text-white text-xs"></i>
            </div>
            <p className={`${isDark ? 'text-white' : 'text-black'} text-sm italic font-medium`}>"{aiAdvice}"</p>
          </div>
          
          {user?.isPremium && <ActivityCalculator profile={user} onAddCalories={addExtraCalories} isPremium={user.isPremium} isDark={isDark} />}
          <WaterTracker current={stats.waterIntake} onAdd={(a) => setStats(s => ({...s, waterIntake: s.waterIntake + a}))} notificationsEnabled={notificationsAllowed} onToggleNotifications={handleToggleNotifications} isDark={isDark} />
          <button onClick={addStep} className={`w-full py-2 border border-dashed ${isDark ? 'border-white/10 text-white/5' : 'border-black/10 text-black/20'} rounded-xl text-[8px] mb-4 uppercase hover:text-blue-600 transition-colors`}>Testar Passo Manualmente</button>
        </main>
      )}

      {(activeTab === Tab.WORKOUTS || activeTab === Tab.DIET) && (
        <main className="flex-1 px-4 overflow-y-auto pb-8">
          {!user?.isPremium ? (
            <PremiumAdvantagesPage onUpgrade={handleUpgrade} isDark={isDark} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
               <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'} mt-6 mb-4 capitalize`}>{activeTab === Tab.WORKOUTS ? 'Treino' : 'Dieta'} Personalizado</h2>
               <div className={`glass-card rounded-3xl p-6 ${isDark ? 'text-white/80' : 'text-black'} text-sm leading-relaxed whitespace-pre-line border border-yellow-500/10 mb-8 prose prose-invert max-w-none font-medium`}>{premiumContent}</div>
            </div>
          )}
        </main>
      )}

      {activeTab === Tab.REPORT && (
        <main className="flex-1 px-4">
          <WeeklyChart data={[{day: 'Hoje', steps: stats.steps, isToday: true}]} isDark={isDark} />
        </main>
      )}

      {activeTab === Tab.PROFILE && user && (
        <main className="flex-1 px-4 overflow-y-auto">
          <ProfilePage 
            user={user} 
            onLogout={handleLogout} 
            onViewPremium={() => setActiveTab(Tab.PREMIUM_ADVANTAGES)} 
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        </main>
      )}

      {activeTab === Tab.PREMIUM_ADVANTAGES && (
        <main className="flex-1 overflow-y-auto">
          <PremiumAdvantagesPage onUpgrade={handleUpgrade} onBack={() => setActiveTab(Tab.PROFILE)} isDark={isDark} />
        </main>
      )}

      <div className="fixed bottom-28 right-6">
        <button onClick={toggleTracking} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isTracking ? 'bg-red-600 rotate-45' : 'bg-blue-600'}`}>
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
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === item.id ? 'text-blue-600' : isDark ? 'text-white/20' : 'text-black/30'}`}>
            <i className={`fa-solid ${item.icon} text-lg`}></i>
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
