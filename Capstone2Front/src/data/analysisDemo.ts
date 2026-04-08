/** 데모 채점 점수 — 백엔드 연동 시 API 응답으로 교체 */
export const DEMO_SCORES: Record<string, { category: number; items: number[] }> = {
  content: { category: 82, items: [85, 80, 82] },
  attitude: { category: 78, items: [80, 76, 78] },
  voice: { category: 74, items: [78, 75, 72, 71] },
};
