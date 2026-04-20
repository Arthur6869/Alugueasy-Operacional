Design a complete internal task management web application called "AlugEasy Task Manager" 
inspired by Monday.com's feature set, adapted for a 4-person team managing a short-term 
rental financial platform. The visual identity uses deep navy (#1E3A5F) as brand primary, 
slate gray (#A8B4C0) as secondary, with white cards on a light gray page background (#F4F6F9).

The 4 team members are: Arthur, Yasmim, Alexandre, Nikolas.
Each has a unique avatar color:
  Arthur    → #4A9EDB (blue)
  Yasmim    → #F472B6 (pink)
  Alexandre → #34D399 (green)
  Nikolas   → #F59E0B (amber)

---

## ════════════════════════════════
## SCREEN 1 — LOGIN
## ════════════════════════════════

Full-screen navy background (#1E3A5F) with a faint repeating diagonal line texture.
Centered white card (420px wide, 520px tall, 16px radius, large shadow).

Inside the card (top to bottom):
  1. AlugEasy logo: rooftop chevron icon (gray) + "ALUGUEASY" bold navy text — centered
  2. Heading: "Acesso da Equipe" — 22px bold navy
  3. Subtext: "Plataforma interna · Acesso restrito" — 13px muted gray
  4. Email field with envelope icon prefix
  5. Password field with lock icon, show/hide toggle on right
  6. "Entrar" button — full width, navy bg, white text, 10px radius
  7. Muted footer: "Apenas Arthur, Yasmim, Alexandre e Nikolas têm acesso."

---

## ════════════════════════════════
## SCREEN 2 — DASHBOARD (Home)
## ════════════════════════════════

LAYOUT: Fixed left sidebar (240px) + top header (64px) + scrollable main content.

── LEFT SIDEBAR (navy #1E3A5F) ──
  Top: AlugEasy logo (white version) with version tag "v1.0"
  
  Navigation sections:
  
  [SEÇÃO PRINCIPAL]
    🏠 Início               (active state: white text + 3px left accent bar in light blue)
    📋 Minhas Tarefas
    📅 Cronograma
    🔔 Notificações         (badge with unread count)
  
  [WORKSPACES]
    📁 Operacional
    💻 Desenvolvimento
    💰 Financeiro
    + Novo Grupo
  
  [VISTAS]
    ⊞  Board (Kanban)
    ☰  Tabela
    🗓  Calendário
    📊  Gráfico de Gantt
    📈  Relatórios
  
  Bottom (pinned):
    User avatar circle (color per person) + full name + role tag "Equipe AlugEasy"
    ⚙️ Configurações
    ↩  Sair

── TOP HEADER (white, 64px, border-bottom 1px #E5E7EB) ──
  Left:  "Início" page title (20px bold) + breadcrumb "AlugEasy / Início"
  Right: 🔍 Search icon | 🔔 Bell (badge) | Avatar circle + chevron dropdown

── MAIN CONTENT (#F4F6F9) ──

  A) WELCOME BANNER (full-width card, navy-to-navy-light gradient, white text, 20px radius):
     Left side:
       "Bem-vindo(a), Arthur! 👋"  — 32px bold
       "Você tem 3 tarefas pendentes e 1 prazo vencendo hoje."  — 15px
       Two action buttons: "Ver Minhas Tarefas" (white outline) | "Nova Tarefa" (white filled)
     Right side: Large decorative rooftop chevron in semi-transparent white (opacity 10%)

  B) STATS ROW — 4 cards in a grid (white, 12px radius, subtle shadow):
     ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
     │ 📋 Total        │ │ 🔄 Em Andamento │ │ ✅ Concluídas   │ │ 🔥 Alta Prior.  │
     │  18  tarefas    │ │  7   tarefas    │ │  8   tarefas    │ │  3   tarefas    │
     │ +2 esta semana  │ │ ━━━━━━━ 39%     │ │ ━━━━━━━━━ 44%   │ │ 1 crítica ⚠️   │
     └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
     Each card has: icon top-left, metric number (28px bold), label, progress bar or sub-info.
     Colors: blue accent | amber | green | red

  C) TWO-COLUMN ROW below stats:
     LEFT (60%): "Tarefas Recentes" — mini table with 5 last tasks (name, status pill, assignee avatar)
     RIGHT (40%): "Distribuição por Responsável" — donut chart with 4 colored segments + legend

  D) ACTIVITY FEED (full-width card):
     Title: "Atividade Recente"
     List of timeline entries with avatar + action description + timestamp:
     Example: [A] Arthur mudou status de "Configurar CI/CD" para ✅ Concluído · 2h atrás
     Example: [Y] Yasmim adicionou tarefa "Revisar contratos Q3" · 5h atrás

---

## ════════════════════════════════
## SCREEN 3 — TASK BOARD (Vista Tabela — Monday style)
## ════════════════════════════════

This is the CORE screen. Full Monday.com table parity.

── PAGE HEADER ──
  Breadcrumb: AlugEasy / Tarefas
  Title: "Gestão de Tarefas" (24px bold)
  
  TOOLBAR (flex row, space-between):
    Left cluster:
      [🔍 Buscar tarefas...] input (240px)
      [👤 Responsável ▾] filter dropdown  ← shows checkboxes for each of 4 members
      [🏷 Status ▾] filter dropdown
      [📅 Prazo ▾] filter dropdown
      [↑↓ Ordenar ▾] dropdown
      [⚙ Agrupar por ▾] dropdown (Group by: Responsável / Status / Prioridade / Prazo)
    
    Right cluster:
      [⊞ Kanban] [☰ Tabela] [🗓 Calendário] view toggle buttons (segmented control)
      [+ Nova Tarefa] navy filled button with plus icon

── COLUMN HEADER ROW (sticky top, light gray bg) ──
  Columns with resize handles between them:
  
  [ ☐ ] │ Tarefa ↕        │ Responsável    │ Status         │ Prioridade     │ Prazo      │ Tags     │ Notas │ ⋯
  
  Each column header has:
  - Sort arrow (↕ toggles asc/desc on click)
  - Resize handle on right edge (drag cursor)
  - Right-click context menu: "Ocultar coluna", "Fixar coluna", "Renomear"
  - At far right: [+] "Adicionar coluna" button

── TASK GROUPS (3 sections, each collapsible) ──

  Each group has a GROUP HEADER BAR:
  ▼  📋 OPERACIONAL  ·  6 tarefas       [+ Adicionar Tarefa]   [...] menu
     └ Left accent strip: blue (#4A9EDB)

  ▼  💻 DESENVOLVIMENTO  ·  7 tarefas   [+ Adicionar Tarefa]   [...] menu
     └ Left accent strip: purple (#8B5CF6)

  ▼  💰 FINANCEIRO  ·  5 tarefas        [+ Adicionar Tarefa]   [...] menu
     └ Left accent strip: green (#10B981)

── TASK ROWS (inside each group) ──

  Each row layout:
  
  [ ☐ ] │ [⋮⋮ drag] Task name (editable inline on click) │ [Avatar + name dropdown] │ [Status pill ▾] │ [Priority dot + label ▾] │ [📅 date picker] │ [tag chips] │ [💬 0] │ [⋯]

  ROW INTERACTIONS:
  - Hover state: very light blue tint (#EFF6FF) + show drag handle + show action icons
  - Click on task name: opens inline text edit OR slide-out detail panel (right drawer)
  - Row checkbox: select for bulk actions
  - Drag handle (⋮⋮) left side: drag-and-drop to reorder within group OR move between groups
  - Right-click anywhere on row: context menu with:
      ✏️ Editar   |   📋 Duplicar   |   🔀 Mover para grupo   |   🔗 Copiar link   |   🗑 Excluir

  STATUS PILLS (inline dropdown on click):
    ○ Pendente      — gray pill   (#9CA3AF bg)
    ◑ Em Andamento  — blue pill   (#3B82F6 bg)
    ◔ Revisão       — amber pill  (#F59E0B bg)
    ● Concluído     — green pill  (#22C55E bg)
    Clicking pill opens a small popover with the 4 options to select.

  PRIORITY INDICATORS (inline dropdown on click):
    🟢 Baixa     — green  (#22C55E)
    🔵 Média     — blue   (#3B82F6)
    🟠 Alta      — orange (#F97316)
    🔴 Crítica   — red    (#EF4444) + subtle pulsing animation on the dot

  RESPONSÁVEL (inline dropdown on click):
    Shows avatar circle + name for each of the 4 team members.
    Multi-assign option: can select more than one person (shows stacked avatars +N).

  PRAZO (date field):
    Normal: "15 Jul" with small calendar icon
    Vencendo hoje: amber background highlight
    Vencido: red text + "⚠ Atrasado" label

  TAGS (chip field):
    User can add/remove freeform tags. Chips have light bg + close (×) icon.

  NOTAS icon (💬): shows comment count badge. Click opens comment thread in right panel.

  ROW FOOTER (inside each group, last row):
    "+ Adicionar tarefa" — dashed border row, full width, clicking adds a new empty row inline

── BULK ACTION BAR (appears when rows are selected, floating bottom bar) ──
  "3 tarefas selecionadas"
  Actions: [Mudar Status ▾] [Mudar Responsável ▾] [Mover para ▾] [🗑 Excluir] [✕ Cancelar]

── COLUMN SUMMARY ROW (below each group) ──
  Below each column, show aggregate:
  - Tarefa column: count "6 tarefas"
  - Status column: mini stacked bar showing proportion of each status
  - Prioridade: count of critical items
  - Prazo: "2 vencendo esta semana"

---

## ════════════════════════════════
## SCREEN 4 — VISTA KANBAN
## ════════════════════════════════

Same sidebar + header. Content area shows Kanban board.

4 columns (one per status), horizontally scrollable:
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  ○ Pendente  │  │ ◑ Em Andamento│  │  ◔ Revisão   │  │  ● Concluído │
  │  (5 cards)   │  │  (4 cards)   │  │  (3 cards)   │  │  (6 cards)   │
  │              │  │              │  │              │  │              │
  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
  │ │Task name │ │  │ │Task name │ │  │ │Task name │ │  │ │Task name │ │
  │ │[A] Baixa │ │  │ │[Y] Alta  │ │  │ │[N] Média │ │  │ │[A] Baixa │ │
  │ │15 Jul 💬2│ │  │ │20 Jul    │ │  │ │Hoje ⚠️   │ │  │ │✓ 10 Jul  │ │
  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │
  │ + Add card   │  │ + Add card   │  │ + Add card   │  │              │
  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

Card features:
  - White card, 12px radius, shadow, hover: lift + deeper shadow
  - Group tag chip (colored per group: Operacional/Desenvolvimento/Financeiro)
  - Task title (14px bold)
  - Assignee avatar(s) + priority dot (bottom left)
  - Due date + comment count (bottom right)
  - Drag-and-drop between columns changes status automatically
  - Click card: opens right-side detail drawer

---

## ════════════════════════════════
## SCREEN 5 — VISTA CALENDÁRIO
## ════════════════════════════════

Same sidebar + header.
Full monthly calendar grid (7 columns × 5-6 rows).
  - Day cells: white bg, task pills inside showing task name + colored status dot
  - Today: navy border around cell
  - Tasks appear as colored horizontal bars (like Google Calendar)
  - Color = group color (blue/purple/green)
  - Overflow: "+2 mais" link to expand
  - Top: month navigation (◀ Abril 2025 ▶) + toggle (Mês / Semana / Dia)

---

## ════════════════════════════════
## SCREEN 6 — TASK DETAIL PANEL (Right Drawer)
## ════════════════════════════════

Slides in from the right (480px wide) over the main content (backdrop dims slightly).
Does NOT navigate away — overlay drawer.

Panel structure (top to bottom):

  HEADER:
    [×] close button (top right)
    Breadcrumb: Operacional › Tarefa
    Task title (editable h1, 20px bold, click to edit inline)
    Status pill (clickable) + Priority indicator (clickable)

  METADATA GRID (2-column grid of labeled fields):
    Responsável:  [Avatar chips, multi-select]
    Prazo:        [Date picker]
    Grupo:        [Dropdown: Operacional / Desenvolvimento / Financeiro]
    Tags:         [Tag chip input]
    Criado por:   [Avatar + name] · [date]
    Atualizado:   [relative time]

  DESCRIPTION:
    Rich text area: bold, italic, bullet list, checklist formatting
    Placeholder: "Adicione uma descrição detalhada..."

  SUBTAREFAS section:
    Title "Subtarefas" + [+ Adicionar] button
    Checklist-style items:
      [ ] Subtask name  ·  [assignee avatar]  ·  [date]
      [×] Completed subtask (strikethrough)
    Progress bar showing X/N subtarefas concluídas

  ANEXOS section:
    [📎 Adicionar Arquivo] drop zone
    List of uploaded files: icon + filename + size + delete button

  ATIVIDADE / COMENTÁRIOS section (tabs):
    Tab 1 — "Atividade": timeline of all changes with avatar + description + timestamp
    Tab 2 — "Comentários":
      Thread of comments with avatar, name, text, timestamp
      Reply button on hover
      Bottom: comment input box with avatar + "Adicionar comentário..." placeholder + Send button

  BOTTOM ACTION BAR (sticky):
    [🗑 Excluir Tarefa]  |  [📋 Duplicar]  |  [✓ Marcar Concluída]

---

## ════════════════════════════════
## SCREEN 7 — MODAL NOVA / EDITAR TAREFA
## ════════════════════════════════

Center modal overlay (560px wide, backdrop blur).

  Header: "Nova Tarefa" title + [×] close
  
  Form fields:
    Título *           [text input, full width]
    Descrição          [textarea, 3 rows, rich text mini-toolbar]
    Grupo *            [segmented: Operacional | Desenvolvimento | Financeiro]
    Responsável *      [multi-avatar selector showing 4 team members as clickable chips]
    Status             [pill selector: 4 options in a row]
    Prioridade         [pill selector: 4 options in a row with color dots]
    Prazo              [date picker with calendar popup]
    Tags               [free-form tag input]
    Subtarefas         [+ Add subtask inline list]

  Footer:
    [Cancelar] ghost button  +  [Criar Tarefa] navy filled button

---

## ════════════════════════════════
## SCREEN 8 — NOTIFICAÇÕES PANEL
## ════════════════════════════════

Dropdown panel from bell icon (360px wide, 500px tall, card with shadow).

  Header: "Notificações" + "Marcar todas como lidas" link

  Notification items (list):
    Each item: [avatar] + action description + task name (bold, clickable) + timestamp
    Unread: light blue left border + light bg tint
    Read: plain white

  Types of notifications:
    👤 "Yasmim te atribuiu em 'Revisar contratos Q3'"
    💬 "Alexandre comentou em 'Deploy produção'"
    ⏰ "Prazo vencendo amanhã: 'Relatório financeiro'"
    ✅ "Nikolas concluiu 'Setup banco de dados'"
    🔀 "Arthur moveu 'Reunião cliente' para Em Andamento"

  Footer: "Ver todas as notificações" full-width link

---

## ════════════════════════════════
## SCREEN 9 — PERFIL / CONFIGURAÇÕES
## ════════════════════════════════

  MINHA CONTA:
    Large avatar circle (with initials, color per user) + [Trocar foto]
    Name field, Email field (read-only)
    [Salvar Alterações] button

  NOTIFICAÇÕES:
    Toggle rows:
      [ ✓ ] Quando forem atribuídas tarefas a mim
      [ ✓ ] Quando comentarem nas minhas tarefas
      [ ✓ ] Prazo vencendo em 24h
      [   ] Resumo semanal por email

  APARÊNCIA:
    Theme toggle: ☀ Claro | 🌙 Escuro (with live preview thumbnail)

  EQUIPE (read-only list of 4 members with avatars + names)

---

## ════════════════════════════════
## DESIGN SYSTEM TOKENS
## ════════════════════════════════

COLORS:
  --brand-navy:        #1E3A5F   ← primary brand
  --brand-navy-light:  #2A4F7C   ← hover states
  --brand-silver:      #A8B4C0   ← secondary elements
  --accent-blue:       #4A9EDB   ← links, active states
  --bg-page:           #F4F6F9   ← page background
  --bg-card:           #FFFFFF   ← card background
  --border:            #E5E7EB   ← dividers
  --text-primary:      #111827   ← headings
  --text-secondary:    #6B7280   ← labels, captions
  --text-muted:        #9CA3AF   ← placeholder, disabled

STATUS COLORS:
  --status-pending:    #9CA3AF   (gray)
  --status-progress:   #3B82F6   (blue)
  --status-review:     #F59E0B   (amber)
  --status-done:       #22C55E   (green)

PRIORITY COLORS:
  --priority-low:      #22C55E   (green)
  --priority-medium:   #3B82F6   (blue)
  --priority-high:     #F97316   (orange)
  --priority-critical: #EF4444   (red) + pulse animation

GROUP ACCENT COLORS:
  --group-operacional:    #4A9EDB   (blue)
  --group-desenvolvimento:#8B5CF6   (purple)
  --group-financeiro:     #10B981   (green)

MEMBER AVATAR COLORS:
  --arthur:    #4A9EDB
  --yasmim:    #F472B6
  --alexandre: #34D399
  --nikolas:   #F59E0B

TYPOGRAPHY:
  Display headings:  "Plus Jakarta Sans" Bold / ExtraBold
  Body text:         "DM Sans" Regular / Medium
  Monospace:         "JetBrains Mono" (dates, IDs, codes)

SPACING (8px base grid):
  4px  → micro gaps (icon to text)
  8px  → tight (within components)
  16px → default (between elements)
  24px → medium (section padding)
  32px → large (between sections)
  48px → xlarge (page sections)

BORDER RADIUS:
  4px  → tags, small chips
  8px  → inputs, buttons, small cards
  12px → standard cards
  16px → large cards, modals
  20px → welcome banner
  9999px → pill badges

SHADOWS:
  card:   0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)
  modal:  0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)
  drawer: -4px 0 24px rgba(0,0,0,0.12)
  hover:  0 4px 16px rgba(0,0,0,0.12)

ANIMATIONS:
  Default transition: all 150ms ease
  Modal enter: scale(0.96) → scale(1) + fade in, 200ms ease-out
  Drawer enter: translateX(100%) → translateX(0), 250ms ease-out
  Kanban card drag: scale(1.03) + shadow increase + slight rotation (1deg)
  Priority critical pulse: 0→1→0 opacity on dot, 2s infinite
  Status change: pill color morphs with 200ms transition
  Row hover: background color transition 100ms

---

## INTERACTIVE BEHAVIORS TO ANNOTATE

1. INLINE EDITING: Click any table cell → activates edit mode with input/dropdown
2. DRAG & DROP: 
   - Table rows: drag handle on left, reorder within group or move to another group
   - Kanban cards: drag between status columns
   - Ghost preview shown during drag
3. COLUMN RESIZE: Drag right edge of column header
4. COLUMN REORDER: Drag column header to new position
5. GROUP COLLAPSE: Click ▼ arrow to collapse/expand entire group
6. BULK SELECT: Click row checkbox → bulk action bar appears at bottom
7. RIGHT-CLICK CONTEXT MENU: On any row, shows quick action menu
8. KEYBOARD SHORTCUTS (annotate):
   N = Nova tarefa  |  / = Buscar  |  F = Filtros  |  Esc = Fechar modal

---

Primary viewport: 1440px desktop.
Secondary: 1280px laptop (sidebar collapses to icons only at <1100px).
Style direction: Professional SaaS, clean and data-dense like Linear + Monday.com,
with AlugEasy's navy/silver brand identity applied consistently throughout.