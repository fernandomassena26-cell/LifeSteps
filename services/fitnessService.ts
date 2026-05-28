
import { UserProfile, UserGoal, FitnessLevel, TrainingEnvironment } from "../types";

export const calculateActivityCalories = async (activity: string, profile: UserProfile): Promise<{ calories: number; feedback: string }> => {
  const text = activity.toLowerCase();
  let baseMet = 5.0; 

  if (text.includes("futebol") || text.includes("corrida") || text.includes("correr")) baseMet = 8.0;
  if (text.includes("caminhada") || text.includes("andar")) baseMet = 3.5;
  if (text.includes("academia") || text.includes("treino") || text.includes("musculação")) baseMet = 6.0;
  if (text.includes("natação") || text.includes("nadar")) baseMet = 7.0;
  if (text.includes("bicicleta") || text.includes("pedalar")) baseMet = 7.5;
  
  const durationMatch = text.match(/(\d+)\s*(min|minutos)/);
  const duration = durationMatch ? parseInt(durationMatch[1]) : 30;
  
  const kcalPerMin = (baseMet * 3.5 * (profile.weight || 70)) / 200;
  const totalKcal = Math.round(kcalPerMin * duration);

  return { 
    calories: totalKcal, 
    feedback: `Baseado na sua atividade física e perfil (${profile.weight}kg), você estimou um gasto de ${totalKcal} kcal. Ótimo trabalho!` 
  };
};

export const getDietBuilderOptions = async (goal: UserGoal): Promise<any> => {
  return {
    breakfast: [
      { id: "b1", name: "Aveia com Frutas", calories: 350, description: "Aveia em flocos, banana, morangos e um toque de mel." },
      { id: "b2", name: "Ovos Mexidos com Torrada", calories: 400, description: "Dois ovos, pão integral e queijo branco." },
      { id: "b3", name: "Smoothie de Proteína", calories: 300, description: "Whey protein, leite vegetal e pasta de amendoim." },
      { id: "b4", name: "Iogurte com Granola", calories: 280, description: "Iogurte natural sem açúcar e granola integral." },
      { id: "b5", name: "Panqueca de Banana", calories: 320, description: "Banana, ovo e aveia batidos e grelhados." }
    ],
    lunch: [
      { id: "l1", name: "Frango Grelhado com Batata Doce", calories: 550, description: "Peito de frango, batata doce assada e brócolis." },
      { id: "l2", name: "Salmão com Quinoa", calories: 600, description: "Filé de salmão, quinoa cozida e mix de folhas verdes." },
      { id: "l3", name: "Bowl de Grão de Bico", calories: 500, description: "Grão de bico, abacate, tomate e arroz integral." },
      { id: "l4", name: "Macarrão Integral com Patinho", calories: 580, description: "Macarrão integral, carne moída magra e molho de tomate." },
      { id: "l5", name: "Salada Caesar Fit", calories: 450, description: "Alface, frango desfiado, croûtons integrais e molho leve." }
    ],
    dinner: [
      { id: "d1", name: "Omelete de Vegetais", calories: 350, description: "Ovos, espinafre, tomate e cebola." },
      { id: "d2", name: "Peixe Branco ao Forno", calories: 400, description: "Filé de tilápia com legumes no vapor." },
      { id: "d3", name: "Sopa de Lentilha", calories: 380, description: "Lentilha cozida com cenoura e temperos naturais." },
      { id: "d4", name: "Tacos de Alface", calories: 320, description: "Folhas de alface recheadas com carne moída e salsa." },
      { id: "d5", name: "Espaguete de Abobrinha", calories: 250, description: "Abobrinha em fios com molho pesto e tomatinhos." }
    ],
    snacks: [
      { id: "s1", name: "Mix de Castanhas", calories: 180, description: "Nozes, amêndoas e castanhas-do-pará." },
      { id: "s2", name: "Fruta com Pasta de Amendoim", calories: 220, description: "Maçã ou banana com uma colher de pasta de amendoim." },
      { id: "s3", name: "Barra de Cereal Caseira", calories: 150, description: "Feita com aveia e frutas secas." },
      { id: "s4", name: "Queijo Branco com Tomates", calories: 120, description: "Cubos de queijo minas com tomate cereja e orégano." },
      { id: "s5", name: "Chips de Grão de Bico", calories: 140, description: "Grão de bico assado e temperado." }
    ]
  };
};

export const validateUserDiet = async (selectedMeals: any[], profile: UserProfile): Promise<{ status: 'compatible' | 'partial' | 'incompatible', analysis: string }> => {
  const totalKcal = selectedMeals.reduce((acc, meal) => acc + meal.calories, 0);
  const bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5; 
  const activityMultiplier = 1.375; 
  const targetKcal = profile.goal === 'weight_loss' ? bmr * activityMultiplier - 500 : profile.goal === 'muscle_gain' ? bmr * activityMultiplier + 500 : bmr * activityMultiplier;

  let status: 'compatible' | 'partial' | 'incompatible' = 'compatible';
  let analysis = `Suas refeições totalizam ${totalKcal} kcal. `;

  if (Math.abs(totalKcal - targetKcal) < 300) {
    analysis += "Esta seleção está excelente e muito próxima da sua meta calórica ideal.";
  } else if (totalKcal < targetKcal) {
    status = 'partial';
    analysis += "Você está consumindo menos calorias do que o ideal. Considere adicionar mais nutrientes.";
  } else {
    status = 'partial';
    analysis += "Sua ingestão calórica está um pouco acima do recomendado para seu objetivo atual.";
  }

  return { status, analysis };
};

export const calculateWorkoutCalories = async (plan: any, profile: UserProfile): Promise<number> => {
  return (plan.items?.length || 0) * 45;
};

export const getFitnessContent = async (type: 'workout' | 'diet', goal: UserGoal, fitnessLevel?: FitnessLevel, trainingEnvironment?: TrainingEnvironment): Promise<any> => {
  if (type === 'diet') {
    const dietPlans: any = {
      weight_loss: {
        title: "Plano Alimentar para Definição",
        items: [
          { mealName: "Café da Manhã", time: "07:30", ingredients: ["Omelete de claras", "Espinafre", "Café sem açúcar"], nutritionalTip: "Dê preferência a proteínas magras logo cedo." },
          { mealName: "Lanche", time: "10:00", ingredients: ["Iogurte desnatado", "3 castanhas"], nutritionalTip: "Gorduras boas ajudam a controlar a saciedade." },
          { mealName: "Almoço", time: "13:00", ingredients: ["Frango desfiado", "Salada verde abundante", "Mix de legumes"], nutritionalTip: "Vegetais folhosos têm pouca caloria e muita fibra." },
          { mealName: "Jantar", time: "19:00", ingredients: ["Peixe branco ao forno", "Brócolis", "Abobrinha"], nutritionalTip: "Evite carboidratos pesados à noite para melhor digestão." }
        ]
      },
      muscle_gain: {
        title: "Dieta para Hipertrofia",
        items: [
          { mealName: "Café da Manhã", time: "07:30", ingredients: ["Pão integral", "2 ovos inteiros", "Abacate", "Suco de uva integral"], nutritionalTip: "Energia vinda de carboidratos complexos é vital para o treino." },
          { mealName: "Pré-treino", time: "10:30", ingredients: ["Banana com aveia", "Pasta de amendoim"], nutritionalTip: "Fornece energia rápida para os músculos." },
          { mealName: "Almoço", time: "13:30", ingredients: ["Patinho moído", "Arroz integral", "Feijão", "Beterraba"], nutritionalTip: "Ferro e proteínas são os pilares da reconstrução muscular." },
          { mealName: "Pós-treino/Jantar", time: "20:00", ingredients: ["Frango grelhado", "Batata doce", "Ervilhas"], nutritionalTip: "Reposição de glicogênio e aminoácidos imediata." }
        ]
      },
      maintenance: {
        title: "Nutrição e Equilíbrio Diário",
        items: [
          { mealName: "Café da Manhã", time: "08:00", ingredients: ["Iogurte natural", "Granola", "Mamão"], nutritionalTip: "Fibras do mamão ajudam na digestão." },
          { mealName: "Almoço", time: "12:30", ingredients: ["Arroz", "Feijão", "Proteína à sua escolha", "Mix de folhas"], nutritionalTip: "O prato brasileiro clássico é super equilibrado." },
          { mealName: "Lanche", time: "16:00", ingredients: ["Queijo branco", "Torrada integral"], nutritionalTip: "Lanche proteico leve para o meio da tarde." },
          { mealName: "Jantar", time: "20:00", ingredients: ["Sopa de legumes com frango", "Cenoura ralada"], nutritionalTip: "Refeição reconfortante e nutritiva." }
        ]
      }
    };
    return { ...dietPlans[goal] || dietPlans.maintenance, goal };
  }

  const workoutDatabase: any = {
    gym: {
      weight_loss: {
        very_light: {
          title: "Iniciação na Academia: Queima Leve",
          items: [
            { name: "Caminhada em Esteira", sets: "1", reps: "20 min", instructions: "Mantenha uma postura ereta e olhe para frente. Use calçados adequados.", tips: "Comece com 3km/h e suba gradualmente até 5km/h." },
            { name: "Bicicleta Horizontal", sets: "1", reps: "10 min", instructions: "Ajuste o banco para que sua perna não fique totalmente esticada no pedal.", tips: "Mantenha um ritmo onde você consiga conversar sem perder o fôlego." },
            { name: "Leg Press 45 (Sem Carga)", sets: "2", reps: "15", instructions: "Pés na largura dos ombros, desça o peso controladamente sem tirar a lombar do banco.", tips: "Empurre com os calcanhares, não com a ponta dos pés." },
            { name: "Alongamento Global", sets: "1", reps: "5 min", instructions: "Estique todo o corpo, braços, pernas e costas de forma suave.", tips: "Respire fundo durante cada movimento." },
            { name: "Rotação de Ombros", sets: "2", reps: "15", instructions: "Gire os ombros para frente e para trás circularmente.", tips: "Solta a tensão acumulada no trapézio." }
          ]
        },
        light: {
          title: "Circuito Adaptativo Masculino/Feminino",
          items: [
            { name: "Trote na Esteira", sets: "1", reps: "15 min", instructions: "Mantenha a inclinação em 1%. Tente manter um ritmo constante.", tips: "Respire pelo nariz e solte pela boca de forma rítmica." },
            { name: "Remada Máquina", sets: "3", reps: "15", instructions: "Coluna reta, puxe a barra em direção ao abdômen apertando as costas.", tips: "Imagine que você quer encostar um cotovelo no outro atrás das costas." },
            { name: "Agachamento no Hack", sets: "3", reps: "12", instructions: "Apoie bem as costas no encosto, desça até formar 90 graus com os joelhos.", tips: "Mantenha o core contraído durante todo o movimento." },
            { name: "Flexão de Braços na Parede", sets: "3", reps: "15", instructions: "Mãos na parede, desça o peito e empurre.", tips: "Mantenha o corpo alinhado, como uma tábua." },
            { name: "Elevação Lateral (Leve)", sets: "3", reps: "12", instructions: "Suba os braços lateralmente até a altura dos ombros.", tips: "Não ultrapasse a linha dos ombros." }
          ]
        },
        moderate: {
          title: "Circuito HIIT Academia",
          items: [
            { name: "Esteira Intervalada", sets: "1", reps: "15 min", instructions: "Corra 1 min em alta intensidade, ande 1 min para recuperar.", tips: "O objetivo é elevar a frequência cardíaca rapidamente." },
            { name: "Leg Press", sets: "3", reps: "20", instructions: "Foco na velocidade controlada e repetições altas para tônus muscular.", tips: "Não estenda totalmente o joelho para proteger a articulação." },
            { name: "Remada Baixa", sets: "3", reps: "15", instructions: "Puxe o triângulo em direção ao umbigo, mantendo os cotovelos colados ao corpo.", tips: "Mantenha os ombros longe das orelhas." },
            { name: "Bicicleta Ergométrica", sets: "1", reps: "10 min", instructions: "Mantenha a resistência moderada e cadência acima de 70 RPM.", tips: "Mantenha o tronco estável, evite balançar o corpo." },
            { name: "Abdominal Infra", sets: "3", reps: "15", instructions: "Deitado, eleve as pernas sem encostá-las no chão ao descer.", tips: "Pressione a lombar contra o banco." },
            { name: "Polichinelos", sets: "3", reps: "1 min", instructions: "Salto coordenado abrindo braços e pernas.", tips: "Mantenha um ritmo constante." }
          ]
        },
        hard: {
          title: "Explosão Metabólica Academia",
          items: [
            { name: "Corrida em Inclinação", sets: "1", reps: "20 min", instructions: "Inclinação de 5 a 10%. Velocidade de trote rápido.", tips: "Trabalha muito mais a parte posterior da coxa e glúteos." },
            { name: "Super-set: Leg Press + Extensora", sets: "4", reps: "15 + 15", instructions: "Faça as 15 no Leg e vá direto para a Extensora sem descanso.", tips: "O pump muscular será intenso, controle a respiração." },
            { name: "Burpees no Step", sets: "4", reps: "12", instructions: "Salte, coloque as mãos no step, jogue as pernas para trás, volta e salta.", tips: "O step facilita o movimento e protege o impacto." },
            { name: "Mountain Climbers", sets: "4", reps: "45 seg", instructions: "Posição de prancha alta, traga os joelhos ao peito rapidamente.", tips: "Mantenha o quadril estável e baixo." },
            { name: "Prancha com Toque nos Ombros", sets: "4", reps: "20", instructions: "Na prancha, toque o ombro oposto sem rodar o quadril.", tips: "Core extremamente ativado aqui." }
          ]
        },
        very_hard: {
          title: "Desafio Militar de Queima",
          items: [
            { name: "Intervalado de Sprint", sets: "1", reps: "25 min", instructions: "Sprint máximo por 30 seg, descanso total por 30 seg.", tips: "Você deve terminar cada sprint ofegante." },
            { name: "Thrusters com Halteres", sets: "5", reps: "15", instructions: "Combine um agachamento profundo com um desenvolvimento acima da cabeça.", tips: "Use a força das pernas para empurrar o peso para cima." },
            { name: "Remo Indoor", sets: "5", reps: "500m", instructions: "Remadas potentes usando pernas, costas e braços.", tips: "Mantenha a técnica mesmo sob cansaço extremo." },
            { name: "Salto em Caixa", sets: "5", reps: "12", instructions: "Salte em uma caixa alta e desça um pé de cada vez.", tips: "Amorteça bem a queda dobrando os joelhos." },
            { name: "Clean & Press", sets: "5", reps: "10", instructions: "Tira o peso do chão, traz ao ombro e empurra acima da cabeça.", tips: "Movimento explosivo e coordenado." }
          ]
        }
      },
      muscle_gain: {
        very_light: {
          title: "Preparação Muscular Inicial",
          items: [
            { name: "Puxador Frente (Leve)", sets: "3", reps: "12", instructions: "Leve a barra até a parte superior do peito de forma suave.", tips: "Não balance o corpo para trás, mantenha o tronco fixo." },
            { name: "Supino Máquina", sets: "3", reps: "12", instructions: "Ajuste os pegadores na altura dos mamilos, empurre e volte devagar mantendo o controle.", tips: "Mantenha os ombros encostados no banco o tempo todo." },
            { name: "Cadeira Extensora", sets: "3", reps: "12", instructions: "Estenda as pernas totalmente e volte sem deixar os pesos tocarem na base.", tips: "Mantenha as pontas dos pés sempre voltadas para cima." },
            { name: "Flexão com Apoio nos Joelhos", sets: "3", reps: "10", instructions: "Mãos mais largas que os ombros, joelhos no chão, desça o tronco.", tips: "Mantenha o abdômen contraído." },
            { name: "Elevação Pélvica (Solo)", sets: "3", reps: "15", instructions: "Deitado, eleve o quadril contraindo os glúteos.", tips: "Segure 2 segundos no topo." }
          ]
        },
        light: {
          title: "Adaptação Hipertrófica",
          items: [
            { name: "Leg Press 45", sets: "3", reps: "12", instructions: "Pés na largura dos ombros, controle a descida até quase encostar no peito.", tips: "Não trave os joelhos na subida." },
            { name: "Remada Sentada", sets: "3", reps: "12", instructions: "Puxe o suporte em direção ao umbigo mantendo a coluna ereta.", tips: "Sinta as escápulas se unindo no final do movimento." },
            { name: "Rosca Direta com Halteres", sets: "3", reps: "12", instructions: "Flexione os braços mantendo os cotovelos colados ao corpo.", tips: "Evite o balanço do tronco para roubar no peso." },
            { name: "Tríceps Pulley", sets: "3", reps: "12", instructions: "Estenda os braços para baixo mantendo os cotovelos fixos ao lado do corpo.", tips: "Foco total na parte de trás dos braços." },
            { name: "Abdominal Supra", sets: "3", reps: "20", instructions: "Deitado, mãos na nuca, suba o tronco retirando as escápulas do chão.", tips: "Solte o ar na subida." }
          ]
        },
        moderate: {
          title: "Hipertrofia Muscular Padrão",
          items: [
            { name: "Supino Reto com Barra", sets: "4", reps: "8-10", instructions: "Desça a barra até o peito de forma controlada, suba com explosão rítmica.", tips: "Mantenha os pés firmes no chão para maior estabilidade." },
            { name: "Agachamento Livre", sets: "4", reps: "10", instructions: "Barra nas costas, desça o quadril como se fosse sentar em um banco.", tips: "Foco total na amplitude, desça o máximo que conseguir sem perder a técnica." },
            { name: "Puxada Aberta", sets: "4", reps: "10-12", instructions: "Mantenha o peito aberto e puxe a barra em direção ao peitoral superior.", tips: "Sinta os dorsais trabalharem a cada repetição." },
            { name: "Desenvolvimento com Halteres", sets: "4", reps: "10", instructions: "Sentado, empurre os halteres acima da cabeça.", tips: "Mantenha a coluna bem apoiada no banco." },
            { name: "Cadeira Flexora", sets: "3", reps: "12", instructions: "Foco na parte posterior da coxa.", tips: "Segure o peso 1 segundo no pico da contração." },
            { name: "Rosca Martelo", sets: "3", reps: "12", instructions: "Suba os halteres com pegada neutra.", tips: "Foco no braquiorradial." }
          ]
        },
        hard: {
          title: "Força Bruta e Carga Progressiva",
          items: [
            { name: "Levantamento Terra", sets: "5", reps: "5-8", instructions: "Coluna totalmente neutra, puxe a barra do chão mantendo-a rente às pernas.", tips: "Este é um exercício de corpo inteiro, respire fundo antes de cada subida." },
            { name: "Barra Fixa (Weighted)", sets: "4", reps: "6-8", instructions: "Puxe seu corpo até o queixo passar a barra. Use peso adicional se necessário.", tips: "Amplitude completa é a chave aqui para resultados sólidos." },
            { name: "Desenvolvimento Militar", sets: "4", reps: "8", instructions: "Empurre a barra acima da cabeça estando em pé, sem usar as pernas.", tips: "Mantenha o abdômen travado para proteger a lombar." },
            { name: "Paralelas (Dips)", sets: "4", reps: "8-12", instructions: "Desça o corpo entre as barras paralelas.", tips: "Se estiver fácil, adicione carga na cintura." },
            { name: "Agachamento Frontal", sets: "4", reps: "8", instructions: "Barra apoiada na frente dos ombros.", tips: "Exige muito mais do core e quadríceps." },
            { name: "Stiff com Barra", sets: "4", reps: "10", instructions: "Desça a barra mantendo pernas quase esticadas e lombar selada.", tips: "Posteriores em chamas." }
          ]
        },
        very_hard: {
          title: "Volume Alemão (GVT) e Bi-sets",
          items: [
            { name: "Agachamento Livre", sets: "10", reps: "10", instructions: "10 séries de 10 reps com 60% da carga máxima. Descanso rigoroso de 60 seg.", tips: "O segredo está no volume acumulado. Mantenha a técnica impecável." },
            { name: "Supino Inclinado Halteres", sets: "10", reps: "10", instructions: "Mesma lógica do GVT. 10x10. Foco na parte superior do peito.", tips: "Escolha um peso desafiador mas que permita completar as 10 séries com qualidade." },
            { name: "Super-set: Puxada + Remada Curvada", sets: "5", reps: "10 + 10", instructions: "Termine a puxada e vá direto para a remada curvada.", tips: "Foco em esmagar a musculatura das costas." },
            { name: "Cluster Sets: Leg Press", sets: "4", reps: "4x4", instructions: "Faça 4 reps, descanse 15 seg, faça mais 4. Isso é 1 série.", tips: "Permite usar cargas mais altas para volume elevado." },
            { name: "Face Pulls", sets: "4", reps: "15", instructions: "Puxe a corda em direção ao rosto abrindo os cotovelos.", tips: "Saúde do ombro e deltoide posterior." }
          ]
        }
      },
      maintenance: {
        very_light: {
          title: "Mobilidade Articular Academia",
          items: [
            { name: "Caminhada em Esteira", sets: "1", reps: "30 min", instructions: "Ritmo de caminhada leve para manter o corpo em movimento.", tips: "Aproveite para focar na sua respiração." },
            { name: "Alongamento em Máquinas", sets: "1", reps: "10 min", instructions: "Use as máquinas de alongamento para soltar a musculatura global.", tips: "Não force além do seu limite de conforto." }
          ]
        },
        light: {
          title: "Tonificação Suave",
          items: [
            { name: "Bicicleta Ergométrica", sets: "1", reps: "20 min", instructions: "Cadência moderada sem carga excessiva.", tips: "Mantenha a postura ereta e o core levemente ativado." },
            { name: "Cadeira Extensora", sets: "3", reps: "15", instructions: "Trabalho de fortalecimento de joelho sem impacto.", tips: "Faça movimentos lentos." }
          ]
        },
        moderate: {
          title: "Condicionamento Geral Academia",
          items: [
            { name: "Elíptico", sets: "1", reps: "15 min", instructions: "Mantenha um ritmo que eleve levemente a frequência cardíaca.", tips: "Mantenha a postura ereta e use os braços do aparelho ativamente." },
            { name: "Puxador Frente", sets: "3", reps: "12", instructions: "Puxe a barra até a altura do queixo, controlando a volta do peso totalmente.", tips: "Mantenha o tronco reto, sem inclinar excessivamente para trás." },
            { name: "Extensora", sets: "3", reps: "12", instructions: "Foco no quadríceps, mantendo a contração no topo por 1 segundo.", tips: "Ajuste o rolo para ficar confortavelmente acima dos tornozelos." },
            { name: "Prancha Abdominal", sets: "3", reps: "1 min", instructions: "Apoie cotovelos e pés, mantenha o corpo alinhado como uma tábua.", tips: "Contraia os glúteos e o abdômen simultaneamente para estabilizar." }
          ]
        },
        hard: {
          title: "Resistência Avançada",
          items: [
            { name: "Remo Indoor", sets: "1", reps: "15 min", instructions: "Puxe alternando pernas e braços em harmonia.", tips: "Trabalha o cardio e a força simultaneamente." },
            { name: "Circuito de Máquinas", sets: "3", reps: "15", instructions: "Passe por 5 máquinas de grandes grupos sem descanso.", tips: "Ideal para manter o metabolismo acelerado." }
          ]
        },
        very_hard: {
          title: "Cross-Training Maintenance",
          items: [
            { name: "Escadas", sets: "1", reps: "20 min", instructions: "Suba degraus de 2 em 2 se conseguir.", tips: "Mantenha o olhar fixo para não perder o equilíbrio." },
            { name: "Kettlebell Swing", sets: "4", reps: "20", instructions: "Balanço com o peso usando a explosão do quadril.", tips: "Não use a força dos braços para elevar o peso." }
          ]
        }
      }
    },
    home: {
      weight_loss: {
        very_light: {
          title: "Mobilidade e Atividade Leve em Casa",
          items: [
            { name: "Caminhada no Lugar", sets: "1", reps: "15 min", instructions: "Marche sem sair do lugar, elevando levemente os joelhos.", tips: "Mantenha o balanço dos braços naturalmente." },
            { name: "Sentar e Levantar", sets: "3", reps: "12", instructions: "Use uma cadeira firme, sente e levante sem usar o apoio dos braços.", tips: "Ideal para fortalecer as pernas de forma funcional." },
            { name: "Alongamento de Braços", sets: "1", reps: "5 min", instructions: "Estique os braços para cima, para os lados e para trás.", tips: "Respire profundamente para relaxar os tecidos." },
            { name: "Rotação de Ombros", sets: "2", reps: "15", instructions: "Gire os ombros em círculos.", tips: "Solta a tensão." },
            { name: "Elevação de Calcanhar (Panturrilha)", sets: "2", reps: "15", instructions: "Fique na ponta dos pés de forma suave apoiando-se em uma parede para equilíbrio.", tips: "Trabalha a circulação das pernas e força do tornozelo." },
            { name: "Inclinação Lateral do Tronco", sets: "2", reps: "10 cada lado", instructions: "Mantenha as pernas firmes e desça a mão lateralmente pela coxa devagar.", tips: "Melhora a mobilidade da coluna e das costelas." }
          ]
        },
        light: {
          title: "Circuito Bio-Ativo Caseiro",
          items: [
            { name: "Escadas (Se disponível)", sets: "1", reps: "10 min", instructions: "Suba e desça degraus em ritmo constante.", tips: "Cuidado com o equilíbrio, use o corrimão se necessário." },
            { name: "Abdominal Crunch", sets: "3", reps: "15", instructions: "Deite-se, mãos na nuca e tire apenas as escápulas do chão.", tips: "Não puxe o pescoço, use a força do abdômen." },
            { name: "Elevação Lateral com Garrafas", sets: "3", reps: "15", instructions: "Use garrafas de água como peso, eleve os braços até a altura dos ombros.", tips: "Mantenha os cotovelos levemente flexionados." },
            { name: "Agachamento Parcial", sets: "3", reps: "15", instructions: "Desça apenas metade do caminho.", tips: "Foco na técnica e no alinhamento das pernas." },
            { name: "Chute Traseiro para Glúteos", sets: "3", reps: "12 cada lado", instructions: "Apoiando as mãos em uma cadeira ou sofá, estique uma perna para trás contraindo o glúteo.", tips: "Mantenha o tronco estável durante o chute." },
            { name: "Crucifixo Inverso com Garrafinha", sets: "3", reps: "12", instructions: "Incline o tronco levemente à frente mantendo a coluna alinhada e abra os braços com os pesos leves.", tips: "Excelente para a postura e força das costas superiores." }
          ]
        },
        moderate: {
          title: "Queima Total em Casa",
          items: [
            { name: "Polichinelos", sets: "4", reps: "45 seg", instructions: "Abra pernas e bata as mãos acima da cabeça simultaneamente.", tips: "Tente manter um ritmo constante sem pausas." },
            { name: "Mountain Climbers", sets: "4", reps: "30 seg", instructions: "Posição de flexão, traga os joelhos em direção ao peito alternadamente.", tips: "Mantenha o quadril baixo e o abdômen contraído." },
            { name: "Agachamento Sumô", sets: "3", reps: "20", instructions: "Afastamento largo das pernas, pontas dos pés para fora, desça o quadril.", tips: "Ótimo para trabalhar a parte interna das coxas." },
            { name: "Burpees Adaptados", sets: "3", reps: "10", instructions: "Agache, coloque as mãos no chão, estique as pernas, volte e salte.", tips: "Pode ser feito sem a flexão de braço para iniciantes." },
            { name: "Corrida Estacionária", sets: "3", reps: "1 min", instructions: "Corra no lugar subindo bem os joelhos.", tips: "Intensidade moderada." }
          ]
        },
        hard: {
          title: "Insanidade em Casa",
          items: [
            { name: "Burpees Completos", sets: "5", reps: "15", instructions: "Movimento total com flexão de braço no chão e salto explosivo.", tips: "Mantenha a fluidez do movimento, sem pausas entre as etapas." },
            { name: "Agachamento com Salto", sets: "4", reps: "15", instructions: "Agache e salte o mais alto que puder, amortecendo a queda com as pontas dos pés.", tips: "Explosão é o foco aqui." },
            { name: "Flexão Diamante", sets: "4", reps: "12", instructions: "Mãos juntas no chão formando um diamante, desça o peito até as mãos.", tips: "Trabalha intensamente o tríceps e a parte interna do peito." },
            { name: "Salto Lateral", sets: "4", reps: "20", instructions: "Salte lateralmente sobre uma linha imaginária.", tips: "Agilidade." },
            { name: "Prancha Alta com Toque no Tornozelo", sets: "4", reps: "15", instructions: "Na posição de prancha, eleve o quadril e toque a mão no tornozelo oposto alternadamente.", tips: "Exige bastante do abdômen e da coordenação motora." },
            { name: "Afundo com Salto (Jump Lunges)", sets: "4", reps: "10 cada lado", instructions: "Faça um afundo e dê um salto para trocar a posição das pernas no ar de forma dinâmica.", tips: "Queima calórica massiva e trabalho de pernas de alta intensidade." }
          ]
        },
        very_hard: {
          title: "Desafio 500 Repetições",
          items: [
            { name: "Prisioner Squats", sets: "1", reps: "100", instructions: "Mãos atrás da cabeça, agachamento profundo. Faça no menor tempo possível.", tips: "Divida em blocos se necessário, mas não perca o foco." },
            { name: "Flexão de Braço", sets: "1", reps: "50", instructions: "Peito encosta no chão a cada repetição.", tips: "Mantenha a postura mesmo em fadiga." },
            { name: "Abdominal infra", sets: "1", reps: "100", instructions: "Deitado, eleve as pernas juntas sem tocar o chão ao descer.", tips: "Pressione a lombar contra o colchonete." },
            { name: "Sprawl", sets: "4", reps: "15", instructions: "Movimento de defesa de queda, jogue as pernas para trás e o quadril no chão.", tips: "Alta demanda metabólica." },
            { name: "Burpee com Polichinelo Duplo", sets: "5", reps: "12", instructions: "Execute um burpee e, no topo do salto, faça dois polichinelos rápidos no ar ou ao cair.", tips: "Eleva o VO2 máximo a níveis extremos." },
            { name: "Prancha Walkouts (Trabalho de Lagarta)", sets: "4", reps: "12", instructions: "A partir de pé, coloque as mãos no chão, caminhe até a prancha de braços estendidos e retorne.", tips: "Fortalecimento total de core e estabilização de ombros." }
          ]
        }
      },
      muscle_gain: {
        very_light: {
          title: "Despertar Muscular",
          items: [
            { name: "Flexão na Parede", sets: "3", reps: "15", instructions: "Fique de frente para a parede e faça a flexão apoiando as mãos.", tips: "Ideal para quem está começando a ganhar força nos braços." },
            { name: "Agachamento Isométrico", sets: "3", reps: "20 seg", instructions: "Encoste na parede e fique na posição de agachado.", tips: "Mantenha o ângulo de 90 graus nas pernas." },
            { name: "Elevação Pélvica", sets: "3", reps: "15", instructions: "Eleve o quadril enquanto deitado.", tips: "Ativação de glúteos e posterior de coxa." },
            { name: "Rosca Isométrica com Toalha", sets: "3", reps: "20 seg", instructions: "Pise em uma toalha e puxe as pontas com os braços flexionados em 90 graus, fazendo força de bíceps.", tips: "Excelente exercício isométrico seguro para ganho de força inicial." },
            { name: "Super-homem Isométrico Leve", sets: "3", reps: "12 seg", instructions: "Deitado de bruços, eleve levemente o peito e as mãos do chão, segurando no topo.", tips: "Ativa a musculatura postural e lombar de forma suave." }
          ]
        },
        light: {
          title: "Tônico Muscular Caseiro",
          items: [
            { name: "Flexão de Joelhos", sets: "3", reps: "12", instructions: "Flexão de braço com apoio dos joelhos no solo.", tips: "Mantenha o alinhamento do tronco com as coxas." },
            { name: "Elevação de Panturrilha", sets: "3", reps: "20", instructions: "Fique na ponta dos pés e desça devagar.", tips: "Use um degrau para aumentar a amplitude se puder." },
            { name: "Prancha Abdominal", sets: "3", reps: "30 seg", instructions: "Mantenha o corpo reto apoiado nos antebraços.", tips: "Core firme e bacia alinhada com os ombros nos 30 segundos." },
            { name: "Agachamento Livre Clássico", sets: "3", reps: "12", instructions: "Agache até formar 90 graus nos joelhos, mantendo o abdômen contraído e peso nos calcanhares.", tips: "Mantenha os joelhos alinhados com as pontas dos pés." },
            { name: "Extensão de Tríceps com Resistência", sets: "3", reps: "12 cada lado", instructions: "Segure uma toalha atrás da nuca puxando com uma mão e a outra esticando para cima gerando tensão.", tips: "Método inteligente para exercitar o tríceps sem pesos." }
          ]
        },
        moderate: {
          title: "Calistenia e Força Caseira",
          items: [
            { name: "Flexão de Braços", sets: "4", reps: "Até a falha", instructions: "Desça o peito o máximo possível mantendo o corpo reto.", tips: "Se estiver muito difícil, apoie os joelhos no chão." },
            { name: "Afundo Alternado", sets: "4", reps: "12 cada perna", instructions: "Dê um passo à frente e desça o joelho de trás até quase tocar o chão.", tips: "Mantenha o tronco perpendicular ao solo." },
            { name: "Tríceps no Banco", sets: "3", reps: "15", instructions: "Use uma cadeira ou sofá firme para apoiar as mãos atrás do corpo.", tips: "Desça o quadril rente ao apoio para maior eficiência." },
            { name: "Abdominal Bicicleta", sets: "3", reps: "20 totais", instructions: "Traga o cotovelo direito ao joelho esquerdo e vice-versa, alternando.", tips: "Faça o movimento de forma lenta e controlada." },
            { name: "Agachamento com Pausa", sets: "3", reps: "12", instructions: "Agache e segure por 3 segundos embaixo.", tips: "Aumenta o tempo sob tensão." }
          ]
        },
        hard: {
          title: "Hipertrofia Calistênica",
          items: [
            { name: "Flexão Arqueiro", sets: "4", reps: "8 cada lado", instructions: "Mãos bem afastadas, desça para um lado enquanto o outro braço estica.", tips: "Muito exigente para o peitoral e ombros." },
            { name: "Agachamento Pistol (Adaptado)", sets: "4", reps: "8 cada perna", instructions: "Agache com uma perna só usando apoio se necessário.", tips: "Desenvolve força absurda nas pernas." },
            { name: "Burpee com Flexão Explosiva", sets: "4", reps: "10", instructions: "Burpee tradicionais com empurrão explosivo na flexão.", tips: "Potência pura." },
            { name: "Flexão Inclinada (Pés no Sofá)", sets: "4", reps: "12", instructions: "Coloque os pés apoiados no sofá ou cadeira e as mãos no chão para fazer a flexão.", tips: "Foco intenso na porção superior do peitoral e ombros de forma avançada." },
            { name: "Elevação Pélvica Unilateral", sets: "4", reps: "12 cada perna", instructions: "Deitado, mantenha uma perna esticada para cima e empurre o quadril usando apenas a de apoio.", tips: "Excelente hipertrofia isolada de glúteos e posterior de coxa." }
          ]
        },
        very_hard: {
          title: "Mestre da Calistenia",
          items: [
            { name: "Flexão Plantar (Handstand Pushup)", sets: "4", reps: "6-8", instructions: "Flexão de ponta cabeça apoiado na parede.", tips: "Foco total nos ombros, cuidado com a descida." },
            { name: "Flexão Explosiva", sets: "4", reps: "12", instructions: "Tire as mãos do chão na subida com um empurrão potente.", tips: "Bata palmas se conseguir." },
            { name: "Abdominal em V (V-Ups)", sets: "4", reps: "15", instructions: "Suba tronco e pernas simultaneamente tocando os pés.", tips: "Contração máxima da parede abdominal superior e inferior." },
            { name: "Pistol Squat Livre (Sem Apoios)", sets: "4", reps: "8 cada perna", instructions: "Agache totalmente com uma perna só de forma livre, mantendo a outra suspensa à frente.", tips: "Equilíbrio, controle articular e força de altíssimo nível." },
            { name: "Flexão Homem-Aranha (Spiderman Pushups)", sets: "4", reps: "12", instructions: "Faça uma flexão e traga o joelho lateralmente em direção ao cotovelo ao descer.", tips: "Força extrema de empurrar combinada com sobrecarga nos oblíquos." }
          ]
        }
      },
      maintenance: {
        very_light: {
          title: "Equilíbrio e Bem-Estar",
          items: [
            { name: "Círculos com os Braços", sets: "1", reps: "5 min", instructions: "Gire os braços para frente e para trás.", tips: "Solta a articulação do ombro de forma terapêutica." },
            { name: "Rotação de Tronco", sets: "1", reps: "5 min", instructions: "Gire o corpo para os lados levemente de forma ritmada.", tips: "Ótimo para lubrificar as vértebras da coluna." },
            { name: "Mobilidade de Quadril", sets: "2", reps: "15", instructions: "Abra a perna lateralmente e gire suavemente.", tips: "Melhora a passada no dia a dia." },
            { name: "Mobilidade de Tornozelo na Parede", sets: "2", reps: "12 cada pé", instructions: "Apoie as mãos na parede e empurre o joelho para frente sem tirar o calcanhar oposto do chão.", tips: "Melhora a mobilidade de dorsiflexão antes das caminhadas." },
            { name: "Circundução de Pescoço Aliviadora", sets: "1", reps: "2 min", instructions: "Rotacione suavemente a cabeça em sentido horário e anti-horário respirando compassadamente.", tips: "Alivia a tensão acumulada no trapézio superior." }
          ]
        },
        light: {
          title: "Ativação Matinal",
          items: [
            { name: "Polichinelos Leves", sets: "3", reps: "30 seg", instructions: "Movimento coordenado mas sem impacto excessivo.", tips: "Foque na constância do movimento ritmado." },
            { name: "Equilíbrio Unipodal", sets: "2", reps: "30 seg cada perna", instructions: "Fique em um pé só tentando manter-se o mais estável possível.", tips: "Excelente propriocepção para reabilitação e controle de tornozelo." },
            { name: "Gato e Camelo", sets: "3", reps: "12", instructions: "De joelhos, curve e estenda a coluna olhando para cima e para baixo alternadamente.", tips: "Saúde vertebral essencial anti-sedentarismo." },
            { name: "Passeio do Caranguejo Leve", sets: "3", reps: "10 passos", instructions: "Com as costas para o chão, quadris suspensos, use mãos e pés para andar curto.", tips: "Excelente ativação muscular generalizada de ombros e lombar." },
            { name: "Superman Bird Dog Alternado", sets: "3", reps: "12 totais", instructions: "Em 4 apoios, estenda o braço direito e a perna esquerda, depois alterne.", tips: "Fortalecimento lombo-pélvico seguro e coordenador." }
          ]
        },
        moderate: {
          title: "Funcional Mobilidade e Saúde",
          items: [
            { name: "Corrida Estacionária", sets: "3", reps: "1 min", instructions: "Simule uma corrida sem sair do lugar, elevando bem os joelhos.", tips: "Use os braços para auxiliar na coordenação." },
            { name: "Ponte de Glúteos", sets: "3", reps: "15", instructions: "Deitado de costas, eleve o quadril o máximo possível contraindo os glúteos.", tips: "Mantenha os calcanhares bem apoiados no chão." },
            { name: "Super Homem (Lombar)", sets: "3", reps: "12", instructions: "Deitado de bruços, eleve tronco e pernas simultaneamente.", tips: "Mantenha o olhar voltado para o chão para não forçar o pescoço." },
            { name: "Alongamento Cobra", sets: "1", reps: "1 min", instructions: "Deitado de bruços, empurre o chão com as mãos e estique o abdômen.", tips: "Respire fundo e mantenha os ombros relaxados." },
            { name: "Agachamento Peso do Corpo", sets: "3", reps: "20", instructions: "Agache mantendo a postura.", tips: "Mantenha o peso nos calcanhares." }
          ]
        },
        hard: {
          title: "Circuito de Resistência Caseiro",
          items: [
            { name: "Burpees", sets: "3", reps: "12", instructions: "Agacha, estica, volta e salta.", tips: "Mantém o coração acelerado." },
            { name: "Prancha com Toque no Ombro", sets: "3", reps: "20 totais", instructions: "Na posição de prancha alta, toque o ombro oposto.", tips: "Tente não balançar o quadril." },
            { name: "Escalador", sets: "3", reps: "45 seg", instructions: "Traga o joelho ao peito rápido.", tips: "Intensidade cardio elevada." },
            { name: "Meio Agachamento Lateral Isométrico", sets: "3", reps: "45 seg", instructions: "Mantenha o corpo em meio agachamento e caminhe lateralmente de forma constante.", tips: "Trabalho excelente de estabilização lateral do quadril." },
            { name: "Flexão com Rotação de Tronco (T-Pushups)", sets: "4", reps: "12", instructions: "Após cada flexão, rotacione o corpo elevando uma das mãos ao teto.", tips: "Desafia o peito e a força rotacional oblíqua do tronco." }
          ]
        },
        very_hard: {
          title: "Desafio de Condicionamento",
          items: [
            { name: "Salto em Caixa (ou degrau alto)", sets: "4", reps: "15", instructions: "Salte em cima de um objeto firme.", tips: "Extensão total do quadril no topo." },
            { name: "Escalador Explosivo", sets: "4", reps: "45 seg", instructions: "Mountain climbers em alta velocidade.", tips: "Foco na agilidade e explosão metabólica." },
            { name: "Burpee 180 Graus", sets: "4", reps: "10", instructions: "Faça o burpee e salte girando 180 graus.", tips: "Desafio espacial, labiríntico e físico de alta classe." },
            { name: "Prancha Estrela Estabilizadora", sets: "4", reps: "45 seg", instructions: "Em posição de prancha lateral, eleve um braço e uma perna apontando para o teto de forma isométrica.", tips: "Requer controle unilateral absurdo." },
            { name: "Agachamento Búlgaro Saltado (Explosivo)", sets: "3", reps: "10 cada lado", instructions: "Apoie um pé atrás no sofá, faça o agachamento de uma perna e salte estendendo a perna de apoio explosivamente.", tips: "Potência extrema isolada em uma perna, excelente ativador de glúteos." }
          ]
        }
      }
    }
  };

  const env = trainingEnvironment || 'home';
  const level = fitnessLevel || 'moderate';
  
  const goalPlans = workoutDatabase[env][goal] || workoutDatabase[env].maintenance;
  const plan = goalPlans[level] || goalPlans['moderate'] || workoutDatabase[env].maintenance['moderate'];
  
  return {
    ...plan,
    goal,
    fitnessLevel: level,
    trainingEnvironment: env
  };
};
