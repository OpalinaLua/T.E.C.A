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
  Timestamp,
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
      console.error("CONFIGURAÇÃO DO FIREBASE INVÁLIDA! Verifique o arquivo src/lib/firebase.ts. O aplicativo não se conectará à nuvem.");
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
      console.error("CAUSAS PROVÁVEIS:");
      console.error("1. O BANCO DE DADOS NÃO FOI CRIADO: Vá ao Console do Firebase > Firestore Database e clique em 'Criar banco de dados'.");
      console.error("2. A API DO FIRESTORE ESTÁ DESATIVADA: Ative-a no seu projeto Google Cloud: https://console.cloud.google.com/apis/library/firestore.googleapis.com");
      console.error("3. REGRAS DE SEGURANÇA: Suas regras no Firestore devem permitir leitura (ex: `allow read, write: if true;` para testes).");
      console.error("Objeto de erro completo:", error);
      console.error("----------------------------------------------------");
      setIsLoaded(true); // Permite que a UI seja renderizada, mesmo que vazia.
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao banco de dados. Verifique o console para mais detalhes.",
        variant: "destructive",
        duration: 10000,
      });
    });

    // Função de limpeza que é chamada quando o componente é desmontado.
    return () => unsubscribe();
  }, [toast]); // Adicionado toast como dependência

  const updateMediumInFirestore = async (mediumId: string, updatedData: object) => {
    // Esta função não precisa mais de um fallback local, pois o onSnapshot cuidará da atualização da UI.
    try {
      const mediumRef = doc(db, MEDIUMS_COLLECTION, mediumId);
      await updateDoc(mediumRef, updatedData);
    } catch (error) {
      console.error("Erro ao atualizar médium no Firestore: ", error);
      toast({ title: "Erro de Sincronização", description: "Ocorreu um erro ao salvar as alterações na nuvem.", variant: "destructive" });
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
      createdAt: Timestamp.fromDate(new Date()),
    };

    // A UI não será mais atualizada localmente. O sucesso depende exclusivamente do Firebase.
    try {
      await addDoc(collection(db, MEDIUMS_COLLECTION), newMediumData);
      // O onSnapshot cuidará de atualizar a UI.
    } catch (error) {
      console.error("Erro ao adicionar médium na nuvem: ", error);
      toast({ title: "Erro ao Cadastrar", description: "Não foi possível salvar o novo médium na nuvem. Verifique sua conexão e as configurações do Firebase.", variant: "destructive" });
    }
  }, [toast]);

  /**
   * Remove um médium do banco de dados. A UI será atualizada automaticamente pelo onSnapshot.
   */
  const removeMedium = useCallback(async (mediumId: string) => {
    // A UI não será mais atualizada localmente.
    try {
      await deleteDoc(doc(db, MEDIUMS_COLLECTION, mediumId));
      // O onSnapshot cuidará de atualizar a UI.
    } catch (error) {
      console.error("Erro ao remover médium na nuvem: ", error);
      toast({ title: "Erro ao Remover", description: "Não foi possível remover o médium da nuvem.", variant: "destructive" });
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
    
    // Se o médium está ficando ausente, remove todos os consulentes.
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
    const newIsAvailable = !entityToUpdate.isAvailable;

    const updatedEntities = mediumToUpdate.entities.map(entity => {
      if (entity.id === entityId) {
        // Se a entidade está ficando indisponível, remove seus consulentes.
        return { ...entity, isAvailable: newIsAvailable, consulentes: !newIsAvailable ? [] : entity.consulentes };
      }
      return entity;
    });

    await updateMediumInFirestore(mediumId, { entities: updatedEntities });

    const newStatus = newIsAvailable ? 'disponível' : 'indisponível';
    let description = `A entidade ${entityToUpdate.name} foi marcada como ${newStatus}.`;
    if (!newIsAvailable && hadConsulentes) {
      description += " Todos os consulentes agendados foram removidos.";
    }
    toast({ title: "Disponibilidade Alterada", description });
  }, [mediums, toast]);

  /**
   * Atualiza os dados de um médium (nome e entidades). A UI será atualizada automaticamente.
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
