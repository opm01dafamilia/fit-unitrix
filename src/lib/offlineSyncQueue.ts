/**
 * Offline Sync Queue - Queues mutations when offline, syncs when back online.
 * Uses localStorage for persistence. Last-write-wins conflict resolution.
 */

import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "fitpulse_sync_queue";

export type SyncAction = {
  id: string;
  table: string;
  operation: "insert" | "update" | "upsert";
  data: Record<string, any>;
  timestamp: number;
  /** Optional match columns for upsert */
  matchColumns?: string[];
};

/** Read the pending queue */
function readQueue(): SyncAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

/** Write the queue */
function writeQueue(queue: SyncAction[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

/** Add an action to the sync queue */
export function enqueueAction(action: Omit<SyncAction, "id" | "timestamp">): void {
  const queue = readQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  writeQueue(queue);
  window.dispatchEvent(new CustomEvent("syncQueueChanged"));
}

/** Get count of pending actions */
export function getPendingCount(): number {
  return readQueue().length;
}

/** Process all queued actions (called when online) */
export async function processQueue(): Promise<{ success: number; failed: number }> {
  const queue = readQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: SyncAction[] = [];

  // Sort by timestamp to process in order
  queue.sort((a, b) => a.timestamp - b.timestamp);

  for (const action of queue) {
    try {
      let result;
      
      if (action.operation === "insert") {
        result = await supabase.from(action.table as any).insert(action.data);
      } else if (action.operation === "update") {
        const { id, ...rest } = action.data;
        result = await supabase.from(action.table as any).update(rest).eq("id", id);
      } else if (action.operation === "upsert") {
        result = await supabase
          .from(action.table as any)
          .upsert(action.data, {
            onConflict: (action.matchColumns || ["id"]).join(","),
          });
      }

      if (result?.error) {
        console.warn("[SyncQueue] Failed action:", action.table, result.error.message);
        remaining.push(action);
        failed++;
      } else {
        success++;
      }
    } catch {
      remaining.push(action);
      failed++;
    }
  }

  writeQueue(remaining);
  window.dispatchEvent(new CustomEvent("syncQueueChanged"));
  return { success, failed };
}

/** Clear all pending actions */
export function clearQueue(): void {
  writeQueue([]);
  window.dispatchEvent(new CustomEvent("syncQueueChanged"));
}

/**
 * Smart mutation: tries online first, falls back to queue.
 * Returns true if executed or queued successfully.
 */
export async function smartMutation(
  table: string,
  operation: "insert" | "update" | "upsert",
  data: Record<string, any>,
  matchColumns?: string[]
): Promise<boolean> {
  if (navigator.onLine) {
    try {
      let result;
      if (operation === "insert") {
        result = await supabase.from(table as any).insert(data);
      } else if (operation === "update") {
        const { id, ...rest } = data;
        result = await supabase.from(table as any).update(rest).eq("id", id);
      } else if (operation === "upsert") {
        result = await supabase
          .from(table as any)
          .upsert(data, { onConflict: (matchColumns || ["id"]).join(",") });
      }
      if (!result?.error) return true;
    } catch {}
  }

  // Offline or failed – queue it
  enqueueAction({ table, operation, data, matchColumns });
  return true;
}

// Auto-sync when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    // Small delay to let network stabilize
    await new Promise(r => setTimeout(r, 1500));
    const result = await processQueue();
    if (result.success > 0) {
      window.dispatchEvent(new CustomEvent("syncCompleted", { detail: result }));
    }
  });
}
