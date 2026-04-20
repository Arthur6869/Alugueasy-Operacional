# Configuração do Supabase - AlugEasy

## O que foi feito

### 1. Arquivo `.env`
Criado o arquivo `.env` na raiz do projeto com as variáveis de ambiente necessárias:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY_AQUI
```

> **Importante**: Preencha com os dados reais do seu projeto no Supabase antes de rodar o sistema.

### 2. Cliente Supabase (`src/lib/supabase.ts`)
Criado o módulo central de acesso ao banco com:
- Instância do cliente Supabase (`supabase`)
- Tipagens TypeScript para todas as entidades (`Task`, `Workspace`, `Comment`, `Subtask`)
- Helpers organizados em `db.tasks`, `db.workspaces`, `db.comments`, `db.subtasks`

### 3. Dependência instalada
```bash
npm install @supabase/supabase-js
```

---

## Como configurar o Supabase

### Passo 1 — Criar o projeto
1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **New project**
3. Dê um nome (ex: `alugueasy`) e escolha uma senha forte para o banco
4. Aguarde a criação (~2 min)

### Passo 2 — Pegar as credenciais
1. No painel do projeto, vá em **Settings → API**
2. Copie:
   - **Project URL** → coloque em `VITE_SUPABASE_URL`
   - **anon public** (em Project API Keys) → coloque em `VITE_SUPABASE_ANON_KEY`

### Passo 3 — Criar as tabelas
Execute o SQL abaixo no **SQL Editor** do Supabase:

```sql
-- Tabela de tarefas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Em Andamento','Revisão','Concluído')),
  priority TEXT NOT NULL DEFAULT 'Média' CHECK (priority IN ('Baixa','Média','Alta','Crítica')),
  "group" TEXT NOT NULL CHECK ("group" IN ('Operacional','Desenvolvimento','Financeiro')),
  assignee TEXT NOT NULL CHECK (assignee IN ('Arthur','Yasmim','Alexandre','Nikolas')),
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de workspaces personalizados
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'folder',
  color TEXT NOT NULL DEFAULT '#4A9EDB',
  created_by TEXT NOT NULL CHECK (created_by IN ('Arthur','Yasmim','Alexandre','Nikolas')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de comentários
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('Arthur','Yasmim','Alexandre','Nikolas')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de subtarefas
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para uso interno (ajustar conforme autenticação for implementada)
CREATE POLICY "allow_all_tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_workspaces" ON workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_subtasks" ON subtasks FOR ALL USING (true) WITH CHECK (true);
```

### Passo 4 — Iniciar o projeto
```bash
npm run dev
```

---

## Como usar o cliente nos componentes

```typescript
import { db } from '../../lib/supabase';

// Buscar todas as tarefas
const { data: tasks, error } = await db.tasks.getAll();

// Criar uma tarefa
const { data: newTask } = await db.tasks.create({
  title: 'Minha tarefa',
  status: 'Pendente',
  priority: 'Alta',
  group: 'Operacional',
  assignee: 'Arthur',
});

// Atualizar status
await db.tasks.update(taskId, { status: 'Concluído' });

// Deletar
await db.tasks.delete(taskId);
```

---

## Próximos passos

- [ ] Migrar dados mockados do `TaskTable.tsx` para chamadas reais via `db.tasks`
- [ ] Migrar workspaces do estado local do `App.tsx` para `db.workspaces`
- [ ] Migrar comentários do `TaskDetailPanel.tsx` para `db.comments`
- [ ] Implementar autenticação real com `supabase.auth` (substituindo login hardcoded)
- [ ] Habilitar Realtime para sincronização entre usuários

---

**Data**: 18 de Abril de 2026
**Responsável**: Arthur
