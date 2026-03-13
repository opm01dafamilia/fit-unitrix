import { cn } from "@/lib/utils";

/** Base shimmer block – replaces Skeleton for premium dark-theme shimmer */
const Shimmer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-xl skeleton-shimmer", className)} {...props} />
);

// ========== DASHBOARD ==========
export const DashboardSkeleton = () => (
  <div className="space-y-7 animate-slide-up">
    <div>
      <Shimmer className="h-8 w-52 mb-2" />
      <Shimmer className="h-4 w-36" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="metric-card p-4 lg:p-5 space-y-3">
          <Shimmer className="h-9 w-9 rounded-xl" />
          <Shimmer className="h-8 w-20" />
          <Shimmer className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="glass-card p-5 space-y-4">
      <Shimmer className="h-5 w-40" />
      <Shimmer className="h-48 rounded-xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-5 space-y-3">
        <Shimmer className="h-5 w-32" />
        {[1, 2].map(i => <Shimmer key={i} className="h-14 rounded-lg" />)}
      </div>
      <div className="glass-card p-5 space-y-3">
        <Shimmer className="h-5 w-32" />
        {[1, 2].map(i => <Shimmer key={i} className="h-14 rounded-lg" />)}
      </div>
    </div>
  </div>
);

// ========== TREINO (Dashboard view) ==========
export const TreinoDashboardSkeleton = () => (
  <div className="space-y-4">
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-3 w-24" />
        </div>
        <Shimmer className="h-10 w-28 rounded-xl" />
      </div>
      <Shimmer className="h-2.5 w-full rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[1, 2].map(i => (
        <div key={i} className="glass-card p-5 space-y-3">
          <Shimmer className="w-10 h-10 rounded-xl" />
          <Shimmer className="h-7 w-16" />
          <Shimmer className="h-3 w-24" />
        </div>
      ))}
    </div>
    <div className="glass-card p-5 space-y-3">
      <Shimmer className="h-4 w-32" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/20">
          <Shimmer className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-3 w-20" />
          </div>
          <Shimmer className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

// ========== TREINO (Generator saved plans) ==========
export const TreinoPlansSkeleton = () => (
  <div className="glass-card p-5 lg:p-6 space-y-2">
    {[1, 2].map(i => (
      <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/20">
        <Shimmer className="w-9 h-9 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-3 w-28" />
        </div>
      </div>
    ))}
  </div>
);

// ========== DIETA ==========
export const DietaSkeleton = () => (
  <div className="space-y-5 animate-slide-up">
    <div>
      <Shimmer className="h-8 w-48 mb-2" />
      <Shimmer className="h-4 w-64" />
    </div>
    {/* Macro summary */}
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="w-12 h-12 rounded-2xl" />
        <div className="space-y-1.5">
          <Shimmer className="h-5 w-36" />
          <Shimmer className="h-3 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="text-center space-y-1">
            <Shimmer className="h-6 w-12 mx-auto" />
            <Shimmer className="h-3 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </div>
    {/* Meal cards */}
    {[1, 2, 3].map(i => (
      <div key={i} className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Shimmer className="w-9 h-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-3 w-36" />
          </div>
          <Shimmer className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// ========== CONQUISTAS ==========
export const ConquistasSkeleton = () => (
  <div className="space-y-5 animate-slide-up">
    <div className="flex items-center gap-3">
      <Shimmer className="h-9 w-9 rounded-lg" />
      <div>
        <Shimmer className="h-7 w-36 mb-1" />
        <Shimmer className="h-3 w-48" />
      </div>
    </div>
    {/* Rank card */}
    <div className="glass-card p-5 glow-border space-y-4">
      <div className="flex items-center gap-4">
        <Shimmer className="w-16 h-16 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-2.5 w-full rounded-full" />
        </div>
      </div>
    </div>
    {/* Achievement grid */}
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="glass-card p-4 space-y-2.5">
          <Shimmer className="w-10 h-10 rounded-xl mx-auto" />
          <Shimmer className="h-4 w-20 mx-auto" />
          <Shimmer className="h-3 w-28 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

// ========== RANKING ==========
export const RankingSkeleton = () => (
  <div className="space-y-7 animate-slide-up">
    <div>
      <Shimmer className="h-8 w-48 mb-1" />
      <Shimmer className="h-4 w-64" />
    </div>
    {/* User rank card */}
    <div className="glass-card p-5 glow-border space-y-3">
      <div className="flex items-center gap-4">
        <Shimmer className="w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-5 w-32" />
          <Shimmer className="h-3 w-20" />
        </div>
        <Shimmer className="h-10 w-16 rounded-xl" />
      </div>
      <Shimmer className="h-2 w-full rounded-full" />
    </div>
    {/* Stats row */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="metric-card p-4 space-y-2">
          <Shimmer className="h-8 w-8 rounded-lg" />
          <Shimmer className="h-6 w-14" />
          <Shimmer className="h-3 w-20" />
        </div>
      ))}
    </div>
    {/* Ranking list */}
    <div className="glass-card overflow-hidden">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3 p-4 border-b border-border/30 last:border-0">
          <Shimmer className="w-7 h-7 rounded-full" />
          <Shimmer className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-3 w-20" />
          </div>
          <Shimmer className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

// ========== PERFIL FITNESS ==========
export const PerfilFitnessSkeleton = () => (
  <div className="space-y-5 animate-slide-up">
    <div className="flex items-center gap-3">
      <Shimmer className="h-9 w-9 rounded-lg" />
      <Shimmer className="h-7 w-36" />
    </div>
    {/* Hero card */}
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-4">
        <Shimmer className="w-16 h-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-6 w-36" />
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-3 w-48" />
        </div>
      </div>
    </div>
    {/* Stats grid */}
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="metric-card p-4 space-y-2">
          <Shimmer className="h-8 w-8 rounded-lg" />
          <Shimmer className="h-7 w-14" />
          <Shimmer className="h-3 w-24" />
        </div>
      ))}
    </div>
    {/* Chart */}
    <div className="glass-card p-5 space-y-3">
      <Shimmer className="h-5 w-40" />
      <Shimmer className="h-40 rounded-xl" />
    </div>
  </div>
);

// ========== HISTÓRICO ==========
export const HistoricoSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="glass-card p-4">
        <div className="flex items-center gap-3">
          <Shimmer className="w-9 h-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-3 w-36" />
          </div>
          <Shimmer className="h-4 w-16 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

// ========== ANÁLISE CORPORAL ==========
export const AnaliseCorporalSkeleton = () => (
  <div className="space-y-7 animate-slide-up">
    <div>
      <Shimmer className="h-8 w-64 mb-2" />
      <Shimmer className="h-4 w-48" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="metric-card p-4 space-y-2">
          <Shimmer className="h-8 w-8 rounded-lg" />
          <Shimmer className="h-7 w-16" />
          <Shimmer className="h-3 w-20" />
        </div>
      ))}
    </div>
    <div className="glass-card p-5 space-y-3">
      <Shimmer className="h-5 w-40" />
      <Shimmer className="h-48 rounded-xl" />
    </div>
  </div>
);

// ========== COMUNIDADE ==========
export const ComunidadeSkeleton = () => (
  <div className="space-y-7 animate-slide-up">
    <div>
      <Shimmer className="h-8 w-48 mb-1" />
      <Shimmer className="h-4 w-64" />
    </div>
    <div className="glass-card p-5 space-y-3">
      <Shimmer className="h-5 w-40" />
      <Shimmer className="h-3 w-full" />
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className="glass-card p-4">
        <div className="flex items-center gap-3">
          <Shimmer className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-3 w-48" />
          </div>
        </div>
        <div className="flex gap-2 mt-3 pl-13">
          {[1, 2, 3].map(j => <Shimmer key={j} className="h-7 w-12 rounded-full" />)}
        </div>
      </div>
    ))}
  </div>
);

export { Shimmer };
