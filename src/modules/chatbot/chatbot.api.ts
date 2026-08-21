/**
 * Payload koji /api/chat vraća widgetu (Faza 4).
 * Nema tajni — smije se importati na klijentu.
 */

export type ChatApiResponse =
  | { kind: 'topic'; topicId: string }
  | { kind: 'availability' }
  | { kind: 'legal' }
  | { kind: 'gallery' }
  | { kind: 'rooms' }
  | { kind: 'escalate' }
  | { kind: 'llm'; text: string; topicId?: string };
