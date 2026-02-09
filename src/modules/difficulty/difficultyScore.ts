/**
 * 关卡难度评分 DifficultyScore(0–100) 与诊断字段
 * 纯函数，不修改 levelData。
 */

import { LevelData, RopeData } from '@/types/Level';

const INF = Number.POSITIVE_INFINITY;

export interface DifficultyDiagnostics {
  DifficultyScore: number;
  FirstBreakSteps: number;
  KeyLockDepth: number;
  InitialMovableCount: number;
  EmptyRatio: number;
  FreeAheadRatio: number;
  OOBRatio: number;
  N: number;
  AvgLen: number;
  MaxLen: number;
  AvgBends: number;
  KeySet: number[];
}

interface CellOwner {
  ropeId: number;
  pos: number;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
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
    FirstBreakSteps: -1,
    KeyLockDepth: -1,
    InitialMovableCount: 0,
    EmptyRatio: BoardSize === 0 ? 0 : 1,
    FreeAheadRatio: 0,
    OOBRatio: 0,
    N: 0,
    AvgLen: 0,
    MaxLen: 0,
    AvgBends: 0,
    KeySet: [],
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
  const EmptyRatio = 1 - OccCount / BoardSize;
  const AvgLen = N > 0 ? sumLen / N : 0;
  const MaxLen = Len.length > 0 ? Math.max(...Len) : 0;
  const AvgBends = N > 0 ? sumBends / N : 0;

  let InitialMovableCount = 0;
  let freeAheadCount = 0;
  let oobCount = 0;
  const movable = new Set<number>();
  for (let i = 0; i < N; i++) {
    const rope = Rope[i];
    if (rope.Index.length < 2 || rope.D < 1 || rope.D > 4) continue;
    const t = nextCell(rope, MapX);
    if (t < 0 || t >= BoardSize) {
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

  let keyLockMin = INF;
  let firstBreakMin = INF;
  for (const k of KeySet) {
    if (dist[k] !== INF) {
      if (dist[k] < keyLockMin) keyLockMin = dist[k];
      if (dist[k] + 1 < firstBreakMin) firstBreakMin = dist[k] + 1;
    }
  }
  const KeyLockDepth = keyLockMin === INF ? -1 : keyLockMin;
  const FirstBreakSteps = firstBreakMin === INF ? -1 : firstBreakMin;

  const normN = clamp01(N / 60);
  const normEmpty = clamp01(EmptyRatio / 0.8);
  const normBends = clamp01(AvgBends / 15);
  const normMaxLen = clamp01(MaxLen / 80);
  const normFreeAhead = clamp01(FreeAheadRatio / 0.8);
  const normFirstBreak = clamp01(FirstBreakSteps === -1 ? 1 : FirstBreakSteps / 25);
  const normKeyLock = clamp01(KeyLockDepth === -1 ? 1 : KeyLockDepth / 25);
  const normOOB = clamp01(OOBRatio / 0.6);

  const raw =
    0.32 * normFirstBreak +
    0.2 * normKeyLock +
    0.15 * normN +
    0.1 * normEmpty +
    0.1 * normBends +
    0.08 * normMaxLen +
    0.05 * normFreeAhead -
    0.05 * normOOB;
  const DifficultyScore = 100 * clamp01(raw);

  return {
    DifficultyScore,
    FirstBreakSteps,
    KeyLockDepth,
    InitialMovableCount,
    EmptyRatio,
    FreeAheadRatio,
    OOBRatio,
    N,
    AvgLen,
    MaxLen,
    AvgBends,
    KeySet,
  };
}
