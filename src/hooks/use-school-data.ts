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
  getDocs,
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

  // Efeito para buscar os dados do Firebase uma vez no carregamento.
  useEffect(() => {
    const fetchData = async () => {
       // Verifica se a configuração do Firebase é válida antes de tentar conectar.
      if (!db || !db.app.options.projectId || db.app.options.projectId === 'YOUR_PROJECT_ID') {
        console.warn("Configuração do Firebase não encontrada ou está com valores de exemplo. Rodando em modo offline. Os dados não serão salvos.");
        setIsLoaded(true);
        return;
      }
      
      try {
        const mediumsCollection = collection(db, MEDIUMS_COLLECTION);
        const q = query(mediumsCollection, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const mediumsData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Medium[];
        
        setMediums(mediumsData);
      } catch (error) {
        // Bloco de tratamento de erro para problemas de conexão ou permissão.
        console.error("----------- ERRO DE CONEXÃO DO FIREBASE -----------");
        console.error("Ocorreu um erro ao buscar os dados iniciais. Por favor, verifique sua configuração do Firebase.");
        console.error("1. Garanta que você CLICOU em 'Criar banco de dados' no Console do Firebase para o Firestore.");
        console.error("2. Garanta que a API 'Cloud Firestore API' está ATIVADA no seu projeto Google Cloud: https://console.cloud.google.com/apis/library/firestore.googleapis.com");
        console.error("3. Garanta que suas Regras de Segurança do Firestore permitem leitura (pelo menos no modo de teste).");
        console.error("Objeto de erro completo:", error);
        console.error("----------------------------------------------------");
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, []);

  /**
   * Adiciona um novo médium ao banco de dados e atualiza o estado local.
   * @param name - O nome do médium.
   * @param entities - Um array de objetos de entidade, cada um com nome e limite.
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
            const docRef = await addDoc(collection(db, MEDIUMS_COLLECTION), newMediumData);
            // Atualiza o estado local com o novo médium, incluindo o ID retornado pelo Firebase.
            setMediums(prev => [...prev, { ...newMediumData, id: docRef.id } as Medium]);
        } catch (error) {
            console.error("Erro ao adicionar médium: ", error);
            toast({ title: "Erro", description: "Não foi possível cadastrar o médium.", variant: "destructive" });
        }
    } else {
        // Modo offline: simula a adição localmente.
        setMediums(prev => [...prev, {...newMediumData, id: `local-${Date.now()}`} as Medium]);
    }
  }, [toast]);

  /**
   * Remove um médium do banco de dados e do estado local.
   * @param mediumId - O ID do médium a ser removido.
   */
  const removeMedium = useCallback(async (mediumId: string) => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await deleteDoc(doc(db, MEDIUMS_COLLECTION, mediumId));
            // Atualiza o estado local removendo o médium.
            setMediums(prev => prev.filter(m => m.id !== mediumId));
        } catch (error) {
            console.error("Erro ao remover médium: ", error);
            toast({ title: "Erro", description: "Não foi possível remover o médium.", variant: "destructive" });
        }
    } else {
        setMediums(prev => prev.filter(m => m.id !== mediumId));
    }
  }, [toast]);

  const updateMediumState = (mediumId: string, updatedData: Partial<Medium>) => {
     setMediums(prev => prev.map(m => m.id === mediumId ? { ...m, ...updatedData } : m));
  }

  const updateMediumInFirestore = async (mediumId: string, updatedData: object) => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), updatedData);
        } catch (error) {
            console.error("Erro ao atualizar médium no Firestore: ", error);
            toast({ title: "Erro", description: "Ocorreu um erro ao salvar as alterações.", variant: "destructive" });
            // Reverte a mudança local em caso de erro
            // (Implementação mais complexa, omitida por simplicidade no momento)
            return false;
        }
    }
    return true;
  }

  /**
   * Adiciona um novo consulente a uma entidade específica de um médium.
   * @param consulenteName - O nome do consulente.
   * @param mediumId - O ID do médium.
   * @param entityId - O ID da entidade.
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
    
    updateMediumState(mediumId, { entities: updatedEntities });
    await updateMediumInFirestore(mediumId, { entities: updatedEntities });
  }, [mediums]);

  /**
   * Remove um consulente de uma entidade.
   * @param mediumId - O ID do médium.
   * @param entityId - O ID da entidade.
   * @param consulenteId - O ID do consulente a ser removido.
   */
  const removeConsulente = useCallback(async (mediumId: string, entityId: string, consulenteId: string) => {
    const mediumToUpdate = mediums.find(m => m.id === mediumId);
    if (!mediumToUpdate) return;
    
    const updatedEntities = mediumToUpdate.entities.map(entity => 
      entity.id === entityId 
        ? { ...entity, consulentes: entity.consulentes.filter(c => c.id !== consulenteId) }
        : entity
    );

    updateMediumState(mediumId, { entities: updatedEntities });
    await updateMediumInFirestore(mediumId, { entities: updatedEntities });
  }, [mediums]);
  
  /**
   * Alterna o estado de presença de um médium (presente/ausente).
   * Se um médium for marcado como ausente, todos os seus consulentes agendados são removidos.
   * @param mediumId - O ID do médium.
   */
  const toggleMediumPresence = useCallback(async (mediumId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;

    const newIsPresent = !medium.isPresent;
    let updatedEntities = medium.entities;
    const hadConsulentes = medium.entities.some(e => e.consulentes?.length > 0);

    // Se o médium está ficando ausente, limpa a lista de consulentes.
    if (!newIsPresent) {
      updatedEntities = medium.entities.map(entity => ({ ...entity, consulentes: [] }));
    }

    const updatedData = { isPresent: newIsPresent, entities: updatedEntities };
    updateMediumState(mediumId, updatedData);
    const success = await updateMediumInFirestore(mediumId, updatedData);
    
    if (success) {
      const newStatus = newIsPresent ? 'presente' : 'ausente';
      let description = `O(a) médium ${medium.name} foi marcado(a) como ${newStatus}.`;
      if (!newIsPresent && hadConsulentes) {
        description += " Todos os consulentes agendados foram removidos.";
      }
      toast({ title: "Presença Alterada", description });
    }
  }, [mediums, toast]);

  /**
   * Alterna a disponibilidade de uma entidade.
   * Se uma entidade for marcada como indisponível, todos os seus consulentes agendados são removidos.
   * @param mediumId - O ID do médium ao qual a entidade pertence.
   * @param entityId - O ID da entidade.
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
        const updatedConsulentes = !newIsAvailable ? [] : (entity.consulentes || []);
        return { ...entity, isAvailable: newIsAvailable, consulentes: updatedConsulentes };
      }
      return entity;
    });

    updateMediumState(mediumId, { entities: updatedEntities });
    const success = await updateMediumInFirestore(mediumId, { entities: updatedEntities });

    if (success) {
        const newStatus = !entityToUpdate.isAvailable ? 'disponível' : 'indisponível';
        let description = `A entidade ${entityToUpdate.name} foi marcada como ${newStatus}.`;
        if (entityToUpdate.isAvailable && hadConsulentes) { 
            description += " Todos os consulentes agendados foram removidos.";
        }
        toast({ title: "Disponibilidade Alterada", description });
    }
  }, [mediums, toast]);

  /**
   * Atualiza os dados de um médium (nome e/ou entidades).
   * @param mediumId - O ID do médium a ser atualizado.
   * @param updatedData - Um objeto com os dados a serem atualizados.
   */
  const updateMedium = useCallback(async (mediumId: string, updatedData: Partial<Pick<Medium, 'name' | 'entities'>>) => {
    updateMediumState(mediumId, updatedData);
    await updateMediumInFirestore(mediumId, updatedData);
  }, [mediums]);

  // Retorna o estado e as funções para serem usadas pelos componentes.
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
