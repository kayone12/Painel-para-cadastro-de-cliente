# Painel de Clientes — Guia rápido

Seu painel completo: cadastro de clientes, vencimentos, busca, filtros
(Todos / Em dia / A vencer / Vence hoje / Vencidos) e botão de "Renovar"
que já soma os dias do plano (Mensal = +30, Trimestral = +90, Semestral = +180,
Anual = +365).

Arquivos:
- `index.html` — a página do painel
- `app.js` — toda a lógica (login, cadastro, filtros, renovação)
- `firebase-config.js` — **você precisa editar este com as chaves do seu Firebase**
- `firestore.rules` — regra de segurança do banco (cada usuário só vê os próprios clientes)

---

## PASSO 1 — Criar o projeto no Firebase (banco de dados gratuito)

1. Acesse **https://console.firebase.google.com** e clique em **"Criar projeto"**.
2. Dê um nome (ex.: `meu-painel-clientes`) e siga o assistente (pode desativar o Google Analytics).
3. Dentro do projeto, clique no ícone **⚙️ > Configurações do projeto**.
4. Role até **"Seus apps"** e clique no ícone **`</>`** (Web) para criar um app.
5. Dê um apelido e clique em **"Registrar app"**. Ele vai te mostrar um bloco assim:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "meu-painel.firebaseapp.com",
  projectId: "meu-painel",
  storageBucket: "meu-painel.appspot.com",
  messagingSenderId: "123456",
  appId: "1:123456:web:abcdef"
};
```

6. **Copie esse bloco** e cole dentro do arquivo `firebase-config.js`, substituindo os valores de exemplo.

## PASSO 2 — Ativar login por e-mail/senha

1. No menu lateral do Firebase, vá em **Build > Authentication**.
2. Clique em **"Vamos começar"**.
3. Na aba **Sign-in method**, clique em **"E-mail/senha"** e ative a primeira opção. Salve.

## PASSO 3 — Criar o banco de dados (Firestore)

1. No menu lateral, vá em **Build > Firestore Database**.
2. Clique em **"Criar banco de dados"**.
3. Escolha a localização (ex.: `southamerica-east1` para Brasil).
4. Selecione **"Iniciar no modo de produção"**.
5. Depois de criado, vá na aba **"Regras"** e substitua o conteúdo pelo do
   arquivo `firestore.rules` (garante que só você acesse seus próprios clientes). Clique em **Publicar**.

## PASSO 4 — Testar localmente (opcional)

Se quiser testar antes de publicar, dentro da pasta do projeto rode:
```
python3 -m http.server 8080
```
E abra `http://localhost:8080` no navegador.

## PASSO 5 — Publicar no Netlify (o link para acessar de qualquer aparelho)

**Opção mais simples — arrastar e soltar:**
1. Acesse **https://app.netlify.com/drop**
2. Arraste a pasta inteira do projeto (com `index.html`, `app.js`, `firebase-config.js`) para a área indicada.
3. Em segundos o Netlify gera um link tipo `https://nome-aleatorio.netlify.app` — esse é o link que você acessa de qualquer celular, tablet ou computador.
4. Depois, em **Site settings > Change site name**, você pode trocar para algo como `meu-painel-clientes.netlify.app`.

**Opção via GitHub (recomendada se for atualizar depois):**
1. Suba os arquivos para um repositório no GitHub.
2. No Netlify, clique em **"Add new site" > "Import an existing project"** e conecte o repositório.
3. Deixe "Build command" vazio e "Publish directory" como `.` (raiz).
4. Clique em **Deploy**.

## PASSO 6 — Criar seu login

1. Abra o link do Netlify.
2. Na tela de login, clique em **"Criar conta"**, informe seu e-mail e uma senha.
3. Pronto — você já pode cadastrar seus clientes. Esse login/senha é só seu; qualquer aparelho que entrar com essa conta vai ver os mesmos clientes, sincronizados em tempo real.

---

### Notas
- Todos os dados ficam salvos no Firestore (nuvem do Google), plano gratuito
  (Spark) já é suficiente para uso pessoal com milhares de clientes.
- Se quiser que mais de uma pessoa da sua equipe acesse os mesmos clientes,
  me avise — dá pra ajustar as regras para compartilhar os dados entre contas.
- O botão **Renovar** soma os dias do plano à data de vencimento atual
  (ou a partir de hoje, se já estiver vencido).
