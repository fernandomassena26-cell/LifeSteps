
import { GoogleGenAI, Type } from "@google/genai";
import { DailyStats, UserProfile, UserGoal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const calculateActivityCalories = async (activity: string, profile: UserProfile): Promise<{ calories: number; feedback: string }> => {
  const prompt = `Calcule as calorias queimadas para a atividade: "${activity}". 
  Detalhes do usuário: ${profile.weight}kg, gênero ${profile.gender}. 
  Retorne um objeto JSON com "calories" (número) e "feedback" (uma frase curta explicando a intensidade em português).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            feedback: { type: Type.STRING }
          },
          required: ["calories", "feedback"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { calories: 0, feedback: "Erro ao calcular. Tente novamente." };
  }
};

export const getFitnessContent = async (type: 'workout' | 'diet', goal: UserGoal): Promise<string> => {
  const goalMap: Record<UserGoal, string> = {
    weight_loss: 'emagrecimento',
    muscle_gain: 'ganho de massa muscular',
    maintenance: 'manter a forma'
  };

  const isWorkout = type === 'workout';
  
  const prompt = isWorkout 
    ? `Gere um plano de TREINO COMPLETO PARA FAZER EM CASA focado no objetivo: ${goalMap[goal]}. 
       O treino deve ser adaptado para ambiente doméstico, usando apenas o peso do corpo ou objetos comuns (como cadeiras ou garrafas de água).
       Para cada exercício, você DEVE incluir:
       1. Nome do exercício.
       2. Instruções passo a passo de COMO FAZER corretamente.
       3. Quantidade de séries e repetições (ou tempo).
       4. Dicas de postura e segurança para evitar lesões em casa.
       Use Markdown com títulos chamativos, emojis e listas organizadas. Responda TOTALMENTE em português brasileiro.`
    : `Gere um plano de DIETA para o objetivo: ${goalMap[goal]}. 
       Inclua sugestões de refeições acessíveis, horários ideais e dicas de nutrição. 
       Responda TOTALMENTE em português brasileiro. Use Markdown limpo com emojis.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Contatando seu treinador pessoal...";
  } catch (error) {
    return "Erro ao carregar seu plano personalizado. Verifique sua conexão.";
  }
};

export const getHealthAdvice = async (stats: DailyStats, profile: UserProfile): Promise<string> => {
  const prompt = `Feedback de treinador motivacional para ${profile.name}. Meta: ${profile.stepGoal} passos. Atual: ${stats.steps}. Água: ${stats.waterIntake}ml. Objetivo: ${profile.goal}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: "Dê um feedback curto e enérgico em português brasileiro. Máximo de 120 caracteres." }
    });
    return response.text || "Continue se movendo!";
  } catch {
    return "Ótimo trabalho hoje!";
  }
};
