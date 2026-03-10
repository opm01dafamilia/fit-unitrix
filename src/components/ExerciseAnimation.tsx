import { useState, useEffect, useMemo } from "react";
import type { ExerciseDetail } from "@/lib/exerciseLibrary";

interface ExerciseAnimationProps {
  exercise: ExerciseDetail;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Anatomical body parts as SVG paths for a human figure
// Each pose is an object with body segments that can be repositioned per frame
type BodyPose = {
  head: { cx: number; cy: number };
  neck: { x1: number; y1: number; x2: number; y2: number };
  torso: string; // path d
  upperArmL: string;
  upperArmR: string;
  forearmL: string;
  forearmR: string;
  handL?: { cx: number; cy: number };
  handR?: { cx: number; cy: number };
  upperLegL: string;
  upperLegR: string;
  lowerLegL: string;
  lowerLegR: string;
  equipment?: string; // optional equipment path (barbell, dumbbell, etc.)
  equipmentStroke?: string;
};

type ExercisePoseSet = {
  poses: BodyPose[];
  activeMuscles: string[]; // muscle region IDs to highlight
  label: string;
};

// Muscle region SVG paths (overlaid on the anatomical figure)
const muscleRegions: Record<string, { d: string; label: string }> = {
  chest: {
    d: "M42,32 Q50,29 58,32 Q60,36 58,40 Q50,42 42,40 Q40,36 42,32",
    label: "Peitoral",
  },
  "upper-chest": {
    d: "M44,28 Q50,26 56,28 Q57,31 55,33 Q50,34 45,33 Q43,31 44,28",
    label: "Peitoral Superior",
  },
  "front-delt": {
    d: "M36,26 Q38,23 40,25 Q42,30 40,33 Q37,32 35,29 Z M60,25 Q62,23 64,26 Q65,29 63,32 Q60,33 58,30 Z",
    label: "Deltóide Anterior",
  },
  "side-delt": {
    d: "M34,25 Q36,22 38,24 Q38,29 36,31 Q33,30 33,27 Z M62,24 Q64,22 66,25 Q67,27 66,30 Q63,31 62,29 Z",
    label: "Deltóide Lateral",
  },
  biceps: {
    d: "M34,34 Q37,32 38,36 Q38,42 36,44 Q33,43 32,38 Z M62,36 Q63,32 66,34 Q68,38 67,43 Q64,44 62,42 Z",
    label: "Bíceps",
  },
  triceps: {
    d: "M32,34 Q34,32 35,35 Q35,42 33,44 Q31,42 30,38 Z M65,35 Q66,32 68,34 Q70,38 69,42 Q67,44 65,42 Z",
    label: "Tríceps",
  },
  lats: {
    d: "M40,34 Q44,32 44,40 Q42,46 38,44 Q36,40 38,36 Z M56,34 Q60,32 62,36 Q64,40 62,44 Q58,46 56,40 Z",
    label: "Dorsal",
  },
  abs: {
    d: "M45,42 Q50,41 55,42 Q56,48 55,54 Q50,55 45,54 Q44,48 45,42",
    label: "Abdômen",
  },
  quads: {
    d: "M42,58 Q46,56 48,60 Q48,72 46,76 Q42,74 40,68 Z M52,60 Q54,56 58,58 Q60,68 58,74 Q54,76 52,72 Z",
    label: "Quadríceps",
  },
  hamstrings: {
    d: "M42,60 Q45,58 47,62 Q47,72 45,76 Q42,74 40,68 Z M53,62 Q55,58 58,60 Q60,68 58,74 Q55,76 53,72 Z",
    label: "Isquiotibiais",
  },
  glutes: {
    d: "M42,54 Q50,52 58,54 Q60,58 58,60 Q50,62 42,60 Q40,58 42,54",
    label: "Glúteos",
  },
  calves: {
    d: "M42,78 Q44,76 46,80 Q46,86 44,88 Q42,86 41,82 Z M54,80 Q56,76 58,78 Q59,82 58,86 Q56,88 54,86 Z",
    label: "Panturrilha",
  },
  traps: {
    d: "M42,22 Q50,18 58,22 Q56,26 50,27 Q44,26 42,22",
    label: "Trapézio",
  },
  forearms: {
    d: "M30,44 Q33,42 34,46 Q34,50 32,52 Q30,50 29,47 Z M66,46 Q67,42 70,44 Q71,47 70,50 Q68,52 66,50 Z",
    label: "Antebraço",
  },
};

// Maps exercise IDs / keywords to muscle highlights
const exerciseMuscleMap: Record<string, string[]> = {
  "supino": ["chest", "triceps", "front-delt"],
  "supino-inclinado": ["upper-chest", "triceps", "front-delt"],
  "crucifixo": ["chest", "front-delt"],
  "desenvolvimento": ["front-delt", "side-delt", "triceps"],
  "elevacao-lateral": ["side-delt"],
  "agachamento": ["quads", "glutes", "hamstrings"],
  "leg-press": ["quads", "glutes"],
  "cadeira-extensora": ["quads"],
  "mesa-flexora": ["hamstrings"],
  "stiff": ["hamstrings", "glutes", "lats"],
  "panturrilha": ["calves"],
  "rosca": ["biceps", "forearms"],
  "martelo": ["biceps", "forearms"],
  "triceps": ["triceps"],
  "mergulho": ["triceps", "chest"],
  "frances": ["triceps"],
  "puxada": ["lats", "biceps"],
  "remada": ["lats", "biceps", "traps"],
  "pulldown": ["lats", "biceps"],
  "abdominal": ["abs"],
  "prancha": ["abs"],
  "bicicleta": ["quads", "hamstrings", "calves"],
  "esteira": ["quads", "hamstrings", "calves", "glutes"],
  "corrida": ["quads", "hamstrings", "calves", "glutes"],
  "alongamento": ["chest", "triceps", "side-delt"],
  "mobilidade": ["front-delt", "side-delt"],
  "flexao": ["chest", "triceps", "front-delt"],
  "terra": ["hamstrings", "glutes", "lats", "traps", "forearms"],
  "passada": ["quads", "glutes", "hamstrings"],
  "hack": ["quads", "glutes"],
  "bulgaro": ["quads", "glutes"],
  "elevacao-pelvica": ["glutes", "hamstrings"],
};

// Predefined exercise poses for each movement pattern
const exercisePoses: Record<string, BodyPose[]> = {
  // BENCH PRESS - lying down, pressing up
  "supino": [
    {
      head: { cx: 20, cy: 42 },
      neck: { x1: 23, y1: 42, x2: 28, y2: 42 },
      torso: "M28,42 L68,42",
      upperArmL: "M38,42 L38,32",
      upperArmR: "M38,42 L38,52",
      forearmL: "M38,32 L48,28",
      forearmR: "M38,52 L48,56",
      upperLegL: "M68,42 L78,52",
      upperLegR: "M68,42 L78,52",
      lowerLegL: "M78,52 L78,62",
      lowerLegR: "M78,52 L78,62",
      handL: { cx: 48, cy: 28 },
      handR: { cx: 48, cy: 56 },
      equipment: "M46,24 L46,60",
      equipmentStroke: "hsl(var(--muted-foreground))",
    },
    {
      head: { cx: 20, cy: 42 },
      neck: { x1: 23, y1: 42, x2: 28, y2: 42 },
      torso: "M28,42 L68,42",
      upperArmL: "M38,42 L38,34",
      upperArmR: "M38,42 L38,50",
      forearmL: "M38,34 L42,22",
      forearmR: "M38,50 L42,62",
      upperLegL: "M68,42 L78,52",
      upperLegR: "M68,42 L78,52",
      lowerLegL: "M78,52 L78,62",
      lowerLegR: "M78,52 L78,62",
      handL: { cx: 42, cy: 22 },
      handR: { cx: 42, cy: 62 },
      equipment: "M40,18 L40,66",
      equipmentStroke: "hsl(var(--muted-foreground))",
    },
  ],

  // STANDING PRESS (desenvolvimento)
  "desenvolvimento": [
    {
      head: { cx: 50, cy: 14 },
      neck: { x1: 50, y1: 17, x2: 50, y2: 22 },
      torso: "M50,22 L50,50",
      upperArmL: "M50,26 L38,32",
      upperArmR: "M50,26 L62,32",
      forearmL: "M38,32 L36,22",
      forearmR: "M62,32 L64,22",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
      handL: { cx: 36, cy: 22 },
      handR: { cx: 64, cy: 22 },
      equipment: "M32,22 L68,22",
    },
    {
      head: { cx: 50, cy: 14 },
      neck: { x1: 50, y1: 17, x2: 50, y2: 22 },
      torso: "M50,22 L50,50",
      upperArmL: "M50,26 L38,28",
      upperArmR: "M50,26 L62,28",
      forearmL: "M38,28 L34,14",
      forearmR: "M62,28 L66,14",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
      handL: { cx: 34, cy: 14 },
      handR: { cx: 66, cy: 14 },
      equipment: "M30,14 L70,14",
    },
  ],

  // SQUAT
  "agachamento": [
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,48",
      upperArmL: "M50,24 L40,34",
      upperArmR: "M50,24 L60,34",
      forearmL: "M40,34 L42,44",
      forearmR: "M60,34 L58,44",
      upperLegL: "M50,48 L42,66",
      upperLegR: "M50,48 L58,66",
      lowerLegL: "M42,66 L40,88",
      lowerLegR: "M58,66 L60,88",
    },
    {
      head: { cx: 50, cy: 28 },
      neck: { x1: 50, y1: 31, x2: 50, y2: 36 },
      torso: "M50,36 L50,56",
      upperArmL: "M50,40 L40,48",
      upperArmR: "M50,40 L60,48",
      forearmL: "M40,48 L42,56",
      forearmR: "M60,48 L58,56",
      upperLegL: "M50,56 L36,68",
      upperLegR: "M50,56 L64,68",
      lowerLegL: "M36,68 L38,88",
      lowerLegR: "M64,68 L62,88",
    },
  ],

  // BICEPS CURL
  "rosca": [
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L42,40",
      upperArmR: "M50,24 L58,40",
      forearmL: "M42,40 L40,54",
      forearmR: "M58,40 L60,54",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
      handL: { cx: 40, cy: 54 },
      handR: { cx: 60, cy: 54 },
      equipment: "M36,54 L64,54",
    },
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L42,40",
      upperArmR: "M50,24 L58,40",
      forearmL: "M42,40 L44,28",
      forearmR: "M58,40 L56,28",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
      handL: { cx: 44, cy: 28 },
      handR: { cx: 56, cy: 28 },
      equipment: "M40,28 L60,28",
    },
  ],

  // ROWING (remada)
  "remada": [
    {
      head: { cx: 50, cy: 18 },
      neck: { x1: 50, y1: 21, x2: 50, y2: 26 },
      torso: "M50,26 L50,52",
      upperArmL: "M50,30 L40,42",
      upperArmR: "M50,30 L60,42",
      forearmL: "M40,42 L36,54",
      forearmR: "M60,42 L64,54",
      upperLegL: "M50,52 L44,70",
      upperLegR: "M50,52 L56,70",
      lowerLegL: "M44,70 L42,88",
      lowerLegR: "M56,70 L58,88",
      handL: { cx: 36, cy: 54 },
      handR: { cx: 64, cy: 54 },
    },
    {
      head: { cx: 50, cy: 18 },
      neck: { x1: 50, y1: 21, x2: 50, y2: 26 },
      torso: "M50,26 L50,52",
      upperArmL: "M50,30 L38,34",
      upperArmR: "M50,30 L62,34",
      forearmL: "M38,34 L38,44",
      forearmR: "M62,34 L62,44",
      upperLegL: "M50,52 L44,70",
      upperLegR: "M50,52 L56,70",
      lowerLegL: "M44,70 L42,88",
      lowerLegR: "M56,70 L58,88",
      handL: { cx: 38, cy: 44 },
      handR: { cx: 62, cy: 44 },
    },
  ],

  // RUNNING / CARDIO
  "cardio": [
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,48",
      upperArmL: "M50,24 L40,34",
      upperArmR: "M50,24 L58,30",
      forearmL: "M40,34 L44,26",
      forearmR: "M58,30 L54,38",
      upperLegL: "M50,48 L38,62",
      upperLegR: "M50,48 L60,64",
      lowerLegL: "M38,62 L36,80",
      lowerLegR: "M60,64 L62,82",
    },
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,48",
      upperArmL: "M50,24 L58,30",
      upperArmR: "M50,24 L40,34",
      forearmL: "M58,30 L54,38",
      forearmR: "M40,34 L44,26",
      upperLegL: "M50,48 L60,64",
      upperLegR: "M50,48 L38,62",
      lowerLegL: "M60,64 L62,82",
      lowerLegR: "M38,62 L36,80",
    },
  ],

  // STRETCHING
  "alongamento": [
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L34,20",
      upperArmR: "M50,24 L66,20",
      forearmL: "M34,20 L28,28",
      forearmR: "M66,20 L72,28",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
    },
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L32,16",
      upperArmR: "M50,24 L68,16",
      forearmL: "M32,16 L24,20",
      forearmR: "M68,16 L76,20",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
    },
  ],

  // TRICEPS EXTENSION
  "triceps": [
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L46,14",
      upperArmR: "M50,24 L54,14",
      forearmL: "M46,14 L40,26",
      forearmR: "M54,14 L60,26",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
      handL: { cx: 40, cy: 26 },
      handR: { cx: 60, cy: 26 },
    },
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L46,14",
      upperArmR: "M50,24 L54,14",
      forearmL: "M46,14 L42,6",
      forearmR: "M54,14 L58,6",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
      handL: { cx: 42, cy: 6 },
      handR: { cx: 58, cy: 6 },
    },
  ],

  // PULLDOWN / LAT PULLDOWN
  "puxada": [
    {
      head: { cx: 50, cy: 18 },
      neck: { x1: 50, y1: 21, x2: 50, y2: 26 },
      torso: "M50,26 L50,54",
      upperArmL: "M50,28 L34,16",
      upperArmR: "M50,28 L66,16",
      forearmL: "M34,16 L30,8",
      forearmR: "M66,16 L70,8",
      upperLegL: "M50,54 L44,70",
      upperLegR: "M50,54 L56,70",
      lowerLegL: "M44,70 L42,86",
      lowerLegR: "M56,70 L58,86",
      handL: { cx: 30, cy: 8 },
      handR: { cx: 70, cy: 8 },
      equipment: "M26,6 L74,6",
    },
    {
      head: { cx: 50, cy: 18 },
      neck: { x1: 50, y1: 21, x2: 50, y2: 26 },
      torso: "M50,26 L50,54",
      upperArmL: "M50,28 L38,30",
      upperArmR: "M50,28 L62,30",
      forearmL: "M38,30 L36,20",
      forearmR: "M62,30 L64,20",
      upperLegL: "M50,54 L44,70",
      upperLegR: "M50,54 L56,70",
      lowerLegL: "M44,70 L42,86",
      lowerLegR: "M56,70 L58,86",
      handL: { cx: 36, cy: 20 },
      handR: { cx: 64, cy: 20 },
      equipment: "M32,18 L68,18",
    },
  ],

  // DEADLIFT / STIFF
  "stiff": [
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,48",
      upperArmL: "M50,24 L42,38",
      upperArmR: "M50,24 L58,38",
      forearmL: "M42,38 L40,50",
      forearmR: "M58,38 L60,50",
      upperLegL: "M50,48 L44,66",
      upperLegR: "M50,48 L56,66",
      lowerLegL: "M44,66 L42,86",
      lowerLegR: "M56,66 L58,86",
      handL: { cx: 40, cy: 50 },
      handR: { cx: 60, cy: 50 },
      equipment: "M36,50 L64,50",
    },
    {
      head: { cx: 50, cy: 32 },
      neck: { x1: 50, y1: 35, x2: 50, y2: 38 },
      torso: "M50,38 L50,54",
      upperArmL: "M50,40 L44,54",
      upperArmR: "M50,40 L56,54",
      forearmL: "M44,54 L42,66",
      forearmR: "M56,54 L58,66",
      upperLegL: "M50,54 L42,68",
      upperLegR: "M50,54 L58,68",
      lowerLegL: "M42,68 L42,86",
      lowerLegR: "M58,68 L58,86",
      handL: { cx: 42, cy: 66 },
      handR: { cx: 58, cy: 66 },
      equipment: "M38,66 L62,66",
    },
  ],

  // LEG EXTENSION
  "extensora": [
    {
      head: { cx: 50, cy: 18 },
      neck: { x1: 50, y1: 21, x2: 50, y2: 26 },
      torso: "M50,26 L50,54",
      upperArmL: "M50,30 L40,40",
      upperArmR: "M50,30 L60,40",
      forearmL: "M40,40 L38,48",
      forearmR: "M60,40 L62,48",
      upperLegL: "M50,54 L44,70",
      upperLegR: "M50,54 L56,70",
      lowerLegL: "M44,70 L42,86",
      lowerLegR: "M56,70 L58,86",
    },
    {
      head: { cx: 50, cy: 18 },
      neck: { x1: 50, y1: 21, x2: 50, y2: 26 },
      torso: "M50,26 L50,54",
      upperArmL: "M50,30 L40,40",
      upperArmR: "M50,30 L60,40",
      forearmL: "M40,40 L38,48",
      forearmR: "M60,40 L62,48",
      upperLegL: "M50,54 L44,70",
      upperLegR: "M50,54 L56,70",
      lowerLegL: "M44,70 L50,78",
      lowerLegR: "M56,70 L62,78",
    },
  ],

  // LATERAL RAISE
  "elevacao-lateral": [
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L42,38",
      upperArmR: "M50,24 L58,38",
      forearmL: "M42,38 L40,50",
      forearmR: "M58,38 L60,50",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
      handL: { cx: 40, cy: 50 },
      handR: { cx: 60, cy: 50 },
    },
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L30,22",
      upperArmR: "M50,24 L70,22",
      forearmL: "M30,22 L22,30",
      forearmR: "M70,22 L78,30",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
      handL: { cx: 22, cy: 30 },
      handR: { cx: 78, cy: 30 },
    },
  ],

  // PLANK
  "prancha": [
    {
      head: { cx: 20, cy: 38 },
      neck: { x1: 23, y1: 38, x2: 28, y2: 40 },
      torso: "M28,40 L70,42",
      upperArmL: "M28,40 L26,50",
      upperArmR: "M28,40 L26,50",
      forearmL: "M26,50 L34,54",
      forearmR: "M26,50 L34,54",
      upperLegL: "M70,42 L82,44",
      upperLegR: "M70,42 L82,44",
      lowerLegL: "M82,44 L90,46",
      lowerLegR: "M82,44 L90,46",
    },
    {
      head: { cx: 20, cy: 36 },
      neck: { x1: 23, y1: 36, x2: 28, y2: 38 },
      torso: "M28,38 L70,40",
      upperArmL: "M28,38 L26,48",
      upperArmR: "M28,38 L26,48",
      forearmL: "M26,48 L34,52",
      forearmR: "M26,48 L34,52",
      upperLegL: "M70,40 L82,42",
      upperLegR: "M70,40 L82,42",
      lowerLegL: "M82,42 L90,44",
      lowerLegR: "M82,42 L90,44",
    },
  ],

  // DEFAULT standing
  "default": [
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L40,36",
      upperArmR: "M50,24 L60,36",
      forearmL: "M40,36 L38,48",
      forearmR: "M60,36 L62,48",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
    },
    {
      head: { cx: 50, cy: 12 },
      neck: { x1: 50, y1: 15, x2: 50, y2: 20 },
      torso: "M50,20 L50,50",
      upperArmL: "M50,24 L42,38",
      upperArmR: "M50,24 L58,38",
      forearmL: "M42,38 L40,50",
      forearmR: "M58,38 L60,50",
      upperLegL: "M50,50 L44,68",
      upperLegR: "M50,50 L56,68",
      lowerLegL: "M44,68 L42,88",
      lowerLegR: "M56,68 L58,88",
    },
  ],
};

function getExercisePoses(exerciseId: string): BodyPose[] {
  for (const key of Object.keys(exercisePoses)) {
    if (key !== "default" && exerciseId.toLowerCase().includes(key)) {
      return exercisePoses[key];
    }
  }
  return exercisePoses["default"];
}

function getActiveMuscles(exerciseId: string): string[] {
  for (const key of Object.keys(exerciseMuscleMap)) {
    if (exerciseId.toLowerCase().includes(key)) {
      return exerciseMuscleMap[key];
    }
  }
  return [];
}

const sizeMap = {
  sm: { container: "w-24 h-24", viewBox: "0 0 100 96" },
  md: { container: "w-40 h-40", viewBox: "0 0 100 96" },
  lg: { container: "w-56 h-56", viewBox: "0 0 100 96" },
};

const ExerciseAnimation = ({ exercise, className = "", size = "md" }: ExerciseAnimationProps) => {
  const [frame, setFrame] = useState(0);
  const poses = useMemo(() => getExercisePoses(exercise.id), [exercise.id]);
  const activeMuscles = useMemo(() => getActiveMuscles(exercise.id), [exercise.id]);
  const sizes = sizeMap[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % poses.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [poses.length]);

  const currentPose = poses[frame % poses.length];

  const bodyColor = "hsl(var(--foreground) / 0.7)";
  const jointColor = "hsl(var(--foreground) / 0.5)";
  const muscleHighlight = "hsl(0 72% 55%)"; // red for active muscles
  const muscleGlow = "hsl(0 72% 55% / 0.25)";

  return (
    <div
      className={`relative ${sizes.container} rounded-2xl flex items-center justify-center overflow-hidden bg-secondary/50 border border-border/50 ${className}`}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "10px 10px",
        }}
      />

      <svg viewBox={sizes.viewBox} className="absolute inset-0 w-full h-full p-2">
        {/* Muscle highlights (rendered behind the skeleton) */}
        {activeMuscles.map((muscleId) => {
          const region = muscleRegions[muscleId];
          if (!region) return null;
          return (
            <g key={muscleId}>
              {/* Glow */}
              <path
                d={region.d}
                fill={muscleGlow}
                stroke="none"
                className="transition-all duration-700"
                filter="url(#muscleBlur)"
              />
              {/* Solid */}
              <path
                d={region.d}
                fill={muscleHighlight}
                opacity={0.45}
                stroke={muscleHighlight}
                strokeWidth="0.3"
                className="transition-all duration-700"
              >
                <title>{region.label}</title>
              </path>
            </g>
          );
        })}

        {/* Anatomical skeleton figure */}
        <g className="transition-all duration-700 ease-in-out">
          {/* Torso */}
          <path d={currentPose.torso} stroke={bodyColor} strokeWidth="3" strokeLinecap="round" fill="none" />
          
          {/* Shoulder width indicator */}
          <line x1={currentPose.torso.match(/M([\d.]+),([\d.]+)/)?.[1] || "50"} 
                y1={currentPose.torso.match(/M([\d.]+),([\d.]+)/)?.[2] || "20"} 
                x2={currentPose.torso.match(/M([\d.]+),([\d.]+)/)?.[1] || "50"} 
                y2={currentPose.torso.match(/M([\d.]+),([\d.]+)/)?.[2] || "20"}
                stroke="none" />

          {/* Neck */}
          <line x1={currentPose.neck.x1} y1={currentPose.neck.y1} x2={currentPose.neck.x2} y2={currentPose.neck.y2}
            stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Head */}
          <circle cx={currentPose.head.cx} cy={currentPose.head.cy} r="5"
            stroke={bodyColor} strokeWidth="1.8" fill="hsl(var(--secondary))" />

          {/* Upper Arms */}
          <path d={currentPose.upperArmL} stroke={bodyColor} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d={currentPose.upperArmR} stroke={bodyColor} strokeWidth="2.8" strokeLinecap="round" fill="none" />

          {/* Forearms */}
          <path d={currentPose.forearmL} stroke={bodyColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d={currentPose.forearmR} stroke={bodyColor} strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Hands */}
          {currentPose.handL && (
            <circle cx={currentPose.handL.cx} cy={currentPose.handL.cy} r="1.8"
              fill={bodyColor} />
          )}
          {currentPose.handR && (
            <circle cx={currentPose.handR.cx} cy={currentPose.handR.cy} r="1.8"
              fill={bodyColor} />
          )}

          {/* Upper Legs */}
          <path d={currentPose.upperLegL} stroke={bodyColor} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={currentPose.upperLegR} stroke={bodyColor} strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* Lower Legs */}
          <path d={currentPose.lowerLegL} stroke={bodyColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d={currentPose.lowerLegR} stroke={bodyColor} strokeWidth="2.4" strokeLinecap="round" fill="none" />

          {/* Joints */}
          {/* Shoulders */}
          <circle cx={Number(currentPose.upperArmL.match(/M([\d.]+)/)?.[1] || 50)} 
                  cy={Number(currentPose.upperArmL.match(/M[\d.]+,([\d.]+)/)?.[1] || 24)} 
                  r="1.5" fill={jointColor} />
          <circle cx={Number(currentPose.upperArmR.match(/M([\d.]+)/)?.[1] || 50)} 
                  cy={Number(currentPose.upperArmR.match(/M[\d.]+,([\d.]+)/)?.[1] || 24)} 
                  r="1.5" fill={jointColor} />

          {/* Equipment */}
          {currentPose.equipment && (
            <path d={currentPose.equipment}
              stroke={currentPose.equipmentStroke || "hsl(var(--muted-foreground))"}
              strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
          )}
        </g>

        {/* Filter for muscle glow */}
        <defs>
          <filter id="muscleBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
      </svg>

      {/* Active muscle indicator dots */}
      {activeMuscles.length > 0 && (
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          {activeMuscles.slice(0, 4).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                backgroundColor: muscleHighlight,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Bottom label */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-medium whitespace-nowrap bg-secondary/80 text-muted-foreground border border-border/50">
        {exercise.tipoExercicio === "musculação" && "Execução"}
        {exercise.tipoExercicio === "cardio" && "Movimento"}
        {exercise.tipoExercicio === "alongamento" && "Posição"}
        {exercise.tipoExercicio === "mobilidade" && "Mobilidade"}
      </div>
    </div>
  );
};

export default ExerciseAnimation;
