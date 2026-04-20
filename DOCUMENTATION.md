# Documentação do Projeto AlugEasy - Sistema de Gestão de Tarefas

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Projeto](#arquitetura-do-projeto)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Componentes Desenvolvidos](#componentes-desenvolvidos)
5. [Sistema de Temas](#sistema-de-temas)
6. [Comunicação entre Componentes](#comunicação-entre-componentes)
7. [Melhorias e Próximos Passos](#melhorias-e-próximos-passos)

---

## 🎯 Visão Geral

**AlugEasy** é uma plataforma moderna de gestão de tarefas e projetos desenvolvida com React, TypeScript e Tailwind CSS v4. O sistema foi projetado para equipes de 4 membros (Arthur, Yasmim, Alexandre e Nikolas) e oferece múltiplas visualizações de tarefas inspiradas em ferramentas como Monday.com.

### Tecnologias Utilizadas
- **React 18.3.1** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **Vite 6.3.5** - Build tool
- **Recharts 2.15.2** - Gráficos e visualizações
- **Lucide React** - Ícones
- **Sonner** - Sistema de notificações toast
- **Motion (Framer Motion)** - Animações
- **Radix UI** - Componentes acessíveis

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Diretórios
```
src/
├── app/
│   ├── App.tsx                 # Componente raiz da aplicação
│   └── components/             # Todos os componentes React
├── styles/
│   ├── theme.css              # Variáveis CSS e tema (light/dark)
│   └── fonts.css              # Importações de fontes
└── imports/                    # Assets importados (imagens, SVGs)
```

### Fluxo de Dados
- **Estado Local**: React useState para gerenciamento de estado de componentes
- **Comunicação**: Sistema baseado em eventos customizados (CustomEvent API)
- **Persistência**: localStorage para preferências do usuário (tema)

---

## ✅ Funcionalidades Implementadas

### 1. Sistema de Autenticação
- **Arquivo**: `LoginScreen.tsx`
- **Funcionalidades**:
  - Login com email e senha
  - Validação de credenciais
  - 4 usuários pré-cadastrados
  - Feedback visual de erros
  - Toggle de visualização de senha

### 2. Dashboard Principal
- **Arquivo**: `Dashboard.tsx`
- **Funcionalidades**:
  - Visão geral personalizada por usuário
  - Cards de estatísticas (Tarefas Totais, Em Andamento, Concluídas, Pendentes)
  - Lista de tarefas recentes
  - Atalhos rápidos para ações comuns
  - Notificações e atividades recentes

### 3. Gestão de Tarefas

#### 3.1 Cronograma (Tabela Completa - Edição Total)
- **Arquivo**: `TaskTable.tsx`
- **Funcionalidades**:
  - Visualização em tabela similar ao Monday.com
  - **Filtros avançados**: por responsável, status e data
  - **Busca** em tempo real
  - **Agrupamento** de tarefas (Operacional, Desenvolvimento, Financeiro)
  - **Ações em massa**: deletar, alterar status, alterar prioridade
  - **Expansão/colapso** de grupos
  - Click em tarefa abre painel de detalhes
  - Indicadores visuais de prioridade e status
  - Contagem de comentários por tarefa

#### 3.2 Workspaces (Visualização Read-Only)
- **Arquivo**: `TaskTableReadOnly.tsx`
- **Funcionalidades**:
  - Visualização somente leitura de tarefas
  - Apenas busca (sem filtros ou edição)
  - Mensagem orientando para usar "Cronograma" para editar
  - Ícone de "olho" indicando modo visualização
  - Click em tarefa abre painel de detalhes

#### 3.3 Painel de Detalhes da Tarefa
- **Arquivo**: `TaskDetailPanel.tsx`
- **Funcionalidades**:
  - **Edição inline** de título
  - **Seleção de responsável** com avatares
  - **Alteração de data** com date picker
  - **Alteração de grupo** (Operacional, Desenvolvimento, Financeiro)
  - **Gerenciamento de tags**: adicionar, remover
  - **Upload de arquivos** (simulado)
  - **Sistema de subtarefas**: criar, marcar como concluído
  - **Sistema de comentários**: adicionar, responder
  - **Histórico de atividades**
  - Botão de deletar tarefa

### 4. Visualizações Alternativas

#### 4.1 Board Kanban
- **Arquivo**: `KanbanBoard.tsx`
- **Funcionalidades**:
  - 4 colunas: Pendente, Em Andamento, Revisão, Concluído
  - Cards de tarefas com informações completas
  - Indicadores de prioridade coloridos
  - Contagem de tarefas por coluna
  - Design visual atrativo

#### 4.2 Calendário
- **Arquivo**: `CalendarView.tsx`
- **Funcionalidades**:
  - **Visualização mensal** com navegação
  - **Click em qualquer data**: abre modal para criar tarefa com data pré-preenchida
  - Exibição de tarefas nas datas correspondentes
  - Destaque do dia atual
  - Indicador de múltiplas tarefas em um dia
  - Navegação entre meses
  - Botão "Hoje" para retornar à data atual
  - **Suporte ao tema dark/light**

#### 4.3 Gráfico de Gantt
- **Arquivo**: `GanttView.tsx`
- **Funcionalidades**:
  - Visualização timeline de tarefas
  - Barras horizontais por tarefa
  - Agrupamento por categoria
  - Indicadores de progresso
  - Identificação visual de responsáveis

#### 4.4 Relatórios e Análises
- **Arquivo**: `ReportsView.tsx`
- **Funcionalidades**:
  - **4 Cards de métricas principais**:
    - Total de Tarefas
    - Taxa de Conclusão
    - Média por Membro
    - Tarefas Críticas
  - **Gráfico de Pizza**: Distribuição por status
  - **Gráfico de Barras**: Desempenho por membro
  - **Gráfico de Linhas**: Evolução semanal
  - Suporte ao tema dark/light
  - Cores consistentes e acessíveis

### 5. Minhas Tarefas
- **Arquivo**: `MyTasks.tsx`
- **Funcionalidades**:
  - Visualização filtrada das tarefas do usuário logado
  - Separação por status (Em Andamento, Pendentes)
  - Marcação de conclusão rápida
  - Estatísticas personalizadas
  - Atalho para criar nova tarefa

### 6. Sistema de Workspaces Customizados
- **Arquivo**: `NewWorkspaceModal.tsx`
- **Funcionalidades**:
  - **Criação de workspaces personalizados**
  - Escolha de nome e descrição
  - **12 ícones disponíveis**: folder, briefcase, users, star, code, target, zap, heart, trending, package, settings, dollar
  - **Seletor de cores** com 12 opções
  - Workspaces aparecem na sidebar
  - **Menu de contexto** (click direito):
    - Editar
    - Duplicar
    - Excluir
  - Design personalizado para cada workspace

### 7. Notificações
- **Arquivo**: `NotificationsPanel.tsx`
- **Funcionalidades**:
  - Lista de notificações recentes
  - Diferentes tipos: menções, atribuições, comentários
  - Indicador de não lidas
  - Marcar como lido
  - Timestamps relativos
  - Badges no sidebar (contador)

### 8. Configurações
- **Arquivo**: `SettingsScreen.tsx`
- **Funcionalidades**:
  - **Perfil do Usuário**:
    - Avatar
    - Nome, email, cargo
    - Edição de informações
  - **Aparência**:
    - **Toggle Dark/Light Mode** funcional
    - Prévia visual dos temas
  - **Idioma e Região**:
    - Seleção de idioma
    - Formato de data
    - Fuso horário
  - **Preferências de Notificação**:
    - Email, Push, Desktop
    - Granularidade de notificações
  - **Segurança**:
    - Alteração de senha
    - Autenticação 2FA
  - **Zona de Perigo**:
    - Excluir conta

### 9. Busca Global
- **Arquivo**: `SearchModal.tsx`
- **Funcionalidades**:
  - Atalho de teclado: `Cmd/Ctrl + K`
  - Busca em tempo real
  - Filtragem por tipo (Tarefas, Pessoas, Arquivos)
  - Resultados agrupados
  - Navegação por teclado

### 10. Criação de Tarefas
- **Arquivo**: `NewTaskModal.tsx`
- **Funcionalidades**:
  - **Formulário completo**:
    - Título (obrigatório)
    - Descrição
    - Grupo (obrigatório) - 3 opções
    - Responsável (obrigatório) - 4 membros
    - Status - 4 opções
    - Prioridade - 4 níveis
    - Prazo (date picker)
    - Tags (separadas por vírgula)
  - **Suporte a data inicial**: quando clicado no calendário, prazo vem pré-preenchido
  - Validação de campos obrigatórios
  - Feedback visual (toast notification)
  - Suporte ao tema dark/light

---

## 🧩 Componentes Desenvolvidos

### Componentes de UI Base

#### `AlugEasyLogo.tsx`
- Logo da aplicação
- Variantes: light (fundo escuro) e dark (fundo claro)
- Opcional: exibição de versão

#### `TeamAvatar.tsx`
- Avatares dos membros da equipe
- 3 tamanhos: sm, md, lg
- Opcional: exibição do nome
- Cores únicas por membro

#### `StatusPill.tsx`
- Pills coloridos para status de tarefas
- 4 estados: Pendente, Em Andamento, Revisão, Concluído
- Cores consistentes em toda aplicação

#### `PriorityIndicator.tsx`
- Indicador visual de prioridade
- 4 níveis com cores distintas
- Ícone de flag

#### `Header.tsx`
- Header global da aplicação
- Exibe título da view atual
- Avatar do usuário logado
- Badge de notificações
- Botão de busca global

#### `Sidebar.tsx`
- Navegação principal
- Seções: Principal, Workspaces, Vistas
- Indicador de view ativa
- Suporte a workspaces customizados
- Menu contextual
- Botão de logout
- Informações do usuário

#### `WorkspaceContextMenu.tsx`
- Menu de contexto para workspaces
- Opções: Editar, Duplicar, Excluir
- Posicionamento dinâmico

---

## 🎨 Sistema de Temas

### Implementação
O sistema de temas utiliza **CSS Variables** definidas em `theme.css`:

```css
/* Light Mode (padrão) */
--background: #F3F4F6;
--foreground: #111827;
--card: #FFFFFF;
--muted: #F9FAFB;
--border: #E5E7EB;
...

/* Dark Mode */
.dark {
  --background: #0f1419;
  --foreground: #e5e7eb;
  --card: #1a1f2e;
  --muted: #252b3b;
  --border: #2d3548;
  ...
}
```

### Funcionalidades
- **Toggle funcional** em `SettingsScreen`
- **Persistência** via localStorage
- **Transições suaves** entre temas
- **Aplicação global** via `document.documentElement.classList`
- **Suporte em todos os componentes** usando classes utilitárias:
  - `bg-background`, `bg-card`, `bg-muted`
  - `text-foreground`, `text-muted-foreground`
  - `border-border`

### Componentes Otimizados para Temas
- Dashboard
- CalendarView
- ReportsView
- TaskTable / TaskTableReadOnly
- KanbanBoard
- GanttView
- MyTasks
- NotificationsPanel
- SettingsScreen
- NewTaskModal
- TaskDetailPanel

---

## 🔄 Comunicação entre Componentes

O projeto utiliza **Custom Events** para comunicação entre componentes:

### Eventos Implementados

```typescript
// Navegação
window.dispatchEvent(new CustomEvent('changeView', { detail: 'view-name' }))

// Modais
window.dispatchEvent(new CustomEvent('openNewTask'))
window.dispatchEvent(new CustomEvent('openNewTaskWithDate', { detail: '2026-07-20' }))
window.dispatchEvent(new CustomEvent('openNewWorkspace'))
window.dispatchEvent(new CustomEvent('openSearch'))
window.dispatchEvent(new CustomEvent('openTaskDetail', { detail: taskObject }))

// Notificações
window.dispatchEvent(new CustomEvent('showToast', { 
  detail: { type: 'success', message: 'Mensagem' } 
}))

// Workspaces
window.dispatchEvent(new CustomEvent('duplicateWorkspace', { detail: workspace }))

// Tema
window.dispatchEvent(new CustomEvent('changeTheme', { detail: 'dark' | 'light' }))
```

### Atalhos de Teclado
- `Cmd/Ctrl + K`: Abre busca global
- `Escape`: Fecha modais e painéis

---

## 🚀 Melhorias e Próximos Passos

### 🔴 Crítico (Funcionalidade Essencial)

#### 1. Backend e Persistência de Dados
**Status**: Não implementado
**Prioridade**: Alta

**O que fazer**:
- Implementar backend com Node.js/Express ou Next.js API Routes
- Integrar banco de dados (PostgreSQL, MongoDB ou Supabase)
- Criar endpoints REST ou GraphQL para:
  - Autenticação (JWT)
  - CRUD de tarefas
  - CRUD de workspaces
  - Notificações
  - Comentários e anexos
- Substituir dados mockados por chamadas reais à API

**Impacto**:
- ❌ Atualmente, todos os dados são perdidos ao recarregar a página
- ✅ Com backend: dados persistentes e sincronizados entre usuários

#### 2. Drag & Drop no Kanban
**Status**: UI implementada, funcionalidade não
**Prioridade**: Alta

**O que fazer**:
- Integrar biblioteca `react-dnd` (já instalada)
- Implementar lógica de arrastar tarefas entre colunas
- Atualizar status da tarefa automaticamente
- Feedback visual durante drag
- Persistir mudanças no backend

**Bibliotecas disponíveis**:
```typescript
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
```

#### 3. Drag & Drop no Gantt
**Status**: Não implementado
**Prioridade**: Média

**O que fazer**:
- Permitir redimensionar barras para alterar duração
- Arrastar barras para alterar datas
- Criar dependências entre tarefas
- Atualizar timeline automaticamente

#### 4. Edição de Workspaces
**Status**: Menu existe, mas opção "Editar" não funciona
**Prioridade**: Média

**O que fazer**:
- Criar modal de edição similar ao `NewWorkspaceModal`
- Permitir alterar nome, descrição, cor e ícone
- Atualizar workspace no estado e backend
- Validação de campos

### 🟡 Importante (UX e Performance)

#### 5. Filtros no Calendário
**Status**: Não implementado
**Prioridade**: Média

**O que fazer**:
- Adicionar filtros por grupo
- Filtrar por responsável
- Filtrar por status
- Legendas de cores
- Toggle de visualização (mês/semana/dia)

#### 6. Exportação de Relatórios
**Status**: Apenas visualização
**Prioridade**: Média

**O que fazer**:
- Botão de exportar para PDF
- Exportar para Excel/CSV
- Compartilhar relatório por link
- Agendar relatórios automáticos
- Filtros de período personalizados

#### 7. Sistema de Permissões
**Status**: Não implementado
**Prioridade**: Média

**O que fazer**:
- Definir roles: Admin, Manager, Member, Viewer
- Controle de acesso por workspace
- Permissões granulares (criar, editar, deletar, visualizar)
- UI de gerenciamento de permissões nas configurações

#### 8. Anexos Reais
**Status**: Upload simulado
**Prioridade**: Média

**O que fazer**:
- Integrar serviço de storage (AWS S3, Cloudinary, Supabase Storage)
- Upload real de arquivos
- Preview de imagens
- Download de arquivos
- Limite de tamanho e validação de tipo

#### 9. Notificações em Tempo Real
**Status**: Estático
**Prioridade**: Média

**O que fazer**:
- Implementar WebSockets ou Server-Sent Events
- Notificações push no navegador
- Integração com Firebase Cloud Messaging
- Sons de notificação (opcional)
- Agrupamento inteligente

#### 10. Busca Avançada
**Status**: Busca básica implementada
**Prioridade**: Baixa

**O que fazer**:
- Busca por conteúdo dentro de comentários
- Busca em anexos
- Filtros combinados (responsável + status + data)
- Sugestões de busca (autocomplete)
- Histórico de buscas
- Busca com operadores (AND, OR, NOT)

### 🟢 Desejável (Nice to Have)

#### 11. Integração com Calendários Externos
**Status**: Não implementado
**Prioridade**: Baixa

**O que fazer**:
- Sincronizar com Google Calendar
- Sincronizar com Outlook
- Exportar para .ics
- Importar tarefas de calendários externos

#### 12. Modo Offline
**Status**: Não implementado
**Prioridade**: Baixa

**O que fazer**:
- Service Worker
- Cache de dados
- Queue de sincronização
- Indicador de status de conexão
- Resolução de conflitos

#### 13. Comentários com Markdown
**Status**: Texto puro apenas
**Prioridade**: Baixa

**O que fazer**:
- Suporte a Markdown nos comentários
- Preview ao digitar
- Syntax highlighting para código
- Menções com @ (autocompletar nomes)
- Emojis

#### 14. Templates de Tarefas
**Status**: Não implementado
**Prioridade**: Baixa

**O que fazer**:
- Criar templates reutilizáveis
- Templates com subtarefas pré-definidas
- Aplicar template ao criar tarefa
- Biblioteca de templates

#### 15. Automações
**Status**: Não implementado
**Prioridade**: Baixa

**O que fazer**:
- Regras tipo "quando status muda para X, fazer Y"
- Atribuição automática baseada em regras
- Lembretes automáticos
- Escalonamento de tarefas atrasadas
- Integração com Zapier/Make

#### 16. Dashboard Personalizável
**Status**: Dashboard fixo
**Prioridade**: Baixa

**O que fazer**:
- Widgets arrastavéis
- Escolher quais métricas exibir
- Layouts salvos por usuário
- Widgets de terceiros

#### 17. Modo Foco / Pomodoro
**Status**: Não implementado
**Prioridade**: Baixa

**O que fazer**:
- Timer integrado
- Bloqueio de distrações
- Estatísticas de tempo trabalhado
- Integração com tarefas

#### 18. Colaboração em Tempo Real
**Status**: Não implementado
**Prioridade**: Baixa

**O que fazer**:
- Ver quem está visualizando uma tarefa
- Cursores colaborativos
- Indicador "Fulano está digitando..."
- Edição simultânea

#### 19. Histórico de Versões
**Status**: Não implementado
**Prioridade**: Baixa

**O que fazer**:
- Rastrear todas as mudanças
- Ver quem fez o quê e quando
- Reverter para versões anteriores
- Diff visual de mudanças

#### 20. Mobile App
**Status**: Web apenas (não responsivo completo)
**Prioridade**: Baixa

**O que fazer**:
- React Native ou PWA
- Notificações push mobile
- Gestos touch (swipe, long-press)
- Otimização para telas pequenas

### 🐛 Bugs e Ajustes Conhecidos

#### 1. Responsividade
**Status**: Limitada
- Sidebar não colapsa em mobile
- Tabelas não scrollam horizontalmente em telas pequenas
- Modais podem ficar cortados em mobile

**Fix**: Adicionar breakpoints e layouts mobile-first

#### 2. Acessibilidade
**Status**: Básica
- Faltam labels ARIA em alguns componentes
- Navegação por teclado incompleta
- Contraste de cores não validado (WCAG)

**Fix**: 
- Audit com Lighthouse
- Implementar skip links
- Adicionar roles ARIA
- Testar com screen readers

#### 3. Performance
**Status**: Boa, mas otimizável
- Não há lazy loading de componentes
- Imagens não otimizadas
- Bundle size não analisado

**Fix**:
- React.lazy() para code splitting
- React.memo() em componentes pesados
- Virtualização de listas longas (react-window)
- Otimizar imagens (WebP, lazy loading)

#### 4. Validação de Formulários
**Status**: Básica
- Validação apenas com HTML5 required
- Sem mensagens de erro customizadas

**Fix**:
- Implementar `react-hook-form` (já instalado)
- Schema validation com Zod/Yup
- Mensagens de erro amigáveis

#### 5. Testes
**Status**: Não implementados
- Sem testes unitários
- Sem testes de integração
- Sem testes E2E

**Fix**:
- Configurar Vitest/Jest
- React Testing Library
- Playwright/Cypress para E2E
- Cobertura mínima de 70%

---

## 📊 Métricas do Projeto

### Componentes
- **Total**: 21 componentes React
- **Telas principais**: 10
- **Componentes reutilizáveis**: 11

### Linhas de Código (estimado)
- **Components**: ~3.500 linhas
- **Styles**: ~400 linhas
- **Total**: ~4.000 linhas

### Funcionalidades
- ✅ **Implementadas**: 75%
- 🚧 **Parciais**: 15%
- ❌ **Faltantes**: 10%

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- Node.js >= 18
- pnpm (recomendado) ou npm

### Instalação
```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
# (já está rodando automaticamente)
```

### Build para Produção
```bash
pnpm build
```

### Credenciais de Teste
- arthur@alugueasy.com / arthur123
- yasmim@alugueasy.com / yasmim123
- alexandre@alugueasy.com / alexandre123
- nikolas@alugueasy.com / nikolas123

---

## 📝 Notas Técnicas

### Decisões de Arquitetura

#### Por que Custom Events?
- Evita prop drilling
- Componentes desacoplados
- Fácil de implementar para MVP
- **Desvantagem**: Difícil de debugar, considerar Context API ou Zustand para produção

#### Por que Tailwind v4?
- Sistema de design tokens consistente
- Dark mode nativo
- Performance otimizada
- Desenvolvimento rápido

#### Por que não usar Redux/Zustand?
- Escopo MVP não justifica complexidade
- Custom Events suficientes para demo
- **Recomendação**: Migrar para gerenciamento de estado robusto antes de produção

### Padrões de Código

#### Nomenclatura
- Componentes: PascalCase (`TaskTable.tsx`)
- Funções: camelCase (`handleSubmit`)
- Eventos: kebab-case (`'open-new-task'`)
- CSS Variables: kebab-case (`--background`)

#### Estrutura de Componente
```typescript
// 1. Imports
import { useState } from 'react';

// 2. Types/Interfaces
interface Props { ... }

// 3. Constants
const STATUSES = [...];

// 4. Component
export function Component({ props }: Props) {
  // 4.1 State
  const [state, setState] = useState();
  
  // 4.2 Effects
  useEffect(() => {}, []);
  
  // 4.3 Handlers
  const handleAction = () => {};
  
  // 4.4 Render
  return (...);
}
```

---

## 🎓 Aprendizados e Boas Práticas

### O que funcionou bem
✅ Sistema de design tokens com CSS variables  
✅ Componentização clara e reutilizável  
✅ Uso de TypeScript para type safety  
✅ Separação entre views de leitura e escrita  
✅ UX inspirada em ferramentas modernas (Monday.com)  

### O que pode melhorar
⚠️ Gerenciamento de estado mais robusto  
⚠️ Testes automatizados  
⚠️ Documentação inline (JSDoc)  
⚠️ Acessibilidade (WCAG compliance)  
⚠️ Responsividade completa  
⚠️ Error boundaries  

---

## 📚 Recursos Adicionais

### Bibliotecas Importantes Já Instaladas
- `recharts` - Gráficos
- `lucide-react` - Ícones
- `sonner` - Toasts
- `react-hook-form` - Formulários
- `date-fns` - Manipulação de datas
- `motion` - Animações
- `react-dnd` - Drag & Drop
- `@radix-ui/*` - Componentes acessíveis

### Próximas Bibliotecas a Considerar
- `zustand` ou `jotai` - State management
- `zod` - Schema validation
- `@tanstack/react-query` - Server state
- `vitest` - Testing
- `playwright` - E2E testing

---

## 🤝 Contribuindo

### Prioridades de Desenvolvimento
1. **Backend e persistência** (bloqueador para produção)
2. **Drag & Drop no Kanban** (UX essencial)
3. **Sistema de permissões** (segurança)
4. **Notificações real-time** (engajamento)
5. **Responsividade** (acessibilidade)

### Convenções
- Commits semânticos: `feat:`, `fix:`, `docs:`, `refactor:`
- Branch naming: `feature/nome`, `bugfix/nome`
- PR reviews obrigatórios
- Testes em novas features

---

## 📄 Licença
Projeto interno - AlugEasy Team

---

**Última atualização**: 18 de Abril de 2026  
**Versão**: 0.0.1  
**Desenvolvido por**: Arthur, Yasmim, Alexandre, Nikolas
