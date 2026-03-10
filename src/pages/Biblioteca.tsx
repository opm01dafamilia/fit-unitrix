import { useState } from "react";
import { Search, Dumbbell, ChevronRight, ArrowLeft, X, Plus, Info, Zap, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import {
  exerciseLibrary,
  allMuscleGroups,
  muscleGroupIcons,
  searchExercises,
  getExercisesByGroup,
  getExerciseById,
  getRelatedExercises,
  type ExerciseDetail,
  type MuscleGroup,
} from "@/lib/exerciseLibrary";

const difficultyColors: Record<string, string> = {
  iniciante: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  intermediário: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  avançado: "bg-red-500/15 text-red-400 border-red-500/20",
};

const Biblioteca = () => {
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);

  const filteredExercises = selectedGroup
    ? getExercisesByGroup(selectedGroup).filter(
        (e) => !query || e.nome.toLowerCase().includes(query.toLowerCase())
      )
    : searchExercises(query);

  const groupedExercises = selectedGroup
    ? null
    : allMuscleGroups.map((g) => ({
        ...g,
        exercises: filteredExercises.filter((e) => e.grupo === g.key),
      })).filter((g) => g.exercises.length > 0);

  const handleAddToWorkout = (exercise: ExerciseDetail) => {
    toast.success(`"${exercise.nome}" marcado para adicionar ao próximo treino!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Exercícios</h1>
            <p className="text-sm text-muted-foreground">{exerciseLibrary.length} exercícios disponíveis</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar exercícios..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedGroup(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            !selectedGroup
              ? "bg-primary/15 text-primary border-primary/20"
              : "bg-secondary/60 text-muted-foreground border-border/50 hover:bg-secondary"
          }`}
        >
          Todos
        </button>
        {allMuscleGroups.map((g) => (
          <button
            key={g.key}
            onClick={() => setSelectedGroup(selectedGroup === g.key ? null : g.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              selectedGroup === g.key
                ? "bg-primary/15 text-primary border-primary/20"
                : "bg-secondary/60 text-muted-foreground border-border/50 hover:bg-secondary"
            }`}
          >
            {muscleGroupIcons[g.key]} {g.label}
          </button>
        ))}
      </div>

      {/* Selected group header */}
      {selectedGroup && (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedGroup(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold">
            {muscleGroupIcons[selectedGroup]} {allMuscleGroups.find((g) => g.key === selectedGroup)?.label}
          </h2>
          <span className="text-xs text-muted-foreground">({filteredExercises.length} exercícios)</span>
        </div>
      )}

      {/* Exercise list */}
      {selectedGroup ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredExercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} onClick={() => setSelectedExercise(ex)} />
          ))}
        </div>
      ) : (
        groupedExercises?.map((group) => (
          <div key={group.key} className="space-y-3">
            <button
              onClick={() => setSelectedGroup(group.key)}
              className="flex items-center gap-2 group"
            >
              <h2 className="font-semibold text-sm">
                {muscleGroupIcons[group.key]} {group.label}
              </h2>
              <span className="text-xs text-muted-foreground">({group.exercises.length})</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.exercises.slice(0, 4).map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} onClick={() => setSelectedExercise(ex)} />
              ))}
            </div>
            {group.exercises.length > 4 && (
              <button
                onClick={() => setSelectedGroup(group.key)}
                className="text-xs text-primary hover:underline"
              >
                Ver todos ({group.exercises.length})
              </button>
            )}
          </div>
        ))
      )}

      {filteredExercises.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum exercício encontrado</p>
        </div>
      )}

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden bg-card">
          {selectedExercise && (
            <ExerciseDetailView
              exercise={selectedExercise}
              onClose={() => setSelectedExercise(null)}
              onAdd={handleAddToWorkout}
              onSelectRelated={(ex) => setSelectedExercise(ex)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ExerciseCard({ exercise, onClick }: { exercise: ExerciseDetail; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:bg-primary/5 transition-all text-left w-full group"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
        <Dumbbell className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{exercise.nome}</p>
        <p className="text-xs text-muted-foreground truncate">{exercise.musculos.slice(0, 2).join(", ")}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColors[exercise.dificuldade]}`}>
          {exercise.dificuldade}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function ExerciseDetailView({
  exercise,
  onClose,
  onAdd,
  onSelectRelated,
}: {
  exercise: ExerciseDetail;
  onClose: () => void;
  onAdd: (ex: ExerciseDetail) => void;
  onSelectRelated: (ex: ExerciseDetail) => void;
}) {
  const related = getRelatedExercises(exercise.id);

  return (
    <ScrollArea className="max-h-[90vh]">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 shrink-0">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <DialogHeader>
              <DialogTitle className="text-lg text-left">{exercise.nome}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColors[exercise.dificuldade]}`}>
                {exercise.dificuldade}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-secondary/60 text-muted-foreground border-border/50">
                {exercise.tipo}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-secondary/60 text-muted-foreground border-border/50">
                {exercise.equipamento}
              </span>
            </div>
          </div>
        </div>

        {/* Muscles */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Músculos trabalhados
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {exercise.musculos.map((m, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {m}
              </Badge>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Execução
          </h3>
          <ol className="space-y-2">
            {exercise.instrucoes.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <h3 className="text-xs font-semibold text-amber-400 mb-1.5">💡 Dicas importantes</h3>
          <ul className="space-y-1">
            {exercise.dicas.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Related exercises */}
        {related.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              🔄 Exercícios relacionados
            </h3>
            <div className="space-y-1.5">
              {related.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => onSelectRelated(rel)}
                  className="flex items-center gap-2.5 w-full p-2.5 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors text-left"
                >
                  <Dumbbell className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm flex-1">{rel.nome}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add to workout */}
        <Button onClick={() => onAdd(exercise)} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Adicionar ao treino
        </Button>
      </div>
    </ScrollArea>
  );
}

export default Biblioteca;
