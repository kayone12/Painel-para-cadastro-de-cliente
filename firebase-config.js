// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// 1. Vá em https://console.firebase.google.com
// 2. Crie um projeto (ou use um existente)
// 3. Em "Configurações do projeto" > "Geral" > role até "Seus apps"
//    e crie um app da Web (ícone </>)
// 4. Copie o objeto "firebaseConfig" que aparece e cole abaixo,
//    substituindo os valores de exemplo.
// 5. Ative também: Authentication > Sign-in method > E-mail/senha
//    e Firestore Database > Criar banco de dados
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAkNa1PM5quO6Wp3dZ3UKe9xlC2ZpFXfFU",
  authDomain: "painelclientes-d5605.firebaseapp.com",
  projectId: "painelclientes-d5605",
  storageBucket: "painelclientes-d5605.firebasestorage.app",
  messagingSenderId: "132029367770",
  appId: "1:132029367770:web:17280d72a64b551843ece3"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
