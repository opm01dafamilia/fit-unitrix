import type { ReactNode } from "react";

type GuideStep = { title: string; description: string; icon?: string };

export const TAB_GUIDES: Record<string, GuideStep[]> = {
  dashboard: [
    { title: "Bem-vindo ao Dashboard!", icon: "🏠", description: "Aqui você vê um resumo completo da sua jornada fitness: treinos, dieta, streaks e progresso semanal." },
    { title: "Acompanhe tudo", icon: "📊", description: "Gráficos de evolução, XP acumulado, nível e conquistas — tudo num só lugar para te manter motivado." },
  ],
  treino: [
    { title: "Seu Plano de Treino", icon: "💪", description: "Aqui você gera e gerencia seu plano de treino personalizado com base no seu perfil e objetivos." },
    { title: "Execute e registre", icon: "🏋️", description: "Inicie cada treino, registre séries e cargas, e acompanhe seu progresso em tempo real." },
    { title: "Cardio e Alongamento", icon: "❤️", description: "Também encontra opções de cardio e alongamento para complementar seu treino." },
  ],
  dieta: [
    { title: "Seu Plano Alimentar", icon: "🍎", description: "Gere um plano de dieta personalizado de acordo com seu objetivo, peso e nível de atividade." },
    { title: "Acompanhe refeições", icon: "✅", description: "Marque as refeições feitas no dia e acompanhe sua aderência ao plano." },
  ],
  metas: [
    { title: "Defina suas Metas", icon: "🎯", description: "Crie metas de peso, medidas, treinos ou qualquer objetivo fitness que você quiser atingir." },
    { title: "Acompanhe o progresso", icon: "📈", description: "Veja o quanto falta para cada meta e receba motivação para continuar." },
  ],
  historico: [
    { title: "Seu Histórico", icon: "📋", description: "Consulte todo o histórico de treinos, dieta, medidas corporais e metas concluídas." },
    { title: "Dados organizados", icon: "🗂️", description: "Use os filtros por categoria para encontrar exatamente o que procura." },
  ],
  acompanhamento: [
    { title: "Acompanhamento Corporal", icon: "📏", description: "Registre suas medidas e peso regularmente para ver sua evolução ao longo do tempo." },
    { title: "Gráficos de evolução", icon: "📉", description: "Acompanhe tendências de peso, gordura corporal e medidas com gráficos visuais." },
  ],
  analise: [
    { title: "Análise Corporal", icon: "🔬", description: "Veja uma análise detalhada da sua composição corporal e evolução das medidas." },
  ],
  perfil: [
    { title: "Seu Perfil", icon: "👤", description: "Atualize seus dados pessoais, foto, sexo biológico e informações de localização." },
    { title: "Dados que importam", icon: "⚙️", description: "Manter seu perfil atualizado garante treinos e dietas mais precisos." },
  ],
  configuracoes: [
    { title: "Configurações", icon: "🔧", description: "Ajuste preferências de notificações, módulos do menu e unidades de medida." },
  ],
  convites: [
    { title: "Convites", icon: "🎁", description: "Aqui você pode convidar amigos para a plataforma e ganhar XP social. (Em manutenção no momento)" },
  ],
  "perfil-fitness": [
    { title: "Perfil Fitness", icon: "🏅", description: "Veja seu nível fitness, ranking, conquistas e detalhes da sua evolução esportiva." },
  ],
  "score-fitness": [
    { title: "Score Fitness", icon: "⚡", description: "Descubra sua pontuação fitness calculada com base na sua consistência, treinos e dieta." },
  ],
  "evolucao-treino": [
    { title: "Evolução de Treino", icon: "📊", description: "Acompanhe a progressão de carga, volume e frequência dos seus treinos ao longo do tempo." },
  ],
  "evolucao-alimentar": [
    { title: "Evolução Alimentar", icon: "🥗", description: "Veja como sua aderência à dieta evoluiu semana a semana." },
  ],
};
