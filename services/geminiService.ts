
import { GoogleGenAI, Type } from "@google/genai";
import { DailyStats, UserProfile, UserGoal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' });

export const calculateActivityCalories = async (activity: string, profile: UserProfile): Promise<{ calories: number; feedback: string }> => {
  const prompt = `Calcule as calorias queimadas para a atividade: "${activity}". 
  Detalhes do usuÃ¡rio: ${profile.weight}kg, gÃªnero ${profile.gender}. 
  Retorne um objeto JSON com "calories" (nÃºmero) e "feedback" (uma frase curta explicando a intensidade em portuguÃªs).`;

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
       O treino deve ser adaptado para ambiente domÃ©stico, usando apenas o peso do corpo ou objetos comuns (como cadeiras ou garrafas de Ã¡gua).
       Para cada exercÃ­cio, vocÃª DEVE incluir:
       1. Nome do exercÃ­cio.
       2. InstruÃ§Ãµes passo a passo de COMO FAZER corretamente.
       3. Quantidade de sÃ©ries e repetiÃ§Ãµes (ou tempo).
       4. Dicas de postura e seguranÃ§a para evitar lesÃµes em casa.
       Use Markdown com tÃ­tulos chamativos, emojis e listas organizadas. Responda TOTALMENTE em portuguÃªs brasileiro.`
    : `Gere um plano de DIETA para o objetivo: ${goalMap[goal]}. 
       Inclua sugestÃµes de refeiÃ§Ãµes acessÃ­veis, horÃ¡rios ideais e dicas de nutriÃ§Ã£o. 
       Responda TOTALMENTE em portuguÃªs brasileiro. Use Markdown limpo com emojis.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Contatando seu treinador pessoal...";
  } catch (error) {
    return "Erro ao carregar seu plano personalizado. Verifique sua conexÃ£o.";
  }
};

export const getHealthAdvice = async (stats: DailyStats, profile: UserProfile): Promise<string> => {
  const prompt = `Feedback de treinador motivacional para ${profile.name}. Meta: ${profile.stepGoal} passos. Atual: ${stats.steps}. Ãgua: ${stats.waterIntake}ml. Objetivo: ${profile.goal}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: "DÃª um feedback curto e enÃ©rgico em portuguÃªs brasileiro. MÃ¡ximo de 120 caracteres." }
    });
    return response.text || "Continue se movendo!";
  } catch {
    return "Ãtimo trabalho hoje!";
  }
};
