import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ======================================================
// **AÇÃO NECESSÁRIA**
//
// 1. Vá para o console do Firebase: https://console.firebase.google.com/
// 2. Crie um novo projeto ou selecione um existente.
// 3. Vá para "Configurações do Projeto" (ícone de engrenagem).
// 4. Na aba "Geral", role para baixo até "Seus apps".
// 5. Clique no ícone "</>" para criar ou ver a configuração de um app da Web.
// 6. Copie o objeto `firebaseConfig` e cole-o abaixo, substituindo os valores de exemplo.
// 7. No menu lateral do Firebase, vá para "Build" > "Firestore Database", crie um banco de dados e inicie-o em modo de produção.
// ======================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
