/**
 * @fileoverview Hook personalizado para gerenciar os dados da escola no Firebase.
 * Este hook encapsula toda a lógica de interação com o Firestore,
 * incluindo leitura, adição, atualização e remoção de dados.
 * Ele fornece uma interface simples para os componentes da UI manipularem os dados.
 */
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Medium, Entity, Consulente } from '@/lib/types';
import { useToast } from './use-toast';

// Nome da coleção no Firestore onde os dados dos médiuns são armazenados.
const MEDIUMS_COLLECTION = 'mediums';

/**
 * Hook para gerenciar os dados dos médiuns.
 * @returns Um objeto contendo a lista de médiuns, estado de carregamento e funções para manipular os dados.
 */
export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Efeito para escutar por atualizações em tempo real do Firebase.
  useEffect(() => {
    // Verifica se a configuração do Firebase é válida antes de tentar conectar.
    if (!db || !db.app.options.projectId || db.app.options.projectId === 'YOUR_PROJECT_ID') {
      console.warn("Configuração do Firebase não encontrada ou está com valores de exemplo. Rodando em modo offline. Os dados não serão salvos.");
      setIsLoaded(true);
      return () => {}; // Retorna uma função de desinscrição vazia.
    }

    const mediumsCollection = collection(db, MEDIUMS_COLLECTION);
    const q = query(mediumsCollection, orderBy('createdAt', 'asc'));

    // onSnapshot escuta por mudanças e retorna uma função para parar de escutar.
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const mediumsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Medium[];
      setMediums(mediumsData);
      setIsLoaded(true);
    }, (error) => {
      // Este bloco captura erros de permissão ou conexão.
      console.error("----------- ERRO DE CONEXÃO DO FIREBASE -----------");
      console.error("Ocorreu um erro ao escutar as atualizações em tempo real. Por favor, verifique sua conexão e as configurações do projeto Firebase.");
      console.error("1. Garanta que você CLICOU em 'Criar banco de dados' no Console do Firebase para o Firestore.");
      console.error("2. Garanta que a API 'Cloud Firestore API' está ATIVADA no seu projeto Google Cloud: https://console.cloud.google.com/apis/library/firestore.googleapis.com");
      console.error("3. Garanta que suas Regras de Segurança do Firestore permitem leitura (pelo menos no modo de teste). Ex: `allow read, write: if true;`");
      console.error("Objeto de erro completo:", error);
      console.error("----------------------------------------------------");
      setIsLoaded(true); // Permite que a UI seja renderizada, mesmo que vazia.
    });

    // Função de limpeza que é chamada quando o componente é desmontado.
    return () => unsubscribe();
  }, []); // O array vazio garante que o efeito rode apenas uma vez.

  const updateMediumInFirestore = async (mediumId: string, updatedData: object) => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
      try {
        await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), updatedData);
      } catch (error) {
        console.error("Erro ao atualizar médium no Firestore: ", error);
        toast({ title: "Erro", description: "Ocorreu um erro ao salvar as alterações.", variant: "destructive" });
      }
    }
  };

  /**
   * Adiciona um novo médium ao banco de dados. A UI será atualizada automaticamente pelo onSnapshot.
   */
  const addMedium = useCallback(async (name: string, entities: { name: string; limit: number }[]) => {
    const newMediumData = {
      name,
      isPresent: true,
      entities: entities.map((entity, index) => ({
        id: `entity-${Date.now()}-${index}`,
        name: entity.name,
        consulentes: [],
        isAvailable: true,
        consulenteLimit: entity.limit,
      })),
      createdAt: new Date(),
    };

    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
      try {
        await addDoc(collection(db, MEDIUMS_COLLECTION), newMediumData);
      } catch (error) {
        console.error("Erro ao adicionar médium: ", error);
        toast({ title: "Erro", description: "Não foi possível cadastrar o médium.", variant: "destructive" });
      }
    } else {
      // Modo offline: simula a adição localmente.
      setMediums(prev => [...prev, { ...newMediumData, id: `local-${Date.now()}` } as Medium]);
    }
  }, [toast]);

  /**
   * Remove um médium do banco de dados. A UI será atualizada automaticamente.
   */
  const removeMedium = useCallback(async (mediumId: string) => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
      try {
        await deleteDoc(doc(db, MEDIUMS_COLLECTION, mediumId));
      } catch (error) {
        console.error("Erro ao remover médium: ", error);
        toast({ title: "Erro", description: "Não foi possível remover o médium.", variant: "destructive" });
      }
    } else {
      setMediums(prev => prev.filter(m => m.id !== mediumId));
    }
  }, [toast]);

  /**
   * Adiciona um novo consulente a uma entidade. A UI será atualizada automaticamente.
   */
  const addConsulente = useCallback(async (consulenteName: string, mediumId: string, entityId: string) => {
    const mediumToUpdate = mediums.find(m => m.id === mediumId);
    if (!mediumToUpdate) return;

    const newConsulente: Consulente = { id: `consulente-${Date.now()}`, name: consulenteName };

    const updatedEntities = mediumToUpdate.entities.map(entity =>
      entity.id === entityId
        ? { ...entity, consulentes: [...(entity.consulentes || []), newConsulente] }
        : entity
    );
    await updateMediumInFirestore(mediumId, { entities: updatedEntities });
  }, [mediums]);

  /**
   * Remove um consulente de uma entidade. A UI será atualizada automaticamente.
   */
  const removeConsulente = useCallback(async (mediumId: string, entityId: string, consulenteId: string) => {
    const mediumToUpdate = mediums.find(m => m.id === mediumId);
    if (!mediumToUpdate) return;

    const updatedEntities = mediumToUpdate.entities.map(entity =>
      entity.id === entityId
        ? { ...entity, consulentes: entity.consulentes.filter(c => c.id !== consulenteId) }
        : entity
    );
    await updateMediumInFirestore(mediumId, { entities: updatedEntities });
  }, [mediums]);

  /**
   * Alterna o estado de presença de um médium. A UI será atualizada automaticamente.
   */
  const toggleMediumPresence = useCallback(async (mediumId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;

    const newIsPresent = !medium.isPresent;
    const hadConsulentes = medium.entities.some(e => e.consulentes?.length > 0);
    let updatedEntities = medium.entities;
    if (!newIsPresent) {
      updatedEntities = medium.entities.map(entity => ({ ...entity, consulentes: [] }));
    }

    await updateMediumInFirestore(mediumId, { isPresent: newIsPresent, entities: updatedEntities });

    const newStatus = newIsPresent ? 'presente' : 'ausente';
    let description = `O(a) médium ${medium.name} foi marcado(a) como ${newStatus}.`;
    if (!newIsPresent && hadConsulentes) {
      description += " Todos os consulentes agendados foram removidos.";
    }
    toast({ title: "Presença Alterada", description });
  }, [mediums, toast]);

  /**
   * Alterna a disponibilidade de uma entidade. A UI será atualizada automaticamente.
   */
  const toggleEntityAvailability = useCallback(async (mediumId: string, entityId: string) => {
    const mediumToUpdate = mediums.find(m => m.id === mediumId);
    if (!mediumToUpdate) return;

    const entityToUpdate = mediumToUpdate.entities.find(e => e.id === entityId);
    if (!entityToUpdate) return;

    const hadConsulentes = (entityToUpdate.consulentes?.length || 0) > 0;
    const updatedEntities = mediumToUpdate.entities.map(entity => {
      if (entity.id === entityId) {
        const newIsAvailable = !entity.isAvailable;
        return { ...entity, isAvailable: newIsAvailable, consulentes: !newIsAvailable ? [] : entity.consulentes };
      }
      return entity;
    });

    await updateMediumInFirestore(mediumId, { entities: updatedEntities });

    const newStatus = !entityToUpdate.isAvailable ? 'disponível' : 'indisponível';
    let description = `A entidade ${entityToUpdate.name} foi marcada como ${newStatus}.`;
    if (entityToUpdate.isAvailable && hadConsulentes) {
      description += " Todos os consulentes agendados foram removidos.";
    }
    toast({ title: "Disponibilidade Alterada", description });
  }, [mediums, toast]);

  /**
   * Atualiza os dados de um médium. A UI será atualizada automaticamente.
   */
  const updateMedium = useCallback(async (mediumId: string, updatedData: Partial<Pick<Medium, 'name' | 'entities'>>) => {
    await updateMediumInFirestore(mediumId, updatedData);
  }, []);

  return {
    mediums,
    isLoaded,
    addMedium,
    removeMedium,
    addConsulente,
    removeConsulente,
    toggleMediumPresence,
    toggleEntityAvailability,
    updateMedium,
  };
}
