import { useLocation } from "react-router-dom";
import TabGuide from "@/components/TabGuide";
import { TAB_GUIDES } from "@/lib/tabGuideData";

const ROUTE_TO_TAB: Record<string, string> = {
  "/": "dashboard",
  "/treino": "treino",
  "/dieta": "dieta",
  "/metas": "metas",
  "/historico": "historico",
  "/acompanhamento": "acompanhamento",
  "/analise": "analise",
  "/perfil": "perfil",
  "/configuracoes": "configuracoes",
  "/convites": "convites",
  "/perfil-fitness": "perfil-fitness",
  "/score-fitness": "score-fitness",
  "/evolucao": "evolucao-treino",
  "/evolucao-alimentar": "evolucao-alimentar",
};

const RouteGuide = () => {
  const { pathname } = useLocation();
  const tabKey = ROUTE_TO_TAB[pathname];

  if (!tabKey || !TAB_GUIDES[tabKey]) return null;

  return <TabGuide tabKey={tabKey} steps={TAB_GUIDES[tabKey]} />;
};

export default RouteGuide;
