import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Dumbbell, TrendingUp, ArrowLeft, Trash2, Eye,
  Loader2, Search, UserPlus, ClipboardList, ChevronDown, ChevronUp,
  Save, X, ArrowUp, ArrowDown, Weight, Clock, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Student = {
  id: string;
  trainer_id: string;
  student_name: string;
  student_email: string | null;
  notes: string | null;
  created_at: string;
};

type TrainerPlan = {
  id: string;
  trainer_id: string;
  student_id: string;
  title: string;
  plan_data: any;
  notes: string | null;
  created_at: string;
};

type ManualExercise = {
  nome: string;
  series: string;
  reps: string;
  descanso: string;
  carga: string;
  obs: string;
  ordem: number;
};

type ManualDay = {
  dia: string;
  grupo: string;
  exercicios: ManualExercise[];
};

type View = "list" | "add-student" | "student-detail" | "create-workout" | "view-workout" | "edit-exercise";

const dayOptions = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const muscleGroups = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Glúteos",
  "Abdômen", "Panturrilha", "Antebraço", "Peito + Tríceps", "Costas + Bíceps",
  "Pernas + Glúteos", "Ombros + Abdômen", "Superior", "Inferior", "Full Body"
];

const defaultExercise = (): ManualExercise => ({
  nome: "", series: "3", reps: "12", descanso: "60s", carga: "", obs: "", ordem: 0
});

const Personal = () => {
  const { user } = useAuth();
  const { isPersonal, loading: roleLoading } = useUserRole();

  const [view, setView] = useState<View>("list");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add student form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Selected student
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentPlans, setStudentPlans] = useState<TrainerPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Create workout
  const [workoutTitle, setWorkoutTitle] = useState("Treino A");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutDays, setWorkoutDays] = useState<ManualDay[]>([
    { dia: "Segunda", grupo: "", exercicios: [{ ...defaultExercise(), ordem: 1 }] }
  ]);
  const [expandedDayIdx, setExpandedDayIdx] = useState<number>(0);

  // Edit exercise dialog
  const [editingExercise, setEditingExercise] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [editForm, setEditForm] = useState<ManualExercise>(defaultExercise());

  // View workout
  const [viewingPlan, setViewingPlan] = useState<TrainerPlan | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"student" | "plan">("student");

  const loadStudents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("trainer_students" as any)
      .select("*")
      .eq("trainer_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setStudents((data as any[]) || []);
    setLoading(false);
  }, [user]);

  const loadStudentPlans = useCallback(async (studentId: string) => {
    if (!user) return;
    setLoadingPlans(true);
    const { data, error } = await supabase
      .from("trainer_workout_plans" as any)
      .select("*")
      .eq("trainer_id", user.id)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    if (!error) setStudentPlans((data as any[]) || []);
    setLoadingPlans(false);
  }, [user]);

  useEffect(() => {
    if (user && isPersonal) loadStudents();
  }, [user, isPersonal, loadStudents]);

  const handleAddStudent = async () => {
    if (!user || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("trainer_students" as any).insert({
      trainer_id: user.id,
      student_name: newName.trim(),
      student_email: newEmail.trim() || null,
      notes: newNotes.trim() || null,
    } as any);
    if (error) {
      toast.error("Erro ao adicionar aluno");
    } else {
      toast.success("Aluno adicionado! 🎉");
      setNewName(""); setNewEmail(""); setNewNotes("");
      loadStudents();
      setView("list");
    }
    setSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    if (deleteType === "student") {
      const { error } = await supabase.from("trainer_students" as any).delete().eq("id", deletingId);
      if (error) toast.error("Erro ao remover aluno");
      else { toast.success("Aluno removido"); loadStudents(); if (selectedStudent?.id === deletingId) setView("list"); }
    } else {
      const { error } = await supabase.from("trainer_workout_plans" as any).delete().eq("id", deletingId);
      if (error) toast.error("Erro ao remover treino");
      else { toast.success("Treino removido"); if (selectedStudent) loadStudentPlans(selectedStudent.id); }
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleSaveWorkout = async () => {
    if (!user || !selectedStudent) return;
    const hasExercises = workoutDays.some(d => d.exercicios.some(e => e.nome.trim()));
    if (!hasExercises) { toast.error("Adicione pelo menos um exercício"); return; }

    setSaving(true);
    const cleanDays = workoutDays.map(d => ({
      ...d,
      exercicios: d.exercicios
        .filter(e => e.nome.trim())
        .map((e, i) => ({ ...e, ordem: i + 1 })),
    })).filter(d => d.exercicios.length > 0);

    const { error } = await supabase.from("trainer_workout_plans" as any).insert({
      trainer_id: user.id,
      student_id: selectedStudent.id,
      title: workoutTitle.trim() || "Treino",
      plan_data: cleanDays,
      notes: workoutNotes.trim() || null,
    } as any);

    if (error) {
      toast.error("Erro ao salvar treino");
    } else {
      toast.success("Treino criado para o aluno! 💪");
      loadStudentPlans(selectedStudent.id);
      setView("student-detail");
      resetWorkoutForm();
    }
    setSaving(false);
  };

  const resetWorkoutForm = () => {
    setWorkoutTitle("Treino A");
    setWorkoutNotes("");
    setWorkoutDays([{ dia: "Segunda", grupo: "", exercicios: [{ ...defaultExercise(), ordem: 1 }] }]);
    setExpandedDayIdx(0);
  };

  // Exercise helpers
  const addExercise = (dayIdx: number) => {
    const updated = [...workoutDays];
    const nextOrdem = updated[dayIdx].exercicios.length + 1;
    updated[dayIdx].exercicios.push({ ...defaultExercise(), ordem: nextOrdem });
    setWorkoutDays(updated);
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    const updated = [...workoutDays];
    updated[dayIdx].exercicios.splice(exIdx, 1);
    updated[dayIdx].exercicios.forEach((e, i) => e.ordem = i + 1);
    setWorkoutDays(updated);
  };

  const updateExercise = (dayIdx: number, exIdx: number, field: keyof ManualExercise, value: string | number) => {
    const updated = [...workoutDays];
    (updated[dayIdx].exercicios[exIdx] as any)[field] = value;
    setWorkoutDays(updated);
  };

  const moveExercise = (dayIdx: number, exIdx: number, direction: "up" | "down") => {
    const updated = [...workoutDays];
    const exercises = updated[dayIdx].exercicios;
    const newIdx = direction === "up" ? exIdx - 1 : exIdx + 1;
    if (newIdx < 0 || newIdx >= exercises.length) return;
    [exercises[exIdx], exercises[newIdx]] = [exercises[newIdx], exercises[exIdx]];
    exercises.forEach((e, i) => e.ordem = i + 1);
    setWorkoutDays(updated);
  };

  const openEditExercise = (dayIdx: number, exIdx: number) => {
    setEditForm({ ...workoutDays[dayIdx].exercicios[exIdx] });
    setEditingExercise({ dayIdx, exIdx });
  };

  const saveEditExercise = () => {
    if (!editingExercise) return;
    const updated = [...workoutDays];
    updated[editingExercise.dayIdx].exercicios[editingExercise.exIdx] = { ...editForm };
    setWorkoutDays(updated);
    setEditingExercise(null);
    toast.success("Exercício atualizado");
  };

  const addDay = () => {
    const usedDays = workoutDays.map(d => d.dia);
    const nextDay = dayOptions.find(d => !usedDays.includes(d)) || `Dia ${workoutDays.length + 1}`;
    setWorkoutDays([...workoutDays, { dia: nextDay, grupo: "", exercicios: [{ ...defaultExercise(), ordem: 1 }] }]);
    setExpandedDayIdx(workoutDays.length);
  };

  const removeDay = (idx: number) => {
    if (workoutDays.length <= 1) return;
    const updated = workoutDays.filter((_, i) => i !== idx);
    setWorkoutDays(updated);
    setExpandedDayIdx(Math.min(expandedDayIdx, updated.length - 1));
  };

  const filteredStudents = students.filter(s =>
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.student_email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============ ROLE CHECK ============
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPersonal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-secondary/60 flex items-center justify-center mb-6 border border-border/30">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-bold mb-2">Modo Personal</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Esta área é exclusiva para personal trainers. Solicite acesso para gerenciar seus alunos.
        </p>
      </div>
    );
  }

  // ============ VIEW: VIEW WORKOUT ============
  if (view === "view-workout" && viewingPlan) {
    const planDays = (viewingPlan.plan_data || []) as ManualDay[];
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setViewingPlan(null); setView("student-detail"); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-display font-bold truncate">{viewingPlan.title}</h1>
            <p className="text-xs text-muted-foreground">{selectedStudent?.student_name}</p>
          </div>
        </div>

        {viewingPlan.notes && (
          <div className="rounded-xl border border-border/30 bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground">{viewingPlan.notes}</p>
          </div>
        )}

        <div className="space-y-4">
          {planDays.map((day, i) => (
            <div key={i} className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))" }}>
              <div className="p-4 border-b border-border/20">
                <h3 className="font-display font-bold text-base">{day.dia}</h3>
                {day.grupo && <p className="text-xs text-primary font-medium mt-0.5">{day.grupo}</p>}
              </div>
              <div className="p-3 space-y-2">
                {day.exercicios.map((ex, j) => (
                  <div key={j} className="py-3 px-3 rounded-xl bg-secondary/30 border border-border/15 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{j + 1}</span>
                      </div>
                      <p className="text-sm font-semibold truncate flex-1">{ex.nome}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-11">
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 rounded-md px-2 py-0.5">
                        <Dumbbell className="w-2.5 h-2.5" /> {ex.series}x{ex.reps}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 rounded-md px-2 py-0.5">
                        <Clock className="w-2.5 h-2.5" /> {ex.descanso}
                      </span>
                      {ex.carga && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 rounded-md px-2 py-0.5">
                          <Weight className="w-2.5 h-2.5" /> {ex.carga}
                        </span>
                      )}
                    </div>
                    {ex.obs && (
                      <p className="text-[10px] text-muted-foreground ml-11 italic flex items-start gap-1">
                        <MessageSquare className="w-2.5 h-2.5 mt-0.5 shrink-0" /> {ex.obs}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============ VIEW: CREATE WORKOUT ============
  if (view === "create-workout" && selectedStudent) {
    const totalExercises = workoutDays.reduce((acc, d) => acc + d.exercicios.filter(e => e.nome.trim()).length, 0);

    return (
      <div className="space-y-6 animate-slide-up pb-24">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView("student-detail")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-display font-bold">Criar Treino Manual</h1>
            <p className="text-xs text-muted-foreground">Para: {selectedStudent.student_name}</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/20 p-3">
          <div className="flex-1 text-center">
            <p className="text-lg font-display font-black text-primary">{workoutDays.length}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Dias</p>
          </div>
          <div className="w-px h-8 bg-border/30" />
          <div className="flex-1 text-center">
            <p className="text-lg font-display font-black text-primary">{totalExercises}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Exercícios</p>
          </div>
        </div>

        {/* Workout meta */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome do treino</Label>
            <Input value={workoutTitle} onChange={e => setWorkoutTitle(e.target.value)} placeholder="Ex: Treino A - Superior" className="bg-secondary/50 border-border/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observações gerais (opcional)</Label>
            <Textarea value={workoutNotes} onChange={e => setWorkoutNotes(e.target.value)} placeholder="Notas sobre o treino..." className="bg-secondary/50 border-border/50 min-h-[60px]" />
          </div>
        </div>

        {/* Days */}
        <div className="space-y-4">
          {workoutDays.map((day, dayIdx) => (
            <div key={dayIdx} className="rounded-2xl border border-border/30 overflow-hidden shadow-sm" style={{ background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))" }}>
              {/* Day header */}
              <button
                onClick={() => setExpandedDayIdx(expandedDayIdx === dayIdx ? -1 : dayIdx)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm">{day.dia}{day.grupo ? ` — ${day.grupo}` : ""}</p>
                    <p className="text-[10px] text-muted-foreground">{day.exercicios.filter(e => e.nome.trim()).length} exercício(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {workoutDays.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removeDay(dayIdx); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {expandedDayIdx === dayIdx ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Day content */}
              {expandedDayIdx === dayIdx && (
                <div className="px-4 pb-4 space-y-4 border-t border-border/20 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">Dia da semana</Label>
                      <Select value={day.dia} onValueChange={v => { const u = [...workoutDays]; u[dayIdx].dia = v; setWorkoutDays(u); }}>
                        <SelectTrigger className="bg-secondary/50 border-border/50 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {dayOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground mb-1 block">Grupo muscular</Label>
                      <Select value={day.grupo} onValueChange={v => { const u = [...workoutDays]; u[dayIdx].grupo = v; setWorkoutDays(u); }}>
                        <SelectTrigger className="bg-secondary/50 border-border/50 h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {muscleGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="space-y-2">
                    {day.exercicios.map((ex, exIdx) => (
                      <div key={exIdx} className="rounded-xl border border-border/20 p-3 bg-secondary/20 space-y-2.5">
                        {/* Exercise header row */}
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-primary">{exIdx + 1}</span>
                          </div>
                          <Input
                            value={ex.nome}
                            onChange={e => updateExercise(dayIdx, exIdx, "nome", e.target.value)}
                            placeholder="Nome do exercício"
                            className="bg-secondary/40 border-border/30 h-9 text-xs flex-1"
                          />
                        </div>

                        {/* Config grid */}
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-[9px] text-muted-foreground mb-0.5 block">Séries</Label>
                            <Input value={ex.series} onChange={e => updateExercise(dayIdx, exIdx, "series", e.target.value)} className="bg-secondary/40 border-border/30 h-8 text-xs text-center" />
                          </div>
                          <div>
                            <Label className="text-[9px] text-muted-foreground mb-0.5 block">Reps</Label>
                            <Input value={ex.reps} onChange={e => updateExercise(dayIdx, exIdx, "reps", e.target.value)} className="bg-secondary/40 border-border/30 h-8 text-xs text-center" />
                          </div>
                          <div>
                            <Label className="text-[9px] text-muted-foreground mb-0.5 block">Descanso</Label>
                            <Input value={ex.descanso} onChange={e => updateExercise(dayIdx, exIdx, "descanso", e.target.value)} className="bg-secondary/40 border-border/30 h-8 text-xs text-center" />
                          </div>
                          <div>
                            <Label className="text-[9px] text-muted-foreground mb-0.5 block">Carga</Label>
                            <Input value={ex.carga} onChange={e => updateExercise(dayIdx, exIdx, "carga", e.target.value)} placeholder="kg" className="bg-secondary/40 border-border/30 h-8 text-xs text-center" />
                          </div>
                        </div>

                        {/* Obs */}
                        <Input
                          value={ex.obs}
                          onChange={e => updateExercise(dayIdx, exIdx, "obs", e.target.value)}
                          placeholder="Observação do exercício (opcional)"
                          className="bg-secondary/40 border-border/30 h-8 text-[10px]"
                        />

                        {/* Actions row */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/10">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveExercise(dayIdx, exIdx, "up")}
                              disabled={exIdx === 0}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveExercise(dayIdx, exIdx, "down")}
                              disabled={exIdx === day.exercicios.length - 1}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditExercise(dayIdx, exIdx)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {day.exercicios.length > 1 && (
                            <button
                              onClick={() => removeExercise(dayIdx, exIdx)}
                              className="w-7 h-7 rounded-md flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => addExercise(dayIdx)} className="w-full text-xs text-primary hover:text-primary/80 hover:bg-primary/5 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Adicionar exercício
                  </Button>
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addDay} className="w-full text-xs gap-1.5 border-dashed">
            <Plus className="w-3.5 h-3.5" /> Adicionar dia
          </Button>
        </div>

        {/* Floating save button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-40">
          <Button
            onClick={handleSaveWorkout}
            disabled={saving}
            className="w-full h-14 text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-2xl shadow-primary/30 gap-2 rounded-2xl"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Treino ({totalExercises} exercício{totalExercises !== 1 ? "s" : ""})
          </Button>
        </div>

        {/* Edit exercise dialog */}
        <Dialog open={!!editingExercise} onOpenChange={(o) => { if (!o) setEditingExercise(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Editar Exercício</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Nome</Label>
                <Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} className="bg-secondary/50 border-border/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Séries</Label>
                  <Input value={editForm.series} onChange={e => setEditForm({ ...editForm, series: e.target.value })} className="bg-secondary/50 border-border/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Repetições</Label>
                  <Input value={editForm.reps} onChange={e => setEditForm({ ...editForm, reps: e.target.value })} className="bg-secondary/50 border-border/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Descanso</Label>
                  <Input value={editForm.descanso} onChange={e => setEditForm({ ...editForm, descanso: e.target.value })} className="bg-secondary/50 border-border/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Carga sugerida</Label>
                  <Input value={editForm.carga} onChange={e => setEditForm({ ...editForm, carga: e.target.value })} placeholder="Ex: 20kg" className="bg-secondary/50 border-border/50" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Observação</Label>
                <Textarea value={editForm.obs} onChange={e => setEditForm({ ...editForm, obs: e.target.value })} placeholder="Dicas, técnica, atenção..." className="bg-secondary/50 border-border/50 min-h-[60px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingExercise(null)}>Cancelar</Button>
              <Button onClick={saveEditExercise} className="gap-1.5"><Save className="w-4 h-4" /> Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ VIEW: STUDENT DETAIL ============
  if (view === "student-detail" && selectedStudent) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(null); setView("list"); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-display font-bold truncate">{selectedStudent.student_name}</h1>
            {selectedStudent.student_email && <p className="text-xs text-muted-foreground">{selectedStudent.student_email}</p>}
          </div>
          <button
            onClick={() => { setDeletingId(selectedStudent.id); setDeleteType("student"); setDeleteDialogOpen(true); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {selectedStudent.notes && (
          <div className="rounded-xl border border-border/30 bg-secondary/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Observações</p>
            <p className="text-xs text-foreground">{selectedStudent.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { resetWorkoutForm(); setView("create-workout"); }}
            className="group rounded-2xl p-5 text-left border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/8 to-primary/3 hover:from-primary/12 hover:to-primary/6 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-sm">Criar Treino</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">100% manual</p>
          </button>

          <button
            onClick={() => toast.info("Em breve! Acompanhe o progresso dos alunos.")}
            className="group rounded-2xl p-5 text-left border-2 border-border/30 hover:border-border/60 bg-gradient-to-br from-secondary/60 to-secondary/30 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-foreground/60" />
            </div>
            <h3 className="font-display font-bold text-sm">Progresso</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Em breve</p>
          </button>
        </div>

        {/* Plans */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Treinos criados</h3>
          {loadingPlans ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : studentPlans.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Nenhum treino criado ainda.</div>
          ) : (
            <div className="space-y-2">
              {studentPlans.map(plan => {
                const days = (plan.plan_data || []) as ManualDay[];
                const totalEx = days.reduce((acc, d) => acc + d.exercicios.length, 0);
                return (
                  <div key={plan.id} className="flex items-center gap-3 rounded-xl border border-border/30 p-3 bg-secondary/20 hover:bg-secondary/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{plan.title}</p>
                      <p className="text-[10px] text-muted-foreground">{days.length} dia(s) • {totalEx} exercício(s)</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setViewingPlan(plan); setView("view-workout"); }} className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setDeletingId(plan.id); setDeleteType("plan"); setDeleteDialogOpen(true); }} className="w-9 h-9 rounded-lg flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {deleteType === "student" ? "Remover este aluno e todos os treinos associados?" : "Remover este treino?"}
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ VIEW: ADD STUDENT ============
  if (view === "add-student") {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView("list")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-display font-bold">Adicionar Aluno</h1>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome do aluno *</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome completo" className="bg-secondary/50 border-border/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Email (opcional)</Label>
            <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@exemplo.com" className="bg-secondary/50 border-border/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observações (opcional)</Label>
            <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Lesões, preferências, etc." className="bg-secondary/50 border-border/50 min-h-[80px]" />
          </div>
        </div>

        <Button onClick={handleAddStudent} disabled={saving || !newName.trim()} className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/20 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Adicionar Aluno
        </Button>
      </div>
    );
  }

  // ============ VIEW: STUDENT LIST ============
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Modo Personal</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus alunos e treinos</p>
        </div>
        <Button onClick={() => setView("add-student")} size="sm" className="gap-1.5 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Aluno
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/30 p-4" style={{ background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))" }}>
          <Users className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-display font-black">{students.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Alunos</p>
        </div>
        <div className="rounded-2xl border border-border/30 p-4" style={{ background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--card) / 0.6))" }}>
          <Dumbbell className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-display font-black">—</p>
          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Treinos</p>
        </div>
      </div>

      {students.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar aluno..." className="pl-9 bg-secondary/50 border-border/50" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4 border border-border/30">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-lg mb-1">Nenhum aluno</h3>
          <p className="text-sm text-muted-foreground mb-4">Comece adicionando seu primeiro aluno</p>
          <Button onClick={() => setView("add-student")} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Adicionar Aluno
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map(student => (
            <button
              key={student.id}
              onClick={() => { setSelectedStudent(student); loadStudentPlans(student.id); setView("student-detail"); }}
              className="w-full flex items-center gap-3 rounded-xl border border-border/30 p-4 bg-secondary/20 hover:bg-secondary/40 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                <span className="text-sm font-bold text-primary">{student.student_name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{student.student_name}</p>
                {student.student_email && <p className="text-[10px] text-muted-foreground truncate">{student.student_email}</p>}
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Remover este aluno e todos os treinos associados?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Personal;
