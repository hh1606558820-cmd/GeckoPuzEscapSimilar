/**
 * Rope Puzzle DifficultyScore 最终版（双通道模型）
 * 纯函数，不修改 levelData。
 */

import { LevelData, RopeData } from '@/types/Level';

const INF = Number.POSITIVE_INFINITY;

export interface DifficultyDiagnostics {
  DifficultyScore: number;
  BreakDifficulty: number;
  CognitiveDifficulty: number;
  FirstBreakSteps: number;
  KeyLockDepth: number;
  InitialMovableCount: number;
  Density: number;
  EmptyRatio: number;
  N: number;
  AvgLen: number;
  MaxLen: number;
  AvgBends: number;
  FreeAheadRatio?: number;
  OOBRatio?: number;
  KeySet?: number[];
}

interface CellOwner {
  ropeId: number;
  pos: number;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** logNorm(x, xmax) = clamp01( ln(1+x) / ln(1+xmax) ) */
function logNorm(x: number, xmax: number): number {
  if (xmax <= 0) return 0;
  return clamp01(Math.log(1 + Math.max(0, x)) / Math.log(1 + xmax));
}

/** NextCell：考虑左右边界，OUT 返回 -1 */
function nextCell(rope: RopeData, MapX: number): number {
  const head = rope.Index[0];
  switch (rope.D) {
    case 1:
      return head + MapX;
    case 2:
      return head - MapX;
    case 3:
      if (MapX === 0) return -1;
      if (head % MapX === MapX - 1) return -1;
      return head + 1;
    case 4:
      if (MapX === 0) return -1;
      if (head % MapX === 0) return -1;
      return head - 1;
    default:
      return -1;
  }
}

function heapPush(heap: [number, number][], dist: number, ropeId: number): void {
  heap.push([dist, ropeId]);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p][0] <= heap[i][0]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function heapPop(heap: [number, number][]): [number, number] | null {
  if (heap.length === 0) return null;
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length === 0) return top;
  heap[0] = last;
  let i = 0;
  const n = heap.length;
  while (true) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    let smallest = i;
    if (l < n && heap[l][0] < heap[smallest][0]) smallest = l;
    if (r < n && heap[r][0] < heap[smallest][0]) smallest = r;
    if (smallest === i) break;
    [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
    i = smallest;
  }
  return top;
}

export function computeDifficulty(levelData: LevelData): DifficultyDiagnostics {
  const { MapX, MapY, Rope } = levelData;
  const N = Rope.length;
  const BoardSize = MapX * MapY;

  const emptyDiag: DifficultyDiagnostics = {
    DifficultyScore: 0,
    BreakDifficulty: 0,
    CognitiveDifficulty: 0,
    FirstBreakSteps: 0,
    KeyLockDepth: 0,
    InitialMovableCount: 0,
    Density: 0,
    EmptyRatio: BoardSize === 0 ? 0 : 1,
    N: 0,
    AvgLen: 0,
    MaxLen: 0,
    AvgBends: 0,
  };

  if (BoardSize === 0 || N === 0) {
    return emptyDiag;
  }

  const occSet = new Set<number>();
  const Len: number[] = [];
  let sumLen = 0;
  let sumBends = 0;
  for (let i = 0; i < N; i++) {
    const idx = Rope[i].Index;
    for (let k = 0; k < idx.length; k++) occSet.add(idx[k]);
    const len = idx.length;
    Len.push(len);
    sumLen += len;
    sumBends += Rope[i].BendCount ?? 0;
  }
  const OccCount = occSet.size;
  const Density = OccCount / BoardSize;
  const EmptyRatio = 1 - Density;
  const AvgLen = sumLen / N;
  const MaxLen = Len.length > 0 ? Math.max(...Len) : 0;
  const AvgBends = sumBends / N;

  let InitialMovableCount = 0;
  let freeAheadCount = 0;
  let oobCount = 0;
  const movable = new Set<number>();
  for (let i = 0; i < N; i++) {
    const rope = Rope[i];
    if (rope.Index.length < 2 || rope.D < 1 || rope.D > 4) continue;
    const t = nextCell(rope, MapX);
    const inBounds = t >= 0 && t < BoardSize;
    if (!inBounds) {
      movable.add(i);
      InitialMovableCount++;
      oobCount++;
      continue;
    }
    if (!occSet.has(t)) {
      movable.add(i);
      InitialMovableCount++;
      freeAheadCount++;
    }
  }
  const FreeAheadRatio = N > 0 ? freeAheadCount / N : 0;
  const OOBRatio = N > 0 ? oobCount / N : 0;

  const cellOwner = new Map<number, CellOwner>();
  for (let ropeId = 0; ropeId < N; ropeId++) {
    const idx = Rope[ropeId].Index;
    for (let pos = 0; pos < idx.length; pos++) {
      cellOwner.set(idx[pos], { ropeId, pos });
    }
  }

  type Edge = { to: number; w: number };
  const reverseEdges: Edge[][] = Array.from({ length: N }, () => []);
  for (let A = 0; A < N; A++) {
    if (movable.has(A)) continue;
    const rope = Rope[A];
    if (rope.Index.length < 2 || rope.D < 1 || rope.D > 4) continue;
    const t = nextCell(rope, MapX);
    if (t < 0 || t >= BoardSize) continue;
    const owner = cellOwner.get(t);
    if (owner === undefined) continue;
    const B = owner.ropeId;
    const posInB = owner.pos;
    const w = Len[B] - posInB;
    reverseEdges[B].push({ to: A, w });
  }

  const dist: number[] = Array(N).fill(INF);
  const heap: [number, number][] = [];
  movable.forEach((r) => {
    dist[r] = 0;
    heapPush(heap, 0, r);
  });
  while (true) {
    const top = heapPop(heap);
    if (top === null) break;
    const [d, cur] = top;
    if (d > dist[cur]) continue;
    for (const { to, w } of reverseEdges[cur]) {
      const nd = dist[cur] + w;
      if (nd < dist[to]) {
        dist[to] = nd;
        heapPush(heap, nd, to);
      }
    }
  }

  const byLen = Rope.map((_, i) => ({ ropeId: i, len: Len[i] }))
    .sort((a, b) => b.len - a.len)
    .slice(0, 2);
  const KeySet = byLen.map((x) => x.ropeId);

  let FirstBreakSteps: number;
  let KeyLockDepth: number;
  if (KeySet.length === 0) {
    FirstBreakSteps = 0;
    KeyLockDepth = 0;
  } else {
    let keyLockMin = INF;
    let firstBreakMin = INF;
    for (const k of KeySet) {
      if (dist[k] !== INF) {
        if (dist[k] < keyLockMin) keyLockMin = dist[k];
        if (dist[k] + 1 < firstBreakMin) firstBreakMin = dist[k] + 1;
      }
    }
    if (keyLockMin === INF && firstBreakMin === INF) {
      FirstBreakSteps = 25;
      KeyLockDepth = 25;
    } else {
      KeyLockDepth = keyLockMin === INF ? 25 : keyLockMin;
      FirstBreakSteps = firstBreakMin === INF ? 25 : firstBreakMin;
    }
  }

  const nFirst = logNorm(FirstBreakSteps, 25);
  const nLock = logNorm(KeyLockDepth, 25);
  const nN = clamp01(N / 60);
  const nAvg = clamp01(AvgLen / 15);
  const nMax = clamp01(MaxLen / 80);
  const nBend = clamp01(AvgBends / 15);
  const nDen = clamp01(Density / 0.95);
  const invMov = clamp01((1 / Math.max(1, InitialMovableCount)) / 0.25);
  const branch = clamp01(EmptyRatio / 0.45) * clamp01(FreeAheadRatio / 0.45);
  const nOOB = clamp01(OOBRatio / 0.6);

  const BreakDifficulty = clamp01(
    0.4 * nFirst + 0.25 * nLock + 0.2 * invMov + 0.15 * branch - 0.05 * nOOB
  );
  const CognitiveDifficulty = clamp01(
    0.35 * nDen +
      0.2 * nN +
      0.15 * nAvg +
      0.1 * nBend +
      0.1 * nMax +
      0.1 * (1 - EmptyRatio)
  );
  const DifficultyScore = 100 * clamp01(Math.max(BreakDifficulty, CognitiveDifficulty));

  return {
    DifficultyScore,
    BreakDifficulty,
    CognitiveDifficulty,
    FirstBreakSteps,
    KeyLockDepth,
    InitialMovableCount,
    Density,
    EmptyRatio,
    N,
    AvgLen,
    MaxLen,
    AvgBends,
    FreeAheadRatio,
    OOBRatio,
    KeySet,
  };
}
