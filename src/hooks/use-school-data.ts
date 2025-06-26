/**
 * @fileoverview Hook personalizado para gerenciar os dados da escola no Firebase.
 * Este hook encapsula toda a lógica de interação com o Firestore,
 * incluindo leitura em tempo real, adição, atualização e remoção de dados.
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

  // Efeito para se conectar ao Firebase e escutar por atualizações em tempo real.
  useEffect(() => {
    // Verifica se a configuração do Firebase é válida antes de tentar conectar.
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
      const mediumsCollection = collection(db, MEDIUMS_COLLECTION);
      const q = query(mediumsCollection, orderBy('createdAt', 'asc'));

      // Inicia o listener em tempo real. onSnapshot é chamado sempre que há uma mudança na coleção.
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mediumsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Medium[];
        
        setMediums(mediumsData);
        if (!isLoaded) {
          setIsLoaded(true);
        }

      }, (error) => {
        // Bloco de tratamento de erro para problemas de conexão ou permissão.
        console.error("----------- ERRO DE ESCUTA DO FIREBASE -----------");
        console.error("Ocorreu um erro ao escutar por atualizações em tempo real. Isso muito provavelmente é um problema de PERMISSÃO ou CONFIGURAÇÃO com seu projeto Firebase.");
        console.error("1. Garanta que você criou um banco de dados Firestore no Console do Firebase.");
        console.error("2. Garanta que suas Regras de Segurança do Firestore permitem leitura na coleção 'mediums'. Exemplo para teste: allow read, write: if true;");
        console.error("3. Garanta que a API do Firestore está ativada no seu projeto Google Cloud.");
        console.error("Objeto de erro completo:", error);
        console.error("----------------------------------------------------");
        setIsLoaded(true); // Marca como carregado mesmo com erro para não travar a UI.
      });

      // Função de limpeza: remove o listener quando o componente é desmontado.
      return () => unsubscribe();
    } else {
      // Modo offline: se o Firebase não estiver configurado, a aplicação funciona localmente.
      console.warn("Configuração do Firebase não encontrada ou está com valores de exemplo. Rodando em modo offline. Os dados não serão salvos.");
      setIsLoaded(true);
    }
  }, [isLoaded]);

  /**
   * Adiciona um novo médium ao banco de dados.
   * @param name - O nome do médium.
   * @param entities - Um array de objetos de entidade, cada um com nome e limite.
   */
  const addMedium = useCallback(async (name: string, entities: { name: string; limit: number }[]) => {
    const newMedium = {
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
            await addDoc(collection(db, MEDIUMS_COLLECTION), newMedium);
        } catch (error) {
            console.error("Erro ao adicionar médium: ", error);
        }
    } else {
        setMediums(prev => [...prev, {...newMedium, id: `local-${Date.now()}`} as Medium]);
    }
  }, []);

  /**
   * Remove um médium do banco de dados.
   * @param mediumId - O ID do médium a ser removido.
   */
  const removeMedium = useCallback(async (mediumId: string) => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await deleteDoc(doc(db, MEDIUMS_COLLECTION, mediumId));
        } catch (error) {
            console.error("Erro ao remover médium: ", error);
        }
    } else {
        setMediums(prev => prev.filter(m => m.id !== mediumId));
    }
  }, []);

  /**
   * Adiciona um novo consulente a uma entidade específica de um médium.
   * @param consulenteName - O nome do consulente.
   * @param mediumId - O ID do médium.
   * @param entityId - O ID da entidade.
   */
  const addConsulente = useCallback(async (consulenteName: string, mediumId: string, entityId: string) => {
    const mediumToUpdate = mediums.find(m => m.id === mediumId);
    if (!mediumToUpdate) return;

    const newConsulente: Consulente = {
      id: `consulente-${Date.now()}`,
      name: consulenteName,
    };

    const updatedEntities = mediumToUpdate.entities.map(entity => {
      if (entity.id === entityId) {
        return {
          ...entity,
          consulentes: [...(entity.consulentes || []), newConsulente],
        };
      }
      return entity;
    });
    
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
                entities: updatedEntities,
            });
        } catch (error) {
            console.error("Erro ao adicionar consulente: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
    }
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
    
    const updatedEntities = mediumToUpdate.entities.map(entity => {
      if (entity.id === entityId) {
        return {
          ...entity,
          consulentes: entity.consulentes.filter(c => c.id !== consulenteId),
        };
      }
      return entity;
    });

    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
                entities: updatedEntities,
            });
        } catch (error) {
            console.error("Erro ao remover consulente: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
    }
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

    // Se o médium está ficando ausente, limpa a lista de consulentes de todas as suas entidades.
    if (!newIsPresent) {
      updatedEntities = medium.entities.map(entity => ({
        ...entity,
        consulentes: [],
      }));
    }

    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
                isPresent: newIsPresent,
                entities: updatedEntities,
            });
            const newStatus = newIsPresent ? 'presente' : 'ausente';
            let description = `O(a) médium ${medium.name} foi marcado(a) como ${newStatus}.`;
            if (!newIsPresent && hadConsulentes) {
                description += " Todos os consulentes agendados foram removidos.";
            }
            toast({
                title: "Presença Alterada",
                description: description,
            });
        } catch (error) {
            console.error("Erro ao alternar presença do médium: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => m.id === mediumId ? {...m, isPresent: newIsPresent, entities: updatedEntities} : m));
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
        // Se a entidade está ficando indisponível, limpa sua lista de consulentes.
        const updatedConsulentes = !newIsAvailable ? [] : (entity.consulentes || []);
        return { ...entity, isAvailable: newIsAvailable, consulentes: updatedConsulentes };
      }
      return entity;
    });

    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
                entities: updatedEntities,
            });
            const newStatus = !entityToUpdate.isAvailable ? 'disponível' : 'indisponível';
            let description = `A entidade ${entityToUpdate.name} foi marcada como ${newStatus}.`;
            if (entityToUpdate.isAvailable && hadConsulentes) { 
                description += " Todos os consulentes agendados foram removidos.";
            }
            toast({
                title: "Disponibilidade Alterada",
                description: description,
            });
        } catch (error) {
            console.error("Erro ao alternar disponibilidade da entidade: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
    }
  }, [mediums, toast]);

  /**
   * Atualiza os dados de um médium (nome e/ou entidades).
   * @param mediumId - O ID do médium a ser atualizado.
   * @param updatedData - Um objeto com os dados a serem atualizados.
   */
  const updateMedium = useCallback(async (mediumId: string, updatedData: Partial<Pick<Medium, 'name' | 'entities'>>) => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            const mediumRef = doc(db, MEDIUMS_COLLECTION, mediumId);
            await updateDoc(mediumRef, updatedData);
        } catch (error) {
            console.error("Erro ao atualizar médium: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => {
            if (m.id === mediumId) {
                return { ...m, ...updatedData } as Medium;
            }
            return m;
        }));
    }
  }, []);

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
