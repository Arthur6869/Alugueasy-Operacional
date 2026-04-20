# Integração Supabase — AlugEasy

**Data**: 18 de Abril de 2026  
**Status**: ✅ Build sem erros — pronto para uso

---

## O que foi feito

### 1. `src/lib/TasksContext.tsx` (novo)
Contexto global React com toda a lógica de dados:
- Busca tarefas e workspaces do Supabase ao iniciar
- Expõe: `tasks`, `workspaces`, `loading`, `error`
- Funções de tarefas: `addTask`, `updateTask`, `deleteTask`, `refreshTasks`
- Funções de workspaces: `addWorkspace`, `updateWorkspace`, `deleteWorkspace`
- Mapeia campos do banco (`title`, `due_date`) para a UI (`name`, `date`)
- Formata datas automaticamente: ISO → "Hoje" / "18 abr"

### 2. `src/app/App.tsx` (atualizado)
- Envolve tudo com `<TasksProvider>`
- Workspaces agora vêm do Supabase (não mais do `useState` local)
- `onSave` do `NewWorkspaceModal` chama `addWorkspace()` no banco
- `onDeleteWorkspace` da `Sidebar` chama `deleteWorkspace()` no banco
- Passa `filterGroup` para `TaskTableReadOnly` por view (Operacional/Desenvolvimento/Financeiro)

### 3. Componentes integrados

| Componente | O que mudou |
|---|---|
| `TaskTable.tsx` | Usa `useTasksContext()` — remove mockTasks, bulk delete real |
| `TaskTableReadOnly.tsx` | Usa contexto, aceita `filterGroup` prop para filtrar por grupo |
| `KanbanBoard.tsx` | Agrupa tarefas do contexto por status, mostra loading |
| `MyTasks.tsx` | Filtra tarefas do contexto por `currentUser` |
| `Dashboard.tsx` | Estatísticas calculadas em tempo real do banco |
| `NewTaskModal.tsx` | Salva no Supabase via `addTask()`, botão com loading |
| `TaskDetailPanel.tsx` | Botão excluir chama `deleteTask()` no banco |

---

## Fluxo de dados

```
Supabase DB
    ↓  (fetch on mount)
TasksContext (estado global)
    ↓  (useTasksContext())
Todos os componentes
    ↓  (addTask / updateTask / deleteTask)
Supabase DB  ←  estado local atualizado otimisticamente
```

---

## Tabelas utilizadas

| Tabela | Propósito |
|---|---|
| `tasks` | Tarefas (CRUD completo) |
| `workspaces` | Workspaces personalizados (CRUD completo) |
| `comments` | Comentários por tarefa (estrutura criada, UI parcial) |
| `subtasks` | Subtarefas (estrutura criada, UI parcial) |

---

## Próximos passos

- [ ] **Comentários reais**: `TaskDetailPanel` ainda usa lista local — integrar com `db.comments`
- [ ] **Subtarefas reais**: mesma situação — integrar com `db.subtasks`
- [ ] **Autenticação Supabase**: substituir login hardcoded por `supabase.auth.signInWithPassword`
- [ ] **Realtime**: adicionar `supabase.channel(...).on('postgres_changes', ...)` para sincronizar entre usuários
- [ ] **ReportsView / GanttView / CalendarView**: ainda usam dados mockados — integrar com contexto
- [ ] **Contagem de comentários**: a query de tarefas pode incluir `comment_count` via função SQL

---

## Como verificar que está funcionando

1. Rode o projeto: `npm run dev`
2. Faça login com qualquer usuário
3. Crie uma tarefa via "+ Nova Tarefa"
4. Recarregue a página — a tarefa deve persistir
5. Verifique no Supabase Dashboard → Table Editor → `tasks`
