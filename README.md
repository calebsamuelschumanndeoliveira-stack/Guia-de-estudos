# 📚 Guia de Estudos

Um site simples e bonito para **organizar seus estudos**: matérias, tarefas com check,
cronograma semanal, planilha de notas e metas — tudo em um só lugar.

Funciona 100% no navegador, **sem precisar de servidor ou conta**. Os dados ficam
salvos no próprio navegador de cada pessoa. Perfeito para hospedar de graça no
**GitHub Pages** e compartilhar o link com os amigos. 🎉

![feito com](https://img.shields.io/badge/feito%20com-HTML%20%C2%B7%20CSS%20%C2%B7%20JS-4f6df5)

## ✨ Funcionalidades

- 📊 **Painel** — visão geral do progresso, tarefas concluídas e próximos prazos
- 📘 **Matérias** — cadastre disciplinas com cor e professor
- ✅ **Tarefas** — marque com check, defina prazo e prioridade, filtre por status
- 🗓️ **Cronograma** — monte sua rotina de estudos da semana
- 📈 **Notas** — planilha de avaliações com **média ponderada** automática
- 🎯 **Metas** — defina objetivos (ex.: "estudar 20h") e acompanhe a evolução
- 🔐 **Login na nuvem (opcional)** — cada pessoa tem sua conta e os dados sincronizam entre aparelhos (via Supabase)
- 🔔 **Lembretes** — notificação no navegador avisando das tarefas do dia
- 🌙 **Tema claro/escuro**
- 📱 Funciona no celular e no computador

## 🚀 Como usar no seu computador

1. Baixe ou clone este repositório.
2. Abra o arquivo `index.html` no navegador. Pronto!

## 🌐 Como publicar no GitHub Pages (para compartilhar)

1. Crie um repositório no GitHub e envie estes arquivos (veja abaixo).
2. No GitHub, vá em **Settings → Pages**.
3. Em **Branch**, escolha `main` e a pasta `/ (root)`. Clique em **Save**.
4. Aguarde ~1 minuto. Seu site estará em:
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`
5. Compartilhe esse link com seus amigos! Cada um terá os próprios dados.

### Enviando para o GitHub pela primeira vez

```bash
git init
git add .
git commit -m "Primeira versão do Guia de Estudos"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
git push -u origin main
```

## 🔐 Login na nuvem (opcional)

Por padrão o site funciona **sem login**, salvando no próprio navegador. Se você
quiser que cada pessoa tenha uma **conta** e os dados **sincronizem entre
aparelhos** (PC e celular), ative o login na nuvem com o Supabase — é gratuito.

👉 Passo a passo completo em **[CONFIGURAR-LOGIN.md](CONFIGURAR-LOGIN.md)**.

## 🔔 Lembretes de tarefas

Clique em **🔔 Lembretes** na barra lateral para permitir notificações. O site
avisa quando você tem tarefas para o dia.

> Observação: as notificações funcionam enquanto o site está aberto no navegador.
> Lembretes com o site fechado (ou por WhatsApp) exigiriam um servidor próprio.

## 💾 Sobre os dados

- **Sem login (modo local):** os dados ficam só no navegador daquele aparelho.
  Cada amigo que abrir o link terá os próprios estudos, do zero.
- **Com login (nuvem):** os dados ficam na conta da pessoa e acompanham ela em
  qualquer aparelho.

## 📁 Estrutura do projeto

```
.
├── index.html        # estrutura da página
├── css/
│   └── styles.css    # estilo e temas
└── js/
    ├── storage.js    # salva e carrega os dados
    └── app.js        # toda a lógica e telas
```

## 📜 Licença

Livre para usar, modificar e compartilhar. Bons estudos! 📖
