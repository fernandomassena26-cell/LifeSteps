
import { GoogleGenAI, Type } from "@google/genai";
import { DailyStats, UserProfile, UserGoal, FitnessLevel, TrainingEnvironment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const calculateActivityCalories = async (activity: string, profile: UserProfile): Promise<{ calories: number; feedback: string }> => {
  const prompt = `Como um especialista em fisiologia do exercício, calcule as calorias queimadas para a atividade: "${activity}". 
  Dados do indivíduo: 
  - Peso: ${profile.weight}kg
  - Altura: ${profile.height}cm
  - Idade: ${profile.age} anos
  - Gênero: ${profile.gender}
  - Objetivo: ${profile.goal}
  - Nível de condicionamento: ${profile.fitnessLevel}
  - Ambiente de treino preferencial: ${profile.trainingEnvironment || 'home'}

  Considere o MET (Equivalente Metabólico) para esta atividade específica.
  Retorne EXCLUSIVAMENTE um objeto JSON com:
  1. "calories": valor inteiro aproximado.
  2. "feedback": uma frase curta em português incentivando o usuário ou comentando o benefício dessa atividade específica para o seu objetivo.`;

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
    console.error("Erro no cálculo AI:", error);
    return { calories: 0, feedback: "Não consegui calcular agora, mas não pare! Tente descrever a duração da atividade." };
  }
};

export const getDietBuilderOptions = async (goal: UserGoal): Promise<any> => {
  const goalText = goal === 'weight_loss' ? 'perda de peso' : goal === 'muscle_gain' ? 'ganho de massa muscular' : 'manutenção de saúde';
  
  const prompt = `Você é um nutricionista experiente. Gere EXATAMENTE 10 (DEZ) opções de refeições DISTINTAS E VARIADAS para cada uma destas 4 categorias: Café da Manhã (breakfast), Almoço (lunch), Jantar (dinner) e Lanches (snacks).
  O objetivo do usuário é: ${goalText}.
  As opções devem ser ricas em detalhes nutricionais na descrição.
  
  Retorne um JSON com as categorias como chaves, contendo um array de EXATAMENTE 10 itens cada. 
  Cada item deve ter: { "id": "string única", "name": "nome curto", "calories": número, "description": "descrição curta dos ingredientes" }.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakfast: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, calories: { type: Type.NUMBER }, description: { type: Type.STRING } }, required: ["id", "name", "calories", "description"] } },
            lunch: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, calories: { type: Type.NUMBER }, description: { type: Type.STRING } }, required: ["id", "name", "calories", "description"] } },
            dinner: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, calories: { type: Type.NUMBER }, description: { type: Type.STRING } }, required: ["id", "name", "calories", "description"] } },
            snacks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, calories: { type: Type.NUMBER }, description: { type: Type.STRING } }, required: ["id", "name", "calories", "description"] } }
          },
          required: ["breakfast", "lunch", "dinner", "snacks"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro ao carregar opções:", error);
    return null;
  }
};

export const validateUserDiet = async (selectedMeals: any[], profile: UserProfile): Promise<{ status: 'compatible' | 'partial' | 'incompatible', analysis: string }> => {
  const prompt = `Analise se esta dieta é compatível com o objetivo de ${profile.goal} para um usuário de ${profile.weight}kg e ${profile.height}cm.
  Refeições escolhidas: ${selectedMeals.map(m => m.name).join(', ')}.
  Retorne um JSON com:
  1. "status": "compatible", "partial" ou "incompatible".
  2. "analysis": explicação detalhada em português do porquê e sugestão se necessário.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["compatible", "partial", "incompatible"] },
            analysis: { type: Type.STRING }
          },
          required: ["status", "analysis"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { status: 'partial', analysis: "Não foi possível validar agora. Tente novamente." };
  }
};

export const getCoachResponse = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], profile: UserProfile, stats: DailyStats): Promise<string> => {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `Você é o "LifeSteps Coach", um assistente de saúde e fitness altamente motivador e experiente. 
      Seu objetivo é ajudar o usuário a alcançar seu objetivo de ${profile.goal}.
      Dados atuais do usuário:
      - Peso: ${profile.weight}kg, Altura: ${profile.height}cm, Idade: ${profile.age} anos.
      - Nível de condicionamento: ${profile.fitnessLevel}.
      - Passos hoje: ${stats.steps}, Calorias: ${stats.calories}, Água: ${stats.waterIntake}ml.
      
      Sempre seja positivo, use dados científicos quando apropriado e encoraje hábitos saudáveis. 
      Mantenha as respostas concisas e formatadas em Markdown para facilitar a leitura no celular.`,
    },
    history: history
  });

  try {
    const result = await chat.sendMessage({ message });
    return result.text || "Desculpe, tive um problema ao processar sua mensagem. Pode repetir?";
  } catch (error) {
    console.error("Erro no Coach AI:", error);
    return "Estou com dificuldades de conexão agora. Vamos tentar novamente em breve?";
  }
};

export const calculateWorkoutCalories = async (plan: any, profile: UserProfile): Promise<number> => {
  const workoutDescription = plan.items.map((item: any) => `${item.name}: ${item.sets} séries de ${item.reps} repetições`).join(', ');
  const prompt = `Como um especialista em fisiologia do exercício, calcule o total de calorias queimadas para o seguinte treino completo:
  Treino: ${plan.title}
  Exercícios: ${workoutDescription}
  
  Dados do indivíduo: 
  - Peso: ${profile.weight}kg
  - Altura: ${profile.height}cm
  - Idade: ${profile.age} anos
  - Gênero: ${profile.gender}
  - Nível de condicionamento: ${profile.fitnessLevel}

  Considere o esforço total estimado para completar todas as séries e repetições listadas.
  Retorne EXCLUSIVAMENTE um objeto JSON com:
  1. "totalCalories": valor inteiro aproximado.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalCalories: { type: Type.NUMBER }
          },
          required: ["totalCalories"]
        }
      }
    });
    const result = JSON.parse(response.text);
    return result.totalCalories || 0;
  } catch (error) {
    console.error("Erro no cálculo de calorias do treino:", error);
    // Fallback: estimativa simples baseada no número de exercícios
    return plan.items.length * 40; 
  }
};
export const getFitnessContent = async (type: 'workout' | 'diet', goal: UserGoal, fitnessLevel?: FitnessLevel, trainingEnvironment?: TrainingEnvironment): Promise<any> => {
  const goalMap: Record<UserGoal, string> = {
    weight_loss: 'emagrecimento e queima de gordura',
    muscle_gain: 'hipertrofia e ganho de força',
    maintenance: 'saúde geral e condicionamento'
  };

  const levelMap: Record<FitnessLevel, string> = {
    very_light: 'muito leve (exercícios extremamente leves, foco em mobilidade básica e alongamento, períodos muito longos de descanso)',
    light: 'leve (exercícios leves, baixo impacto, foco em técnica básica e respiração)',
    moderate: 'moderado (exercícios de intensidade média, ritmo controlado, foco em execução correta)',
    hard: 'difícil (exercícios intensos, foco em força e resistência, períodos curtos de descanso)',
    very_hard: 'muito difícil (exercícios de alta intensidade, desafiadores, foco em performance máxima)'
  };

  const isWorkout = type === 'workout';
  const environmentText = trainingEnvironment === 'gym' 
    ? 'PARA ACADEMIA (focado em máquinas, pesos livres e equipamentos de musculação)' 
    : 'PARA CASA (focado em peso do corpo, halteres leves ou elásticos)';
  
  const prompt = isWorkout 
    ? `Gere um plano de TREINO ${environmentText} focado em ${goalMap[goal]}.
       O nível de dificuldade deve ser: ${fitnessLevel ? levelMap[fitnessLevel] : 'intermediário'}.
       Retorne um JSON estruturado com:
       - title: nome motivador do treino
       - items: array de objetos { name, sets, reps, instructions, tips }`
    : `Gere um plano de DIETA diária para ${goalMap[goal]}.
       Retorne um JSON estruturado com:
       - title: nome da dieta
       - items: array de objetos { mealName, time, ingredients, nutritionalTip }`;

  const schema = isWorkout ? {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            sets: { type: Type.STRING },
            reps: { type: Type.STRING },
            instructions: { type: Type.STRING },
            tips: { type: Type.STRING }
          },
          required: ["name", "sets", "reps", "instructions"]
        }
      }
    },
    required: ["title", "items"]
  } : {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            mealName: { type: Type.STRING },
            time: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutritionalTip: { type: Type.STRING }
          },
          required: ["mealName", "time", "ingredients"]
        }
      }
    },
    required: ["title", "items"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    return null;
  }
};
