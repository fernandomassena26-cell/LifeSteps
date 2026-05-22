import React, { useState } from 'react';

interface BackgroundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTracking: boolean;
  onToggleTracking: () => void;
  isDark: boolean;
}

type TabType = 'web' | 'service' | 'worker' | 'manifest';

export const BackgroundSettingsModal: React.FC<BackgroundSettingsModalProps> = ({
  isOpen,
  onClose,
  isTracking,
  onToggleTracking,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('web');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.lifesteps.app">

    <!-- Permissão para rodar serviços em segundo plano no Android 9+ -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    
    <!-- Permissão com categoria específica exigida no Android 14+ (Health) -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_HEALTH" />
    
    <!-- Permissão para acessar os sensores corporais e contador de passos (Android 10+) -->
    <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
    
    <!-- Permissão para exibir notificações persistentes em segundo plano (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Permissão para inicializar o serviço automaticamente quando o celular ligar -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.LifeSteps">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- REGISTRO DO SEU FOREGROUND SERVICE -->
        <!-- O parâmetro 'foregroundServiceType' de saúde é obrigatório no Android 14+ -->
        <service
            android:name=".StepCounterService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="health" />

        <!-- Ouvinte para reiniciar o serviço se o celular for reiniciado -->
        <receiver
            android:name=".BootReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`;

  const codeService = `package com.lifesteps.app

import android.app.*
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import java.util.Calendar

/**
 * Serviço de Primeiro Plano (Foreground Service) nativo em Kotlin.
 * Ele permanece executando continuamente na barra do sistema, coletando passos
 * dos sensores de movimento físicos (passômetro interno) mesmo com o app fechado.
 */
class StepCounterService : Service(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var stepSensor: Sensor? = null
    private var startingSteps = -1

    companion object {
        const val CHANNEL_ID = "StepCounterServiceChannel"
        const val NOTIFICATION_ID = 101
    }

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        // Usando o sensor acelerômetro e o contador de passos nativo por hardware do Android
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        
        if (stepSensor != null) {
            // Registra o ouvinte para receber eventos de movimento o tempo inteiro
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_UI)
        }
        
        createNotificationChannel()
        val notification = createNotification("Rastreamento ativo • Calculando passos...")
        startForeground(NOTIFICATION_ID, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Indica que se o Android matar o serviço por falta de memória, ele deve ser recriado imediatamente
        return START_STICKY
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || event.sensor.type != Sensor.TYPE_STEP_COUNTER) return
        val currentTotalSteps = event.values[0].toInt()
        
        if (startingSteps < 0) {
            startingSteps = currentTotalSteps
        }
        val sessionSteps = currentTotalSteps - startingSteps
        
        // Salva os passos localmente no SharedPreferences (ou banco SQLite/Room)
        val sharedPref = getSharedPreferences("LifeStepsStats", Context.MODE_PRIVATE)
        val today = Calendar.getInstance().get(Calendar.DAY_OF_YEAR).toString()
        val currentSteps = sharedPref.getInt("steps_$today", 0)
        val totalStepsNow = currentSteps + sessionSteps
        
        with(sharedPref.edit()) {
            putInt("steps_$today", totalStepsNow)
            apply()
        }
        startingSteps = currentTotalSteps

        // Atualiza a notificação persistente na tela de bloqueio e barra do sistema em tempo real
        updateNotification("Você deu +$totalStepsNow passos hoje mesmo fora do app!")
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Monitoramento de Passos",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }

    private fun createNotification(content: String): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("LifeSteps em Segundo Plano")
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_menu_compass) // use seu próprio ícone drawable aqui
            .setContentIntent(pendingIntent)
            .setOngoing(true) // Impede que o usuário deslize para fechar a notificação
            .build()
    }

    private fun updateNotification(content: String) {
        val notification = createNotification(content)
        val manager = getSystemService(NotificationManager::class.java)
        manager?.notify(NOTIFICATION_ID, notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        // Cancela o sensor ao destruir o serviço para economizar bateria
        sensorManager.unregisterListener(this)
    }
}`;

  const codeWorker = `package com.lifesteps.app

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.Calendar

/**
 * WorkManager nativo em Kotlin - Ideal para sincronização de dados periódica.
 * Executa tarefas em segundo plano respeitando as restrições de bateria do Android.
 * Ele roda mesmo se o app estiver completamente fechado.
 */
class StepSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        // Recupera os passos que o Foreground Service salvou localmente
        val sharedPref = applicationContext.getSharedPreferences("LifeStepsStats", Context.MODE_PRIVATE)
        val today = Calendar.getInstance().get(Calendar.DAY_OF_YEAR).toString()
        val totalSteps = sharedPref.getInt("steps_$today", 0)

        return try {
            // Sincroniza dados com seu servidor/API
            val client = OkHttpClient()
            val jsonBody = """{"steps": $totalSteps, "date": "$today"}"""
            val body = jsonBody.toRequestBody("application/json; charset=utf-8".toMediaType())
            
            val request = Request.Builder()
                .url("https://vossa-api-lifesteps.com/api/sync")
                .post(body)
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    Result.success() // Sincronização sucedida!
                } else {
                    Result.retry() // Falha temporária do servidor, tenta mais tarde
                }
            }
        } catch (e: Exception) {
            // Ocorreu um erro de rede, o WorkManager reagendará respeitando as regras de backoff
            Result.retry()
        }
    }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-md ${isDark ? 'bg-[#0a0a0c] border-white/10' : 'bg-white border-black/10'} border rounded-[36px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-12 duration-500`}>
        
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-start border-b border-white/5">
          <div>
            <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest block mb-1">Guia de Engenharia</span>
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>Rastreamento de Passos</h3>
          </div>
          <button 
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/50' : 'bg-black/5 hover:bg-black/10 text-black/50'} transition-all`}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tabs Selectors */}
        <div className="px-6 py-2 flex gap-1 overflow-x-auto scrollbar-none shrink-0 border-b border-white/5">
          {[
            { id: 'web', label: 'Simulador Web' },
            { id: 'service', label: 'Foreground Service' },
            { id: 'worker', label: 'WorkManager' },
            { id: 'manifest', label: 'AndroidManifest.xml' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                  : isDark
                    ? 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
                    : 'bg-black/5 border-black/5 text-black/50 hover:text-black/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {activeTab === 'web' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-blue-600/5 border-blue-500/10' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Simulador Inteligente</h4>
                    <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/60'} leading-relaxed mt-0.5`}>
                      Sua plataforma de demonstração simula perfeitamente a reaquisição de dados ao retornar do segundo plano usando tecnologia temporal baseada em diferenças de registros de sistema.
                    </p>
                  </div>
                </div>

                {/* Switch Simulador */}
                <div className={`p-4 rounded-xl flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                  <div>
                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>Estado do Simulador Web</p>
                    <p className={`${isDark ? 'text-white/30 font-medium' : 'text-black/40'} text-[10px] mt-0.5`}>
                      Quando ativado, passeia em segundo plano!
                    </p>
                  </div>
                  <button 
                    onClick={onToggleTracking}
                    className={`w-14 h-7 rounded-full relative transition-colors duration-300 shrink-0 ${isTracking ? 'bg-blue-600' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 ${isTracking ? 'left-8' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>

              <div>
                <h4 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'} mb-2`}>Como Testar a Simulação:</h4>
                <ol className="list-decimal list-inside space-y-2 text-[10.5px] font-medium leading-relaxed pl-1 text-zinc-400">
                  <li><strong className="text-white">ATIVE</strong> o interruptor de estado acima.</li>
                  <li><strong className="text-white">MINIMIZE</strong> a aba do seu navegador ou mude de tela.</li>
                  <li><strong className="text-white">AGUARDE</strong> alguns segundos (ex: 20-30 segundos).</li>
                  <li><strong className="text-white">RETORNE</strong> ao LifeSteps. O app aplicará a diferença de tempo e creditará seus passos simulados com uma notificação especial na tela!</li>
                </ol>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5 text-white/50' : 'bg-black/5 border-black/5 text-black/60'} text-[10px] leading-relaxed`}>
                <i className="fa-solid fa-circle-info mr-1 text-blue-500"></i> No navegador padrão, restrições rígidas impedem o uso de sensores em abas desativadas. Por isso, a simulação heurística de tempo decorrido garante a fidelidade de testes antes do seu build nativo em Android!
              </div>
            </div>
          )}

          {activeTab === 'service' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-600/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex gap-3 items-center mb-1">
                  <i className="fa-solid fa-bolt-lightning text-yellow-500 text-xs"></i>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Foreground Service em Android</h4>
                </div>
                <p className={`text-[10.5px] ${isDark ? 'text-white/50' : 'text-black/60'} leading-relaxed`}>
                  Esta é a arquitetura ideal recomendada pelo Google para o monitoramento confiável de passos. Ao se registrar como um <strong className={`${isDark ? 'text-white' : 'text-black'}`}>Foreground Service</strong> do tipo <strong className={`${isDark ? 'text-white' : 'text-black'}`}>health</strong>, o Android garante que seu listener do sensor de passos não será encerrado pelo sistema ao fechar o app.
                </p>
              </div>

              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>Kotlin: StepCounterService.kt</span>
                <button
                  onClick={() => handleCopy(codeService, 'service')}
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-white transition-all ${copiedId === 'service' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                >
                  {copiedId === 'service' ? 'Copiado!' : 'Copiar Código'}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-[#030304] border border-white/5 font-mono text-[9.5px] text-zinc-300 overflow-x-auto select-all max-h-72">
                <code>{codeService}</code>
              </pre>
            </div>
          )}

          {activeTab === 'worker' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-indigo-600/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex gap-3 items-center mb-1">
                  <i className="fa-solid fa-server text-blue-500 text-xs"></i>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>Periodic Sinc via WorkManager</h4>
                </div>
                <p className={`text-[10.5px] ${isDark ? 'text-white/50' : 'text-black/60'} leading-relaxed`}>
                  O <strong className={`${isDark ? 'text-white' : 'text-black'}`}>WorkManager</strong> é ideal para processar dados em segundo plano e sincronizar registros diários com APIs do seu servidor. Ele funciona de forma inteligente respeitando regras de rede, bateria e condições de recarga de energia.
                </p>
              </div>

              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>Kotlin: StepSyncWorker.kt</span>
                <button
                  onClick={() => handleCopy(codeWorker, 'worker')}
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-white transition-all ${copiedId === 'worker' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                >
                  {copiedId === 'worker' ? 'Copiado!' : 'Copiar Código'}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-[#030304] border border-white/5 font-mono text-[9.5px] text-zinc-300 overflow-x-auto select-all max-h-72">
                <code>{codeWorker}</code>
              </pre>
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-yellow-600/5 border-yellow-500/10' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex gap-3 items-center mb-1">
                  <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-xs"></i>
                  <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>Permissões e Registro Obrigatório</h4>
                </div>
                <p className={`text-[10.5px] ${isDark ? 'text-white/50' : 'text-black/60'} leading-relaxed`}>
                  Sem essas declarações no arquivo <strong className={`${isDark ? 'text-white' : 'text-black'}`}>AndroidManifest.xml</strong>, seu app sofrerá crash imediato ou não contará passos ao ser minimizado ou fechado.
                </p>
              </div>

              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>XML: AndroidManifest.xml</span>
                <button
                  onClick={() => handleCopy(codeManifest, 'manifest')}
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-white transition-all ${copiedId === 'manifest' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                >
                  {copiedId === 'manifest' ? 'Copiado!' : 'Copiar Código'}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-[#030304] border border-white/5 font-mono text-[9.5px] text-zinc-300 overflow-x-auto select-all max-h-72">
                <code>{codeManifest}</code>
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex flex-col gap-2 shrink-0">
          <p className={`${isDark ? 'text-white/30' : 'text-black/40'} text-[9px] text-center uppercase tracking-widest font-black`}>
            Desenhado para Engenharia Android 14+ Pedometer
          </p>
        </div>
      </div>
    </div>
  );
};
