# 🔐 Como ativar o login na nuvem (Supabase)

Este guia ativa o **login de verdade**: cada pessoa cria uma conta (nome de usuário,
e-mail, telefone e senha) e seus estudos ficam salvos na nuvem, acessíveis de
qualquer aparelho. É **gratuito** para o uso de um grupo de amigos.

> Enquanto você **não** fizer esta configuração, o site continua funcionando
> normalmente em "modo local" (dados salvos só no navegador, sem login).
> Você pode publicar primeiro e configurar o login depois, sem pressa. 😉

Leva uns **10 minutos**. Vá com calma, na ordem.

---

## Passo 1 — Criar uma conta no Supabase

1. Acesse **[supabase.com](https://supabase.com)** e clique em **Start your project**.
2. Entre com sua conta do GitHub (mais fácil) ou com e-mail.

## Passo 2 — Criar o projeto

1. Clique em **New project**.
2. **Name:** `guia-de-estudos` (qualquer nome).
3. **Database Password:** crie uma senha forte e **guarde** num lugar seguro
   (você não vai usá-la no site, mas é importante).
4. **Region:** escolha **South America (São Paulo)** se aparecer (fica mais rápido).
5. Clique em **Create new project** e espere ~2 minutos enquanto ele é preparado.

## Passo 3 — Pegar suas duas "chaves"

1. No menu da esquerda, clique na engrenagem **Project Settings** → **API**.
2. Você verá dois valores. Copie-os:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** (em "Project API keys") → uma chave longa começando com `eyJ...`
3. Abra o arquivo **`js/supabase-config.js`** do projeto e cole os valores:

   ```js
   window.SUPABASE_CONFIG = {
     url: "https://abcdefgh.supabase.co",   // sua Project URL
     anonKey: "eyJhbGciOiJIUzI1Ni... (sua chave anon public)",
   };
   ```

   > ✅ Pode salvar e enviar isso ao GitHub sem medo. A chave `anon` é **pública**
   > de propósito — quem protege seus dados são as regras do Passo 4.

## Passo 4 — Criar a tabela e as regras de segurança

1. No menu da esquerda do Supabase, clique em **SQL Editor** → **New query**.
2. Cole **todo** o código abaixo e clique em **Run** (ou aperte Ctrl+Enter):

   ```sql
   -- Tabela que guarda os dados de cada usuário (um registro por pessoa)
   create table public.user_data (
     user_id uuid references auth.users on delete cascade primary key,
     data jsonb not null default '{}',
     updated_at timestamptz default now()
   );

   -- Liga a "trava de segurança" (RLS)
   alter table public.user_data enable row level security;

   -- Cada pessoa só pode ler e escrever os PRÓPRIOS dados
   create policy "Cada usuário acessa apenas seus dados"
     on public.user_data
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

3. Deve aparecer **Success**. Pronto, o banco está seguro. 🔒

## Passo 5 — (Recomendado) Login instantâneo, sem confirmar e-mail

Por padrão o Supabase pede confirmação de e-mail antes de entrar. Para um app
entre amigos, é mais simples desligar isso:

1. Menu da esquerda → **Authentication** → **Sign In / Providers** → **Email**.
2. **Desligue** a opção **Confirm email**.
3. Clique em **Save**.

Assim, ao criar a conta a pessoa já entra direto. (Se preferir manter a
confirmação ligada, tudo bem — só será preciso clicar no link do e-mail antes
do primeiro login.)

---

## Passo 6 — Testar

1. Abra o `index.html` (ou seu site publicado). Agora deve aparecer a **tela de login**.
2. Clique em **Criar conta**, preencha e cadastre-se.
3. Crie uma matéria/tarefa, feche o navegador, entre de novo: seus dados continuam lá. ✨
4. Teste em outro aparelho (celular) com o mesmo login — os dados acompanham você.

---

## Perguntas comuns

**É realmente de graça?**
Sim, o plano gratuito do Supabase é bem folgado para um grupo de amigos.

**A chave `anon` no GitHub é perigosa?**
Não. Ela é pública por design. A segurança vem das regras (RLS) do Passo 4, que
impedem alguém de ver os dados de outra pessoa.

**Posso voltar para o modo sem login?**
Sim. É só apagar os valores em `js/supabase-config.js` (deixar `""`).

**A tela de login não apareceu.**
Confira se os dois valores em `js/supabase-config.js` estão preenchidos
corretamente e recarregue a página com **Ctrl + Shift + R**.
