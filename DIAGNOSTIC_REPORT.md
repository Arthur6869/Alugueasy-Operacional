# Diagnóstico UX · Alugueasy Task Manager
**Data:** 26/04/2026  
**Metodologia:** Análise estática do código-fonte (WebFetch bloqueado pelo SPA React)

---

## 1. Mapa de Telas e Navegação

### Telas Principais (via `App.tsx`)

| View ID | Nome na UI | Componente | Acesso |
|---|---|---|---|
| `dashboard` | Início | `Dashboard` | Sidebar → Início |
| `my-tasks` | Minhas Tarefas | `MyTasks` | Sidebar → Minhas Tarefas |
| `schedule` | Cronograma | `TaskTable` (todas tarefas) | Sidebar → Cronograma |
| `notifications` | Notificações | `NotificationsPanel` | Sidebar → Notificações |
| `operacional` | Operacional | `TaskTable` (filtrado) | Sidebar → Workspaces → Operacional |
| `desenvolvimento` | Desenvolvimento | `TaskTable` (filtrado) | Sidebar → Workspaces → Desenvolvimento |
| `financeiro` | Financeiro | `TaskTable` (filtrado) | Sidebar → Workspaces → Financeiro |
| `workspace-{id}` | Workspace personalizado | `TaskTable` (filtrado) | Sidebar → custom |
| `kanban` | Kanban | `KanbanBoard` | Sidebar → Vistas → Kanban |
| `calendar` | Calendário | `CalendarView` | Sidebar → Vistas → Calendário |
| `gantt` | Gantt | `GanttView` | Sidebar → Vistas → Gantt |
| `reports` | Relatórios | `ReportsView` | Sidebar → Vistas → Relatórios |
| `settings` | Configurações | `SettingsScreen` | Sidebar → rodapé |

### Modais e Painéis Sobrepostos

| Componente | Gatilho | Observação |
|---|---|---|
| `NewTaskModal` | CustomEvent `openNewTask` | Formulário completo |
| `NewWorkspaceModal` | Botão "+" em Workspaces | Funcional |
| `SearchModal` | Ícone de busca | Busca por título, assignee, tags |
| `TaskDetailPanel` | CustomEvent `openTaskDetail` | Painel lateral direito, 480px |

### Estrutura da Sidebar
```
SEÇÃO PRINCIPAL
  ├── Início (dashboard)
  ├── Minhas Tarefas (my-tasks)
  ├── Cronograma (schedule)
  └── Notificações (notifications)

WORKSPACES
  ├── Operacional
  ├── Desenvolvimento
  ├── Financeiro
  └── [workspaces criados pelo usuário]

VISTAS
  ├── Kanban (kanban)
  ├── Calendário (calendar)
  ├── Gantt (gantt)
  └── Relatórios (reports)
```

---

## 2. Auditoria Mobile (390 × 844 px)

### ✅ Funciona bem no mobile

| Tela / Componente | Por quê funciona |
|---|---|
| Sidebar | `fixed` com overlay, `translate-x` toggle, `md:relative` |
| Dashboard — cards de stats | `grid-cols-2 lg:grid-cols-4` — 2 colunas no mobile |
| TaskDetail panel | `w-full sm:w-[480px]` — ocupa tela toda no mobile |
| NewTaskModal | `max-w-2xl` com padding, scrollável |
| NewWorkspaceModal | Similar ao acima |
| Sidebar collapsed | `w-16` com ícones, sem texto |

### ❌ Problemas críticos no mobile

| Tela | Problema | Localização | Impacto |
|---|---|---|---|
| **Relatórios — stats** | `grid grid-cols-4` sem breakpoint mobile | `ReportsView.tsx:65` | Cards overflow fora da tela em 390px |
| **Relatórios — charts** | `grid grid-cols-2` sem breakpoint mobile | `ReportsView.tsx:82` | Charts apertados/cortados |
| **Dashboard — "Nova Tarefa"** | `hidden sm:inline-flex` — sem alternativa mobile | `Dashboard.tsx:108` | Usuário mobile não tem botão de criar tarefa no dashboard |
| **Minhas Tarefas — "Nova Tarefa"** | Mesmo padrão `hidden sm:` | `MyTasks.tsx:54` | Idem |
| **Kanban** | `min-w-max` + 4 colunas × 288-320px = ~1200px mínimo | `KanbanBoard.tsx:53` | Requer scroll horizontal pesado |
| **Gantt** | Nenhum tratamento mobile | `GanttView.tsx` | Virtualmente inutilizável no mobile |
| **CalendarView** | Grade mensal 7 colunas sem adaptação mobile | `CalendarView.tsx` | Dias comprimidos demais |

---

## 3. Auditoria Desktop (1440 × 900 px)

### Funcionalidades completas

| Tela | Status | Notas |
|---|---|---|
| Dashboard | ✅ Completo | Stats + gráficos + tarefas recentes + prioridades pessoais |
| TaskTable (Cronograma/Workspaces) | ✅ Completo | Busca, filtros, grupos colapsáveis, drag handle (visual), select all |
| Kanban | ✅ Parcial | Drag & drop NÃO implementado — apenas visual |
| Calendário | ✅ Parcial | Mostra tarefas por dia mas clicar num dia/tarefa não faz nada |
| Gantt | ✅ Parcial | Zoom funciona, scroll funciona, filtros e dependências não |
| Relatórios | ✅ Completo | Pie + Bar + Line charts, responsivos (Recharts) |
| TaskDetail panel | ✅ Parcial | Ver seção "Funcionalidades quebradas" |
| Settings | ✅ Parcial | Seções com stubs — ver abaixo |
| Notificações | ❌ Stub | Hardcoded "Sem notificações" |

### Funcionalidades com problemas no desktop

**TaskTable:**
- GripVertical (drag handle) existe no DOM mas drag & drop não está implementado — `GripVertical` é decorativo
- Opção "Vencidas" no filtro de data depende de lógica que não está visível no snippet lido

**KanbanBoard:**
- Clicar "Adicionar tarefa" abre `NewTaskModal` mas sem pré-selecionar o status da coluna (`handleAddCard` em `KanbanBoard.tsx:31` ignora o `status`)
- Drag & drop entre colunas não implementado (sem biblioteca de DnD)

**GanttView:**
- Botão "Filtros" não tem handler — apenas aparência (`GanttView.tsx:173`)
- Botão de navegação de calendário não funciona (`GanttView.tsx:169`)
- Dependências entre tarefas: infraestrutura existe (`dependencies?: string[]` em `TasksContext.tsx:16`) mas nunca são populadas — as linhas SVG de dependência nunca aparecem

**TaskDetailPanel:**
- Aba "Atividade": `const activities = []` hardcoded vazio (`TaskDetailPanel.tsx:52`) — nenhum evento de log está sendo registrado
- Botão "Duplicar": dispara `showToast('Tarefa duplicada!')` mas não chama `addTask` (`TaskDetailPanel.tsx:729`)
- Comentários, subtarefas e anexos vivem apenas em estado local do React — não são persistidos no Supabase
- `task.comments` vem do banco (`comment_count` em `TasksContext.tsx:77`) mas os comentários adicionados no painel não são salvos

**SettingsScreen:**
- "Autenticação de Dois Fatores": stub — mostra toast "em desenvolvimento" (`SettingsScreen.tsx:564`)
- "Sessões Ativas": stub — mostra toast (`SettingsScreen.tsx:571`)
- "Convidar membro para equipe": stub (`SettingsScreen.tsx:602`)
- "Exportar Dados": stub (`SettingsScreen.tsx:615`)
- "Desativar Conta": stub (`SettingsScreen.tsx:622`)
- "Excluir Conta": stub (`SettingsScreen.tsx:629`)
- Seletor de idioma: persiste no `localStorage` e mostra toast, mas não muda o locale da aplicação
- Email: hardcoded `{user.toLowerCase()}@alugueasy.com`, não é editável

---

## 4. Comparativo com Monday.com

### Features que Alugueasy tem

| Feature | Alugueasy | Nível |
|---|---|---|
| Visualização Tabela | ✅ | Completo (busca, filtros, grupos) |
| Visualização Kanban | ✅ | Parcial (sem DnD) |
| Visualização Calendário | ✅ | Parcial (sem clique em tarefa) |
| Visualização Gantt | ✅ | Parcial (sem filtros, dependências) |
| Relatórios / Charts | ✅ | Completo (Pie, Bar, Line) |
| Detalhe de tarefa | ✅ | Parcial (comentários não persistem) |
| Subtarefas | ✅ | Parcial (não persiste) |
| Prioridades (4 níveis) | ✅ | Completo |
| Status (4 estados) | ✅ | Completo |
| Tags | ✅ | Completo |
| Tema claro/escuro | ✅ | Completo |
| Multiple workspaces | ✅ | Completo (custom workspaces) |
| Perfil de usuário + foto | ✅ | Completo |
| Busca global | ✅ | Parcial (título, assignee, tags) |

### Features que Monday.com tem mas Alugueasy não tem

| Feature | Prioridade para Alugueasy |
|---|---|
| Drag & drop no Kanban | Alta |
| Persistência de comentários no banco | Alta |
| Persistência de subtarefas no banco | Alta |
| Log de atividade real por tarefa | Alta |
| Notificações in-app reais | Média |
| Dependências entre tarefas (Gantt) | Média |
| Rastreamento de tempo (time tracking) | Média |
| Visualização de carga da equipe (Workload) | Média |
| Automações (regras trigger → ação) | Baixa |
| Integrações externas (Slack, GitHub, etc.) | Baixa |
| Formulários para criação de tarefas | Baixa |
| Docs / notas colaborativas | Baixa |
| Menções @usuário em comentários | Baixa |
| Permissões por papel (admin/membro/convidado) | Baixa |
| Exportação de dados real (CSV, Excel) | Baixa |

---

## 5. Prioridades de Correção

### 🔴 Quebrado — corrigir imediatamente

| # | Problema | Arquivo | Fix sugerido |
|---|---|---|---|
| 1 | Reports sem responsive mobile | `ReportsView.tsx:65` | Adicionar `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` e `grid-cols-1 lg:grid-cols-2` |
| 2 | Botão "Nova Tarefa" invisível no mobile | `Dashboard.tsx:108`, `MyTasks.tsx:54` | Adicionar FAB mobile (`fixed bottom-6 right-6`) |
| 3 | "Duplicar tarefa" não duplica | `TaskDetailPanel.tsx:729` | Chamar `addTask({ ...task })` sem o `id` |
| 4 | Kanban não pré-seleciona status da coluna | `KanbanBoard.tsx:31` | Passar `initialStatus` para `NewTaskModal` via CustomEvent |
| 5 | Notificações completamente stub | `NotificationsPanel.tsx` | Implementar leitura de eventos de tarefas (prazo vencendo, atribuições) |

### 🟡 Incompleto — completar no próximo sprint

| # | Problema | Arquivo | Fix sugerido |
|---|---|---|---|
| 6 | Comentários não persistem | `TaskDetailPanel.tsx:73` | Criar tabela `comments` no Supabase, conectar `handleAddComment` |
| 7 | Subtarefas não persistem | `TaskDetailPanel.tsx:114` | Criar tabela `subtasks` no Supabase |
| 8 | Atividade tab vazia | `TaskDetailPanel.tsx:52` | Inserir rows na tabela de activity a cada mudança de status/assignee |
| 9 | Idioma não muda locale | `SettingsScreen.tsx:132` | Integrar i18n (`react-i18next`) ou remover opção da UI |
| 10 | Gantt filtros sem função | `GanttView.tsx:173` | Implementar filtro por assignee ou remover botão |
| 11 | CalendarView sem clique funcional | `CalendarView.tsx` | Disparar `openTaskDetail` ao clicar em uma tarefa do dia |
| 12 | Drag & drop no Kanban | `KanbanBoard.tsx` | Integrar `@dnd-kit/core` ou `react-beautiful-dnd` |

### 🔵 Ausente — planejar para versão futura

| # | Feature | Justificativa |
|---|---|---|
| 13 | Persistência de anexos | Supabase Storage já disponível |
| 14 | Dependências no Gantt | Infraestrutura de tipo existe, falta UI de edição e dados |
| 15 | Notificações por prazo | `SettingsScreen` já tem toggle, falta o worker |
| 16 | Busca full-text (descrição, comentários) | Supabase FTS disponível |
| 17 | Exportação CSV | Alta demanda em tools de gestão |
| 18 | Drag & drop no Cronograma | Reordenar prioridade visualmente |

---

## 6. Resumo Executivo

**O que está sólido:** As visualizações core (Dashboard, TaskTable, Relatórios, Settings) estão implementadas com qualidade visual adequada. O modelo de dados (Supabase) está bem estruturado. A arquitetura React com `TasksContext` é limpa e extensível.

**Principal gap de produto:** Vários componentes têm uma fachada visual completa mas nenhuma persistência real (comentários, subtarefas, anexos, atividade, notificações). O usuário percebe que ações "funcionam" (toast de sucesso) mas os dados somem ao recarregar — este é o maior risco de confiança no produto.

**Principal gap de UX mobile:** A tela de Relatórios é inutilizável no mobile (`grid-cols-4` sem breakpoints). O padrão `hidden sm:` nos botões de criação de tarefa deixa usuários mobile sem acesso rápido à ação mais importante.

**Esforço estimado para estabilização:** 3–5 dias de desenvolvimento focado nos itens 1–8 da lista de prioridades resolve os bugs mais críticos e entrega um produto coeso.
