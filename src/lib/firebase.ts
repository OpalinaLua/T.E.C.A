// --- Arquivo de Configuração do Firebase ---
// Este arquivo é responsável por inicializar e configurar a conexão
// com os serviços do Firebase que o aplicativo utiliza (Firestore e Analytics).

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Objeto de configuração com as credenciais do seu projeto Firebase.
// Estas chaves são públicas e seguras para serem expostas no lado do cliente.
// A segurança é garantida pelas Regras do Firestore.
const firebaseConfig = {
  apiKey: "AIzaSyBBw04_jbA8PSZvnnUtV5kF_tmvBkOk6HA",
  authDomain: "teca-30ef5.firebaseapp.com",
  projectId: "teca-30ef5",
  storageBucket: "teca-30ef5.firebasestorage.app",
  messagingSenderId: "233265567374",
  appId: "1:233265567374:web:b46a19b11e63247e165bdf",
  measurementId: "G-4036QGWNBC"
};

// Inicializa o Firebase, mas evita a reinicialização se já houver uma instância.
// Isso é importante em ambientes como o Next.js, que podem renderizar o código várias vezes.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Obtém a instância do Firestore, que é o nosso banco de dados.
const db = getFirestore(app);

// Inicializa o Google Analytics apenas se estiver rodando no navegador e for suportado.
// Isso evita erros durante a renderização no servidor (SSR).
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

// Exporta a instância do banco de dados para ser usada em outras partes do aplicativo.
export { db };
