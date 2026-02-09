/**
 * FirstBreakSteps 难度评分
 * 纯函数，不修改 levelData。复杂度 O(R log R)。
 */

import { LevelData, RopeData } from '@/types/Level';

const INF = Number.POSITIVE_INFINITY;

interface CellOwner {
  ropeId: number;
  pos: number;
}

/** 根据 D 计算头部下一格（头部为 Index[0]） */
function headNextCell(rope: RopeData, MapX: number, _MapY: number): number {
  const head = rope.Index[0];
  switch (rope.D) {
    case 1:
      return head + MapX;
    case 2:
      return head - MapX;
    case 3:
      return head + 1;
    case 4:
      return head - 1;
    default:
      return -1;
  }
}

/** 最小堆：(dist, ropeId)，按 dist 升序 */
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

/**
 * 根据当前关卡 JSON 计算 FirstBreakSteps。
 * 取长度 Top2 Rope 的 min(dist + 1) 作为评分；若全部 INF 返回 -1。
 */
export function computeFirstBreakSteps(levelData: LevelData): number {
  const { MapX, MapY, Rope } = levelData;
  const R = Rope.length;
  if (MapX === 0 || MapY === 0 || R === 0) {
    return -1;
  }

  const maxIndex = MapX * MapY - 1;

  // 1. 建立 occupancy：cellOwner[cell] = { ropeId, pos }
  const cellOwner = new Map<number, CellOwner>();
  for (let ropeId = 0; ropeId < R; ropeId++) {
    const rope = Rope[ropeId];
    const idx = rope.Index;
    for (let pos = 0; pos < idx.length; pos++) {
      cellOwner.set(idx[pos], { ropeId, pos });
    }
  }

  // 2. 判断每条 Rope 是否可动：头部下一格越界或为空 → movable
  const movable = new Set<number>();
  for (let ropeId = 0; ropeId < R; ropeId++) {
    const rope = Rope[ropeId];
    if (rope.Index.length < 2 || rope.D < 1 || rope.D > 4) continue;
    const next = headNextCell(rope, MapX, MapY);
    if (next < 0 || next > maxIndex) {
      movable.add(ropeId);
      continue;
    }
    const owner = cellOwner.get(next);
    if (owner === undefined) {
      movable.add(ropeId);
    }
    // 若被自己身体挡住则不可动，不加入 movable
  }

  // 3. 构建反向边：若 A 头部目标格被 B 占用，则 A->B，w = len(B)-pos；reverseEdges[B].push({ to: A, w })
  type Edge = { to: number; w: number };
  const reverseEdges: Edge[][] = Array.from({ length: R }, () => []);
  for (let A = 0; A < R; A++) {
    const rope = Rope[A];
    if (rope.Index.length < 2 || rope.D < 1 || rope.D > 4) continue;
    const next = headNextCell(rope, MapX, MapY);
    if (next < 0 || next > maxIndex) continue;
    const owner = cellOwner.get(next);
    if (owner === undefined) continue;
    const B = owner.ropeId;
    const pos = owner.pos;
    const lenB = Rope[B].Index.length;
    const w = lenB - pos;
    reverseEdges[B].push({ to: A, w });
  }

  // 4. 多源 Dijkstra：源点为所有 movable，dist=0；在 reverseEdges 上跑
  const dist: number[] = Array(R).fill(INF);
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

  // 5. 主线：按长度排序取 Top2，返回 min(dist[k] + 1)；若全部 INF 返回 -1
  const byLen = Rope.map((rope, i) => ({ ropeId: i, len: rope.Index.length }))
    .sort((a, b) => b.len - a.len)
    .slice(0, 2);
  let best = INF;
  for (const { ropeId } of byLen) {
    if (dist[ropeId] !== INF && dist[ropeId] + 1 < best) {
      best = dist[ropeId] + 1;
    }
  }
  return best === INF ? -1 : best;
}
