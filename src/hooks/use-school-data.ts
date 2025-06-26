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
  onSnapshot, // Importado para escutar atualizações em tempo real
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Medium, Entity, Consulente } from '@/lib/types';
import { useToast } from './use-toast';

const MEDIUMS_COLLECTION = 'mediums';

/**
 * Hook personalizado para gerenciar todos os dados dos médiuns.
 * Este hook encapsula toda a lógica de interação com o Firebase (Firestore),
 * incluindo leitura, adição, atualização e remoção de dados.
 * Ele também gerencia o estado local e mantém a interface sincronizada.
 */
export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Efeito para buscar os dados do Firestore em tempo real assim que o componente é montado.
  useEffect(() => {
    // Verifica se a configuração do Firebase é válida antes de tentar conectar.
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
      const mediumsCollection = collection(db, MEDIUMS_COLLECTION);
      // Cria uma consulta para ordenar os médiuns por data de criação.
      const q = query(mediumsCollection, orderBy('createdAt', 'asc'));

      // `onSnapshot` estabelece uma conexão em tempo real.
      // Ele "escuta" por qualquer mudança na coleção 'mediums'.
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mediumsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Medium[];
        
        setMediums(mediumsData);
        // Garante que o estado de "carregado" seja definido apenas uma vez.
        if (!isLoaded) {
          setIsLoaded(true);
        }

      }, (error) => {
        // Bloco de erro para ajudar a depurar problemas de conexão ou permissão.
        console.error("----------- ERRO DE ESCUTA DO FIREBASE -----------");
        console.error("Ocorreu um erro ao escutar por atualizações em tempo real. Isso muito provavelmente é um problema de PERMISSÃO ou CONFIGURAÇÃO com seu projeto Firebase.");
        console.error("1. Garanta que você criou um banco de dados Firestore no Console do Firebase.");
        console.error("2. Garanta que suas Regras de Segurança do Firestore permitem leitura na coleção 'mediums'. Exemplo para teste: allow read, write: if true;");
        console.error("3. Garanta que a API do Firestore está ativada no seu projeto Google Cloud.");
        console.error("Objeto de erro completo:", error);
        console.error("----------------------------------------------------");
        setIsLoaded(true); // Permite que a UI seja renderizada mesmo com erro.
      });

      // Função de limpeza: `unsubscribe` é chamado quando o componente é desmontado
      // para fechar a conexão em tempo real e evitar vazamentos de memória.
      return () => unsubscribe();
    } else {
      console.warn("Configuração do Firebase não encontrada ou está com valores de exemplo. Rodando em modo offline. Os dados não serão salvos.");
      setIsLoaded(true);
    }
  }, [isLoaded]); // A dependência `isLoaded` garante que o listener não seja recriado desnecessariamente.

  // Função para adicionar um novo médium ao banco de dados.
  // `useCallback` é usado para otimização, evitando recriações da função.
  const addMedium = useCallback(async (name: string, entities: string[]) => {
    const newMedium = {
      name,
      isPresent: true,
      entities: entities.map((entityName, index) => ({
        id: `entity-${Date.now()}-${index}`,
        name: entityName,
        consulentes: [],
        isAvailable: true,
      })),
      createdAt: new Date(), // `createdAt` é usado para ordenação.
    };
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await addDoc(collection(db, MEDIUMS_COLLECTION), newMedium);
            // Nenhuma atualização de estado local é necessária aqui,
            // pois o `onSnapshot` cuidará disso automaticamente.
        } catch (error) {
            console.error("Erro ao adicionar médium: ", error);
        }
    } else {
        // Fallback para modo offline: atualiza o estado local diretamente.
        setMediums(prev => [...prev, {...newMedium, id: `local-${Date.now()}`} as Medium]);
    }
  }, []);

  // Função para remover um médium.
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

  // Função para adicionar um consulente a uma entidade específica de um médium.
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
  }, [mediums]); // Depende de `mediums` para encontrar o médium a ser atualizado.

  // Função para remover um consulente de uma entidade.
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
  
  // Função para alternar a presença de um médium (presente/ausente).
  const toggleMediumPresence = useCallback(async (mediumId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;

    const newIsPresent = !medium.isPresent;
    let updatedEntities = medium.entities;
    const hadConsulentes = medium.entities.some(e => e.consulentes?.length > 0);

    // Se o médium for marcado como ausente, todos os seus consulentes são removidos.
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
            // Exibe uma notificação para o usuário.
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

  // Função para alternar a disponibilidade de uma entidade.
  const toggleEntityAvailability = useCallback(async (mediumId: string, entityId: string) => {
    const mediumToUpdate = mediums.find(m => m.id === mediumId);
    if (!mediumToUpdate) return;

    const entityToUpdate = mediumToUpdate.entities.find(e => e.id === entityId);
    if (!entityToUpdate) return;
    
    const hadConsulentes = (entityToUpdate.consulentes?.length || 0) > 0;

    const updatedEntities = mediumToUpdate.entities.map(entity => {
      if (entity.id === entityId) {
        const newIsAvailable = !entity.isAvailable;
        // Se a entidade for marcada como indisponível, remove seus consulentes.
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
             // Exibe uma notificação para o usuário.
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

  // Função para atualizar os dados de um médium (nome e/ou entidades).
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
  }, []); // Sem dependências, pois não lê o estado atual para executar.

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
