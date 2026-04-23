# Alterações — Configurações do Sistema
**Data:** 2026-04-23  
**Arquivos modificados:** `SettingsScreen.tsx`, `TeamAvatar.tsx`

---

## 1. Upload de Foto de Perfil (NOVO)

**Arquivo:** `src/app/components/SettingsScreen.tsx`

- Botão "Trocar foto de perfil" agora abre o seletor de arquivo do sistema operacional
- Ícone de câmera aparece ao passar o mouse sobre o avatar
- A foto é convertida para base64 e salva no `localStorage` com a chave `profilePhoto_<NomeMembro>`
- Limite de tamanho: **2 MB** (validado antes de salvar)
- Botão "Remover foto" aparece quando há uma foto cadastrada
- A foto é atualizada instantaneamente em todo o sistema via evento `profilePhotoUpdated`

## 2. TeamAvatar com suporte a foto personalizada (NOVO)

**Arquivo:** `src/app/components/TeamAvatar.tsx`

- O componente agora lê o `localStorage` para verificar se há foto cadastrada para aquele membro
- Se houver foto, exibe a imagem (`<img>`) no lugar das iniciais coloridas
- Escuta o evento `profilePhotoUpdated` para atualizar a foto em tempo real sem recarregar a página
- Afeta **todos** os locais onde o TeamAvatar é usado: sidebar, header, lista de equipe, kanban, etc.

## 3. Formulário de Perfil — campos controlados (MELHORIA)

**Arquivo:** `src/app/components/SettingsScreen.tsx`

- Todos os campos agora são controlados com `useState`
- Dados salvos em `localStorage` com a chave `profileData_<NomeMembro>` (JSON)
- Campos salvos: `firstName`, `lastName`, `cargo`, `departamento`, `bio`
- Botão "Salvar Alterações" persiste os dados e exibe ícone ✓ de confirmação
- Botão "Cancelar" restaura os valores do último save

## 4. Alterar Senha — funcional com Supabase (NOVO)

**Arquivo:** `src/app/components/SettingsScreen.tsx`

- Seção expansível inline (sem modal separado)
- Campos com toggle show/hide da senha (ícone de olho)
- Validações em tempo real:
  - Mínimo 6 caracteres
  - Confirmação coincide com nova senha (feedback visual verde/vermelho)
- Chama `supabase.auth.updateUser({ password })` ao confirmar
- Exibe toast de sucesso ou mensagem de erro da API

## 5. Preferências salvas no localStorage (MELHORIA)

**Arquivo:** `src/app/components/SettingsScreen.tsx`

Todos os itens de configuração agora persistem entre sessões:

| Preferência | Chave no localStorage |
|---|---|
| Tema (claro/escuro) | `theme` |
| Idioma | `language` |
| Fuso horário | `timezone` |
| Formato de data | `dateFormat` |
| Notificações de atividade | `notifPrefs_<NomeMembro>` |
| Email / Push notifications | `notifPrefs_<NomeMembro>` |

## 6. Suporte a Dark Mode (MELHORIA)

- Todos os elementos agora usam as variáveis CSS do tema (`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`)
- A tela de configurações se adapta automaticamente ao tema claro/escuro

---

## Arquivos alterados

```
src/app/components/SettingsScreen.tsx   — reescrita completa
src/app/components/TeamAvatar.tsx       — suporte a foto personalizada
```
