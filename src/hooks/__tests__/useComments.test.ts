/**
 * Testes unitários do hook useComments.
 *
 * Pré-requisito — instalar dependências de teste (apenas uma vez):
 *   pnpm add -D vitest @testing-library/react jsdom @vitest/coverage-v8
 *
 * Adicionar ao vite.config.ts (ou criar vitest.config.ts):
 *   test: { environment: 'jsdom', globals: true }
 *
 * Executar:
 *   npx vitest run src/hooks/__tests__/useComments.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComments } from '../useComments';

// ---------------------------------------------------------------------------
// Mock do cliente Supabase
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockEqSelect = vi.fn(() => ({ order: mockOrder }));
const mockEqDelete = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockEqSelect, single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
const mockDelete = vi.fn(() => ({ eq: mockEqDelete }));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
}));

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_TASK_ID = '123e4567-e89b-12d3-a456-426614174000';
const INVALID_TASK_ID = 'nao-e-um-uuid-valido';

const mockComment = {
  id: 'aaa-111',
  task_id: VALID_TASK_ID,
  author: 'Arthur',
  content: 'Comentário de teste',
  created_at: '2026-04-26T10:00:00Z',
};

// ---------------------------------------------------------------------------
// GRUPO 1 — fetchComments retorna array vazio para taskId inválido
// ---------------------------------------------------------------------------

describe('fetchComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna array vazio quando taskId não tem correspondência no banco', async () => {
    // Banco retorna lista vazia para IDs sem match
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useComments());

    await act(async () => {
      await result.current.fetchComments(INVALID_TASK_ID);
    });

    expect(result.current.comments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('mantém loading=false após fetch concluído', async () => {
    mockOrder.mockResolvedValue({ data: [mockComment], error: null });

    const { result } = renderHook(() => useComments());

    await act(async () => {
      await result.current.fetchComments(VALID_TASK_ID);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.comments).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// GRUPO 2 — addComment chama Supabase com os parâmetros corretos
// ---------------------------------------------------------------------------

describe('addComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: mockComment, error: null });
  });

  it('chama supabase.from("comments").insert com task_id, author e content corretos', async () => {
    const { result } = renderHook(() => useComments());

    await act(async () => {
      await result.current.addComment(VALID_TASK_ID, 'Arthur', 'Comentário de teste');
    });

    expect(mockFrom).toHaveBeenCalledWith('comments');
    expect(mockInsert).toHaveBeenCalledWith({
      task_id: VALID_TASK_ID,
      author: 'Arthur',
      content: 'Comentário de teste',
    });
  });

  it('adiciona o comentário retornado pelo banco ao estado local', async () => {
    mockSingle.mockResolvedValue({ data: mockComment, error: null });

    const { result } = renderHook(() => useComments());

    await act(async () => {
      await result.current.addComment(VALID_TASK_ID, 'Arthur', 'Comentário de teste');
    });

    expect(result.current.comments).toContainEqual(mockComment);
  });
});

// ---------------------------------------------------------------------------
// GRUPO 3 — deleteComment chama supabase.delete com o id correto
// ---------------------------------------------------------------------------

describe('deleteComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Pré-popula um comentário no estado via addComment
    mockSingle.mockResolvedValue({ data: mockComment, error: null });
    mockEqDelete.mockResolvedValue({ data: null, error: null });
  });

  it('chama supabase.from("comments").delete().eq("id", commentId)', async () => {
    const { result } = renderHook(() => useComments());

    // Adiciona para ter algo no estado
    await act(async () => {
      await result.current.addComment(VALID_TASK_ID, 'Arthur', 'Comentário de teste');
    });

    await act(async () => {
      await result.current.deleteComment('aaa-111');
    });

    expect(mockFrom).toHaveBeenCalledWith('comments');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEqDelete).toHaveBeenCalledWith('id', 'aaa-111');
  });

  it('remove o comentário do estado local após deleção bem-sucedida', async () => {
    const { result } = renderHook(() => useComments());

    await act(async () => {
      await result.current.addComment(VALID_TASK_ID, 'Arthur', 'Comentário de teste');
    });

    expect(result.current.comments).toHaveLength(1);

    await act(async () => {
      await result.current.deleteComment('aaa-111');
    });

    expect(result.current.comments).toHaveLength(0);
  });
});
