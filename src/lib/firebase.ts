/**
 * @fileoverview Inicializa e exporta a instância do Firebase para a aplicação.
 * Este arquivo configura a conexão com o Firebase usando as credenciais do projeto
 * e exporta a instância do Firestore (db) para ser usada em outras partes do código.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase. Substitua pelos dados do seu projeto se necessário.
const firebaseConfig = {
  apiKey: "AIzaSyBBw04_jbA8PSZvnnUtV5kF_tmvBkOk6HA",
  authDomain: "teca-30ef5.firebaseapp.com",
  projectId: "teca-30ef5",
  storageBucket: "teca-30ef5.firebasestorage.app",
  messagingSenderId: "233265567374",
  appId: "1:233265567374:web:b46a19b11e63247e165bdf",
  measurementId: "G-4036QGWNBC"
};

// Inicializa o Firebase, evitando a reinicialização se já houver uma instância.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta a instância do Firestore para ser usada na aplicação.
const db = getFirestore(app);

export { db };
