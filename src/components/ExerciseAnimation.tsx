import { useState, useEffect, useMemo } from "react";
import type { ExerciseDetail } from "@/lib/exerciseLibrary";

interface ExerciseAnimationProps {
  exercise: ExerciseDetail;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Anatomical muscle region paths for the human figure
const anatomicalMuscles: Record<string, { paths: string[]; label: string }> = {
  chest: {
    paths: [
      // Left pec
      "M43,33 Q46,30 50,32 L50,40 Q47,42 43,40 Q40,38 41,35 Z",
      // Right pec
      "M57,33 Q54,30 50,32 L50,40 Q53,42 57,40 Q60,38 59,35 Z",
    ],
    label: "Peitoral",
  },
  "upper-chest": {
    paths: [
      "M44,29 Q47,27 50,28 L50,33 Q47,34 44,33 Q42,31 44,29 Z",
      "M56,29 Q53,27 50,28 L50,33 Q53,34 56,33 Q58,31 56,29 Z",
    ],
    label: "Peitoral Superior",
  },
  "front-delt": {
    paths: [
      "M38,26 Q40,24 43,26 Q44,30 42,33 Q39,32 37,29 Z",
      "M62,26 Q60,24 57,26 Q56,30 58,33 Q61,32 63,29 Z",
    ],
    label: "Deltóide Anterior",
  },
  "side-delt": {
    paths: [
      "M36,25 Q38,22 40,24 Q41,28 39,31 Q36,30 35,27 Z",
      "M64,25 Q62,22 60,24 Q59,28 61,31 Q64,30 65,27 Z",
    ],
    label: "Deltóide Lateral",
  },
  biceps: {
    paths: [
      "M36,34 Q39,32 40,35 Q41,40 39,44 Q36,43 35,39 Z",
      "M64,34 Q61,32 60,35 Q59,40 61,44 Q64,43 65,39 Z",
    ],
    label: "Bíceps",
  },
  triceps: {
    paths: [
      "M34,34 Q36,32 37,35 Q37,41 35,44 Q33,42 32,38 Z",
      "M66,34 Q64,32 63,35 Q63,41 65,44 Q67,42 68,38 Z",
    ],
    label: "Tríceps",
  },
  lats: {
    paths: [
      "M42,35 Q45,33 46,38 Q45,46 41,48 Q38,44 39,38 Z",
      "M58,35 Q55,33 54,38 Q55,46 59,48 Q62,44 61,38 Z",
    ],
    label: "Dorsal",
  },
  traps: {
    paths: [
      "M44,22 Q47,20 50,21 Q53,20 56,22 Q54,26 50,27 Q46,26 44,22 Z",
    ],
    label: "Trapézio",
  },
  abs: {
    paths: [
      // Six pack blocks
      "M47,42 L50,42 L50,46 L47,46 Z",
      "M50,42 L53,42 L53,46 L50,46 Z",
      "M47,46 L50,46 L50,50 L47,50 Z",
      "M50,46 L53,46 L53,50 L50,50 Z",
      "M47,50 L50,50 L50,54 L47,54 Z",
      "M50,50 L53,50 L53,54 L50,54 Z",
    ],
    label: "Abdômen",
  },
  quads: {
    paths: [
      "M43,58 Q47,56 49,60 Q49,70 47,76 Q43,74 41,68 Z",
      "M57,58 Q53,56 51,60 Q51,70 53,76 Q57,74 59,68 Z",
    ],
    label: "Quadríceps",
  },
  hamstrings: {
    paths: [
      "M43,60 Q46,58 48,62 Q48,72 46,76 Q43,74 41,68 Z",
      "M57,60 Q54,58 52,62 Q52,72 54,76 Q57,74 59,68 Z",
    ],
    label: "Isquiotibiais",
  },
  glutes: {
    paths: [
      "M43,54 Q47,52 50,53 Q53,52 57,54 Q59,58 57,60 Q53,62 50,62 Q47,62 43,60 Q41,58 43,54 Z",
    ],
    label: "Glúteos",
  },
  calves: {
    paths: [
      "M43,78 Q45,76 47,80 Q47,86 45,89 Q43,87 42,83 Z",
      "M57,78 Q55,76 53,80 Q53,86 55,89 Q57,87 58,83 Z",
    ],
    label: "Panturrilha",
  },
  forearms: {
    paths: [
      "M32,44 Q35,42 36,46 Q35,52 33,54 Q31,52 30,48 Z",
      "M68,44 Q65,42 64,46 Q65,52 67,54 Q69,52 70,48 Z",
    ],
    label: "Antebraço",
  },
};

// Muscle ID map for exercise keywords
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

// Body shape transforms for different exercise positions
type PoseTransform = {
  // Overall body position
  bodyRotation?: number;
  bodyTranslateX?: number;
  bodyTranslateY?: number;
  // Joint angles
  shoulderAngleL?: number;
  shoulderAngleR?: number;
  elbowAngleL?: number;
  elbowAngleR?: number;
  hipAngleL?: number;
  hipAngleR?: number;
  kneeAngleL?: number;
  kneeAngleR?: number;
  // Equipment
  equipment?: "barbell" | "dumbbell" | "cable" | "machine" | "bar" | "none";
  equipmentPath?: string;
};

type ExercisePoseConfig = {
  frames: PoseTransform[];
};

// For each exercise category, define two keyframes of the movement
const exercisePoseConfigs: Record<string, ExercisePoseConfig> = {
  "supino": {
    frames: [
      { bodyRotation: -90, bodyTranslateX: -8, bodyTranslateY: 10, shoulderAngleL: -80, shoulderAngleR: -80, elbowAngleL: -90, elbowAngleR: -90, equipment: "barbell" },
      { bodyRotation: -90, bodyTranslateX: -8, bodyTranslateY: 10, shoulderAngleL: -80, shoulderAngleR: -80, elbowAngleL: -170, elbowAngleR: -170, equipment: "barbell" },
    ],
  },
  "desenvolvimento": {
    frames: [
      { shoulderAngleL: -150, shoulderAngleR: -150, elbowAngleL: -90, elbowAngleR: -90, equipment: "barbell" },
      { shoulderAngleL: -170, shoulderAngleR: -170, elbowAngleL: -170, elbowAngleR: -170, equipment: "barbell" },
    ],
  },
  "agachamento": {
    frames: [
      { hipAngleL: -10, hipAngleR: -10, kneeAngleL: -5, kneeAngleR: -5 },
      { bodyTranslateY: 14, hipAngleL: -70, hipAngleR: -70, kneeAngleL: -100, kneeAngleR: -100 },
    ],
  },
  "rosca": {
    frames: [
      { shoulderAngleL: 0, shoulderAngleR: 0, elbowAngleL: 0, elbowAngleR: 0, equipment: "barbell" },
      { shoulderAngleL: 0, shoulderAngleR: 0, elbowAngleL: -130, elbowAngleR: -130, equipment: "barbell" },
    ],
  },
  "remada": {
    frames: [
      { bodyRotation: -45, bodyTranslateY: 4, shoulderAngleL: 10, shoulderAngleR: 10, elbowAngleL: 0, elbowAngleR: 0, hipAngleL: -40, hipAngleR: -40, equipment: "barbell" },
      { bodyRotation: -45, bodyTranslateY: 4, shoulderAngleL: -40, shoulderAngleR: -40, elbowAngleL: -110, elbowAngleR: -110, hipAngleL: -40, hipAngleR: -40, equipment: "barbell" },
    ],
  },
  "stiff": {
    frames: [
      { hipAngleL: -5, hipAngleR: -5, shoulderAngleL: 0, shoulderAngleR: 0, elbowAngleL: 0, elbowAngleR: 0, equipment: "barbell" },
      { bodyRotation: -60, bodyTranslateY: 6, hipAngleL: -60, hipAngleR: -60, shoulderAngleL: 10, shoulderAngleR: 10, elbowAngleL: 0, elbowAngleR: 0, equipment: "barbell" },
    ],
  },
  "puxada": {
    frames: [
      { shoulderAngleL: -170, shoulderAngleR: -170, elbowAngleL: -170, elbowAngleR: -170, equipment: "bar" },
      { shoulderAngleL: -120, shoulderAngleR: -120, elbowAngleL: -80, elbowAngleR: -80, equipment: "bar" },
    ],
  },
  "triceps": {
    frames: [
      { shoulderAngleL: -170, shoulderAngleR: -170, elbowAngleL: -60, elbowAngleR: -60 },
      { shoulderAngleL: -170, shoulderAngleR: -170, elbowAngleL: -170, elbowAngleR: -170 },
    ],
  },
  "elevacao-lateral": {
    frames: [
      { shoulderAngleL: 0, shoulderAngleR: 0, elbowAngleL: -10, elbowAngleR: -10, equipment: "dumbbell" },
      { shoulderAngleL: -80, shoulderAngleR: -80, elbowAngleL: -10, elbowAngleR: -10, equipment: "dumbbell" },
    ],
  },
  "cardio": {
    frames: [
      { shoulderAngleL: 20, shoulderAngleR: -30, elbowAngleL: -90, elbowAngleR: -90, hipAngleL: -30, hipAngleR: 15, kneeAngleL: -20, kneeAngleR: -40 },
      { shoulderAngleL: -30, shoulderAngleR: 20, elbowAngleL: -90, elbowAngleR: -90, hipAngleL: 15, hipAngleR: -30, kneeAngleL: -40, kneeAngleR: -20 },
    ],
  },
  "prancha": {
    frames: [
      { bodyRotation: -85, bodyTranslateX: -5, bodyTranslateY: 20, shoulderAngleL: 80, shoulderAngleR: 80, elbowAngleL: 80, elbowAngleR: 80, hipAngleL: 0, hipAngleR: 0, kneeAngleL: 0, kneeAngleR: 0 },
      { bodyRotation: -85, bodyTranslateX: -5, bodyTranslateY: 18, shoulderAngleL: 80, shoulderAngleR: 80, elbowAngleL: 80, elbowAngleR: 80, hipAngleL: 0, hipAngleR: 0, kneeAngleL: 0, kneeAngleR: 0 },
    ],
  },
  "extensora": {
    frames: [
      { hipAngleL: -80, hipAngleR: -80, kneeAngleL: -90, kneeAngleR: -90, bodyTranslateY: 6 },
      { hipAngleL: -80, hipAngleR: -80, kneeAngleL: -10, kneeAngleR: -10, bodyTranslateY: 6 },
    ],
  },
  "flexora": {
    frames: [
      { bodyRotation: -90, bodyTranslateX: -6, bodyTranslateY: 14, hipAngleL: 0, hipAngleR: 0, kneeAngleL: -10, kneeAngleR: -10 },
      { bodyRotation: -90, bodyTranslateX: -6, bodyTranslateY: 14, hipAngleL: 0, hipAngleR: 0, kneeAngleL: -110, kneeAngleR: -110 },
    ],
  },
  "crucifixo": {
    frames: [
      { bodyRotation: -90, bodyTranslateX: -8, bodyTranslateY: 10, shoulderAngleL: -80, shoulderAngleR: -80, elbowAngleL: -10, elbowAngleR: -10, equipment: "dumbbell" },
      { bodyRotation: -90, bodyTranslateX: -8, bodyTranslateY: 10, shoulderAngleL: -170, shoulderAngleR: -170, elbowAngleL: -10, elbowAngleR: -10, equipment: "dumbbell" },
    ],
  },
  "default": {
    frames: [
      { shoulderAngleL: 0, shoulderAngleR: 0, elbowAngleL: 0, elbowAngleR: 0 },
      { shoulderAngleL: -10, shoulderAngleR: -10, elbowAngleL: -10, elbowAngleR: -10 },
    ],
  },
};

function getExerciseConfig(exerciseId: string): ExercisePoseConfig {
  const id = exerciseId.toLowerCase();
  for (const key of Object.keys(exercisePoseConfigs)) {
    if (key !== "default" && id.includes(key)) {
      return exercisePoseConfigs[key];
    }
  }
  // Check for cardio keywords
  if (id.includes("esteira") || id.includes("corrida") || id.includes("bicicleta") || id.includes("eliptic")) {
    return exercisePoseConfigs["cardio"];
  }
  return exercisePoseConfigs["default"];
}

function getActiveMuscles(exerciseId: string): string[] {
  const id = exerciseId.toLowerCase();
  for (const key of Object.keys(exerciseMuscleMap)) {
    if (id.includes(key)) {
      return exerciseMuscleMap[key];
    }
  }
  return [];
}

// Interpolate between two values
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Compute position at end of a limb segment given origin, angle and length
function limbEndpoint(ox: number, oy: number, angleDeg: number, length: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [ox + Math.cos(rad) * length, oy + Math.sin(rad) * length];
}

const sizeMap = {
  sm: { container: "w-24 h-24", viewBox: "0 0 100 100" },
  md: { container: "w-40 h-40", viewBox: "0 0 100 100" },
  lg: { container: "w-56 h-56", viewBox: "0 0 100 100" },
};

// Anatomical body outline SVG component
const AnatomicalBody = ({
  transform,
  activeMuscles,
  progress,
}: {
  transform: PoseTransform;
  activeMuscles: string[];
  progress: number; // 0 to 1 for smooth animation
}) => {
  const bodyRotation = transform.bodyRotation || 0;
  const bodyTX = transform.bodyTranslateX || 0;
  const bodyTY = transform.bodyTranslateY || 0;

  // Body proportions
  const headRadius = 5.5;
  const neckLen = 4;
  const torsoLen = 26;
  const upperArmLen = 12;
  const forearmLen = 11;
  const upperLegLen = 16;
  const lowerLegLen = 16;
  const shoulderWidth = 14;
  const hipWidth = 10;

  // Base position (standing centered)
  const baseX = 50 + bodyTX;
  const baseY = 14 + bodyTY;

  // Body direction (for rotation)
  const bodyRad = (bodyRotation * Math.PI) / 180;

  // Spine endpoints
  const headCx = baseX + Math.sin(bodyRad) * 0;
  const headCy = baseY + Math.cos(bodyRad) * 0;
  const neckBase: [number, number] = [
    headCx + Math.sin(bodyRad) * (headRadius + neckLen),
    headCy + Math.cos(bodyRad) * (headRadius + neckLen),
  ];
  const shoulderCenter: [number, number] = neckBase;
  const hipCenter: [number, number] = [
    neckBase[0] + Math.sin(bodyRad) * torsoLen,
    neckBase[1] + Math.cos(bodyRad) * torsoLen,
  ];

  // Shoulder points
  const shoulderPerpRad = bodyRad + Math.PI / 2;
  const shoulderL: [number, number] = [
    shoulderCenter[0] - Math.cos(shoulderPerpRad) * shoulderWidth / 2,
    shoulderCenter[1] - Math.sin(shoulderPerpRad) * shoulderWidth / 2,
  ];
  const shoulderR: [number, number] = [
    shoulderCenter[0] + Math.cos(shoulderPerpRad) * shoulderWidth / 2,
    shoulderCenter[1] + Math.sin(shoulderPerpRad) * shoulderWidth / 2,
  ];

  // Hip points
  const hipL: [number, number] = [
    hipCenter[0] - Math.cos(shoulderPerpRad) * hipWidth / 2,
    hipCenter[1] - Math.sin(shoulderPerpRad) * hipWidth / 2,
  ];
  const hipR: [number, number] = [
    hipCenter[0] + Math.cos(shoulderPerpRad) * hipWidth / 2,
    hipCenter[1] + Math.sin(shoulderPerpRad) * hipWidth / 2,
  ];

  // Arms
  const sAngleL = bodyRotation + 90 + (transform.shoulderAngleL || 0);
  const sAngleR = bodyRotation + 90 + (transform.shoulderAngleR || 0);
  const eAngleL = sAngleL + (transform.elbowAngleL || 0);
  const eAngleR = sAngleR + (transform.elbowAngleR || 0);

  const elbowL = limbEndpoint(shoulderL[0], shoulderL[1], sAngleL, upperArmLen);
  const elbowR = limbEndpoint(shoulderR[0], shoulderR[1], sAngleR, upperArmLen);
  const handL = limbEndpoint(elbowL[0], elbowL[1], eAngleL, forearmLen);
  const handR = limbEndpoint(elbowR[0], elbowR[1], eAngleR, forearmLen);

  // Legs
  const hAngleL = bodyRotation + 90 + (transform.hipAngleL || 0);
  const hAngleR = bodyRotation + 90 + (transform.hipAngleR || 0);
  const kAngleL = hAngleL + (transform.kneeAngleL || 0);
  const kAngleR = hAngleR + (transform.kneeAngleR || 0);

  const kneeL = limbEndpoint(hipL[0], hipL[1], hAngleL, upperLegLen);
  const kneeR = limbEndpoint(hipR[0], hipR[1], hAngleR, upperLegLen);
  const footL = limbEndpoint(kneeL[0], kneeL[1], kAngleL, lowerLegLen);
  const footR = limbEndpoint(kneeR[0], kneeR[1], kAngleR, lowerLegLen);

  // Colors
  const skinColor = "hsl(30 20% 75%)";
  const skinDark = "hsl(30 15% 55%)";
  const muscleBase = "hsl(0 0% 60%)";
  const muscleDetail = "hsl(0 0% 50%)";
  const activeColor = "hsl(0 72% 55%)";
  const activeGlow = "hsl(0 72% 55% / 0.3)";

  // Build body outline as a more anatomical shape
  const torsoPath = `
    M${shoulderL[0]},${shoulderL[1]} 
    Q${shoulderL[0] - 3},${shoulderL[1] + 2} ${shoulderL[0] - 2},${(shoulderL[1] + hipL[1]) / 2}
    Q${hipL[0] - 1},${hipL[1] - 4} ${hipL[0]},${hipL[1]}
    L${hipR[0]},${hipR[1]}
    Q${hipR[0] + 1},${hipR[1] - 4} ${shoulderR[0] + 2},${(shoulderR[1] + hipR[1]) / 2}
    Q${shoulderR[0] + 3},${shoulderR[1] + 2} ${shoulderR[0]},${shoulderR[1]}
    Z
  `;

  // Muscle pulse animation
  const pulse = 0.7 + 0.3 * Math.sin(progress * Math.PI * 2);

  // Equipment rendering
  const renderEquipment = () => {
    if (!transform.equipment || transform.equipment === "none") return null;

    if (transform.equipment === "barbell") {
      const midX = (handL[0] + handR[0]) / 2;
      const midY = (handL[1] + handR[1]) / 2;
      const dx = handR[0] - handL[0];
      const dy = handR[1] - handL[1];
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / (len || 1);
      const ny = dy / (len || 1);
      const ext = 8;
      return (
        <g>
          {/* Bar */}
          <line
            x1={handL[0] - nx * ext} y1={handL[1] - ny * ext}
            x2={handR[0] + nx * ext} y2={handR[1] + ny * ext}
            stroke="hsl(0 0% 55%)" strokeWidth="1.8" strokeLinecap="round"
          />
          {/* Plates */}
          <line
            x1={handL[0] - nx * (ext - 1)} y1={handL[1] - ny * (ext - 1) - 3}
            x2={handL[0] - nx * (ext - 1)} y2={handL[1] - ny * (ext - 1) + 3}
            stroke="hsl(0 0% 40%)" strokeWidth="3" strokeLinecap="round"
          />
          <line
            x1={handR[0] + nx * (ext - 1)} y1={handR[1] + ny * (ext - 1) - 3}
            x2={handR[0] + nx * (ext - 1)} y2={handR[1] + ny * (ext - 1) + 3}
            stroke="hsl(0 0% 40%)" strokeWidth="3" strokeLinecap="round"
          />
        </g>
      );
    }

    if (transform.equipment === "dumbbell") {
      return (
        <g>
          {[handL, handR].map((hand, i) => (
            <g key={i}>
              <line x1={hand[0] - 3} y1={hand[1]} x2={hand[0] + 3} y2={hand[1]} stroke="hsl(0 0% 50%)" strokeWidth="1.5" strokeLinecap="round" />
              <rect x={hand[0] - 4} y={hand[1] - 2} width="2.5" height="4" rx="0.5" fill="hsl(0 0% 35%)" />
              <rect x={hand[0] + 1.5} y={hand[1] - 2} width="2.5" height="4" rx="0.5" fill="hsl(0 0% 35%)" />
            </g>
          ))}
        </g>
      );
    }

    if (transform.equipment === "bar") {
      return (
        <line
          x1={handL[0]} y1={Math.min(handL[1], handR[1]) - 4}
          x2={handR[0]} y2={Math.min(handL[1], handR[1]) - 4}
          stroke="hsl(0 0% 50%)" strokeWidth="2" strokeLinecap="round"
        />
      );
    }

    return null;
  };

  // Create limb shapes (thicker, anatomical)
  const limbShape = (
    x1: number, y1: number, x2: number, y2: number,
    widthStart: number, widthEnd: number,
    isActive: boolean
  ) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const p1x = x1 + nx * widthStart / 2;
    const p1y = y1 + ny * widthStart / 2;
    const p2x = x1 - nx * widthStart / 2;
    const p2y = y1 - ny * widthStart / 2;
    const p3x = x2 - nx * widthEnd / 2;
    const p3y = y2 - ny * widthEnd / 2;
    const p4x = x2 + nx * widthEnd / 2;
    const p4y = y2 + ny * widthEnd / 2;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const bulge = isActive ? 1.2 : 0.6;

    return `M${p1x},${p1y} Q${midX + nx * bulge},${midY + ny * bulge} ${p4x},${p4y} L${p3x},${p3y} Q${midX - nx * bulge},${midY - ny * bulge} ${p2x},${p2y} Z`;
  };

  // Check if muscles are active
  const isChestActive = activeMuscles.includes("chest") || activeMuscles.includes("upper-chest");
  const isBicepsActive = activeMuscles.includes("biceps");
  const isTricepsActive = activeMuscles.includes("triceps");
  const isQuadsActive = activeMuscles.includes("quads");
  const isHamsActive = activeMuscles.includes("hamstrings");
  const isCalvesActive = activeMuscles.includes("calves");
  const isLatsActive = activeMuscles.includes("lats");

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={50} cy={94} rx={16} ry={3} fill="hsl(var(--foreground) / 0.08)" />

      {/* Muscle overlay on torso (behind body outline) */}
      {activeMuscles.map((muscleId) => {
        const muscle = anatomicalMuscles[muscleId];
        if (!muscle) return null;
        // Only render torso muscles here; limb muscles rendered on limbs
        if (["biceps", "triceps", "forearms", "quads", "hamstrings", "calves"].includes(muscleId)) return null;
        return (
          <g key={`glow-${muscleId}`}>
            {muscle.paths.map((p, i) => (
              <path key={i} d={p} fill={activeGlow} filter="url(#muscleGlow)" className="transition-all duration-700" />
            ))}
          </g>
        );
      })}

      {/* Equipment behind body */}
      {renderEquipment()}

      {/* Legs */}
      {/* Upper legs */}
      <path d={limbShape(hipL[0], hipL[1], kneeL[0], kneeL[1], 6, 4.5, isQuadsActive || isHamsActive)}
        fill={isQuadsActive || isHamsActive ? activeColor : skinColor}
        opacity={isQuadsActive || isHamsActive ? pulse : 1}
        stroke={skinDark} strokeWidth="0.3" className="transition-all duration-500"
      />
      <path d={limbShape(hipR[0], hipR[1], kneeR[0], kneeR[1], 6, 4.5, isQuadsActive || isHamsActive)}
        fill={isQuadsActive || isHamsActive ? activeColor : skinColor}
        opacity={isQuadsActive || isHamsActive ? pulse : 1}
        stroke={skinDark} strokeWidth="0.3" className="transition-all duration-500"
      />
      {/* Muscle definition lines on legs */}
      {(isQuadsActive || isHamsActive) && (
        <>
          <line x1={hipL[0]} y1={hipL[1] + 2} x2={kneeL[0]} y2={kneeL[1] - 2}
            stroke="hsl(0 50% 40%)" strokeWidth="0.4" opacity="0.5" />
          <line x1={hipR[0]} y1={hipR[1] + 2} x2={kneeR[0]} y2={kneeR[1] - 2}
            stroke="hsl(0 50% 40%)" strokeWidth="0.4" opacity="0.5" />
        </>
      )}

      {/* Lower legs */}
      <path d={limbShape(kneeL[0], kneeL[1], footL[0], footL[1], 4.5, 3, isCalvesActive)}
        fill={isCalvesActive ? activeColor : skinColor}
        opacity={isCalvesActive ? pulse : 1}
        stroke={skinDark} strokeWidth="0.3" className="transition-all duration-500"
      />
      <path d={limbShape(kneeR[0], kneeR[1], footR[0], footR[1], 4.5, 3, isCalvesActive)}
        fill={isCalvesActive ? activeColor : skinColor}
        opacity={isCalvesActive ? pulse : 1}
        stroke={skinDark} strokeWidth="0.3" className="transition-all duration-500"
      />

      {/* Knee joints */}
      <circle cx={kneeL[0]} cy={kneeL[1]} r="2.2" fill={skinDark} opacity="0.5" />
      <circle cx={kneeR[0]} cy={kneeR[1]} r="2.2" fill={skinDark} opacity="0.5" />

      {/* Feet */}
      <ellipse cx={footL[0]} cy={footL[1]} rx="2" ry="1.2" fill={skinDark} opacity="0.7" />
      <ellipse cx={footR[0]} cy={footR[1]} rx="2" ry="1.2" fill={skinDark} opacity="0.7" />

      {/* Torso */}
      <path d={torsoPath}
        fill={isChestActive || isLatsActive ? `url(#torsoActiveGrad)` : skinColor}
        stroke={skinDark} strokeWidth="0.4"
        className="transition-all duration-500"
      />

      {/* Muscle definition lines on torso */}
      {/* Center line */}
      <line x1={shoulderCenter[0]} y1={shoulderCenter[1] + 2}
        x2={hipCenter[0]} y2={hipCenter[1] - 2}
        stroke={skinDark} strokeWidth="0.4" opacity="0.4" />
      {/* Pec lines */}
      <path d={`M${shoulderCenter[0]},${shoulderCenter[1] + 6} Q${shoulderL[0] + 2},${shoulderL[1] + 8} ${shoulderL[0] + 1},${shoulderL[1] + 12}`}
        fill="none" stroke={skinDark} strokeWidth="0.3" opacity="0.3" />
      <path d={`M${shoulderCenter[0]},${shoulderCenter[1] + 6} Q${shoulderR[0] - 2},${shoulderR[1] + 8} ${shoulderR[0] - 1},${shoulderR[1] + 12}`}
        fill="none" stroke={skinDark} strokeWidth="0.3" opacity="0.3" />
      {/* Abs lines */}
      {[0.4, 0.55, 0.7].map((t, i) => {
        const lx = lerp(shoulderL[0] + 2, hipL[0] + 1, t);
        const rx = lerp(shoulderR[0] - 2, hipR[0] - 1, t);
        const y = lerp(shoulderCenter[1] + 4, hipCenter[1] - 2, t);
        return <line key={i} x1={lx} y1={y} x2={rx} y2={y} stroke={skinDark} strokeWidth="0.25" opacity="0.3" />;
      })}

      {/* Active muscle overlays on torso */}
      {activeMuscles.map((muscleId) => {
        const muscle = anatomicalMuscles[muscleId];
        if (!muscle) return null;
        if (["biceps", "triceps", "forearms", "quads", "hamstrings", "calves"].includes(muscleId)) return null;
        return (
          <g key={`active-${muscleId}`}>
            {muscle.paths.map((p, i) => (
              <path key={i} d={p} fill={activeColor} opacity={0.55 * pulse}
                stroke="hsl(0 60% 45%)" strokeWidth="0.3"
                className="transition-all duration-700" />
            ))}
          </g>
        );
      })}

      {/* Upper arms */}
      <path d={limbShape(shoulderL[0], shoulderL[1], elbowL[0], elbowL[1], 5, 4, isBicepsActive || isTricepsActive)}
        fill={isBicepsActive || isTricepsActive ? activeColor : skinColor}
        opacity={isBicepsActive || isTricepsActive ? pulse : 1}
        stroke={skinDark} strokeWidth="0.3" className="transition-all duration-500"
      />
      <path d={limbShape(shoulderR[0], shoulderR[1], elbowR[0], elbowR[1], 5, 4, isBicepsActive || isTricepsActive)}
        fill={isBicepsActive || isTricepsActive ? activeColor : skinColor}
        opacity={isBicepsActive || isTricepsActive ? pulse : 1}
        stroke={skinDark} strokeWidth="0.3" className="transition-all duration-500"
      />

      {/* Forearms */}
      <path d={limbShape(elbowL[0], elbowL[1], handL[0], handL[1], 3.8, 2.5, activeMuscles.includes("forearms"))}
        fill={activeMuscles.includes("forearms") ? activeColor : skinColor}
        opacity={activeMuscles.includes("forearms") ? pulse : 1}
        stroke={skinDark} strokeWidth="0.3" className="transition-all duration-500"
      />
      <path d={limbShape(elbowR[0], elbowR[1], handR[0], handR[1], 3.8, 2.5, activeMuscles.includes("forearms"))}
        fill={activeMuscles.includes("forearms") ? activeColor : skinColor}
        opacity={activeMuscles.includes("forearms") ? pulse : 1}
        stroke={skinDark} strokeWidth="0.3" className="transition-all duration-500"
      />

      {/* Elbow joints */}
      <circle cx={elbowL[0]} cy={elbowL[1]} r="1.8" fill={skinDark} opacity="0.4" />
      <circle cx={elbowR[0]} cy={elbowR[1]} r="1.8" fill={skinDark} opacity="0.4" />

      {/* Shoulder joints (deltoids) */}
      <circle cx={shoulderL[0]} cy={shoulderL[1]} r="3"
        fill={activeMuscles.includes("front-delt") || activeMuscles.includes("side-delt") ? activeColor : skinColor}
        opacity={activeMuscles.includes("front-delt") || activeMuscles.includes("side-delt") ? pulse : 0.9}
        stroke={skinDark} strokeWidth="0.3"
      />
      <circle cx={shoulderR[0]} cy={shoulderR[1]} r="3"
        fill={activeMuscles.includes("front-delt") || activeMuscles.includes("side-delt") ? activeColor : skinColor}
        opacity={activeMuscles.includes("front-delt") || activeMuscles.includes("side-delt") ? pulse : 0.9}
        stroke={skinDark} strokeWidth="0.3"
      />

      {/* Hands */}
      <circle cx={handL[0]} cy={handL[1]} r="2" fill={skinDark} opacity="0.7" />
      <circle cx={handR[0]} cy={handR[1]} r="2" fill={skinDark} opacity="0.7" />

      {/* Neck */}
      <line x1={headCx} y1={headCy + headRadius}
        x2={neckBase[0]} y2={neckBase[1]}
        stroke={skinColor} strokeWidth="3.5" strokeLinecap="round" />

      {/* Head */}
      <circle cx={headCx} cy={headCy} r={headRadius}
        fill={skinColor} stroke={skinDark} strokeWidth="0.4" />

      {/* Gradient defs */}
      <defs>
        <filter id="muscleGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id="torsoActiveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isChestActive ? activeColor : skinColor} stopOpacity={isChestActive ? 0.6 : 1} />
          <stop offset="40%" stopColor={skinColor} stopOpacity="1" />
          <stop offset="100%" stopColor={isLatsActive ? activeColor : skinColor} stopOpacity={isLatsActive ? 0.4 : 1} />
        </linearGradient>
      </defs>
    </g>
  );
};

const ExerciseAnimation = ({ exercise, className = "", size = "md" }: ExerciseAnimationProps) => {
  const [animTime, setAnimTime] = useState(0);
  const config = useMemo(() => getExerciseConfig(exercise.id), [exercise.id]);
  const activeMuscles = useMemo(() => getActiveMuscles(exercise.id), [exercise.id]);
  const sizes = sizeMap[size];

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const duration = 2400; // ms per full cycle

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      setAnimTime((elapsed % duration) / duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Smooth interpolation between frames using sine easing
  const frames = config.frames;
  const cyclePos = animTime; // 0 → 1
  // Ping-pong: 0→1→0
  const t = Math.sin(cyclePos * Math.PI);

  const interpolatedTransform: PoseTransform = {};
  const f0 = frames[0];
  const f1 = frames.length > 1 ? frames[1] : f0;

  for (const key of Object.keys(f0) as (keyof PoseTransform)[]) {
    if (key === "equipment" || key === "equipmentPath") {
      (interpolatedTransform as any)[key] = f0[key];
      continue;
    }
    const v0 = (f0[key] as number) || 0;
    const v1 = (f1[key] as number) || 0;
    (interpolatedTransform as any)[key] = lerp(v0, v1, t);
  }

  return (
    <div
      className={`relative ${sizes.container} rounded-2xl flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(180deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 100%)",
        border: "1px solid hsl(var(--border) / 0.5)",
      }}
    >
      {/* Subtle anatomical grid */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "8px 8px",
        }}
      />

      <svg viewBox={sizes.viewBox} className="absolute inset-0 w-full h-full p-1">
        <AnatomicalBody
          transform={interpolatedTransform}
          activeMuscles={activeMuscles}
          progress={cyclePos}
        />
      </svg>

      {/* Active muscle indicators */}
      {activeMuscles.length > 0 && (
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          {activeMuscles.slice(0, 4).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                backgroundColor: "hsl(0 72% 55%)",
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-medium whitespace-nowrap"
        style={{
          backgroundColor: "hsl(var(--secondary) / 0.9)",
          color: "hsl(var(--muted-foreground))",
          border: "1px solid hsl(var(--border) / 0.5)",
        }}
      >
        {exercise.tipoExercicio === "musculação" && "Execução"}
        {exercise.tipoExercicio === "cardio" && "Movimento"}
        {exercise.tipoExercicio === "alongamento" && "Posição"}
        {exercise.tipoExercicio === "mobilidade" && "Mobilidade"}
      </div>
    </g>
  );
};

export default ExerciseAnimation;
