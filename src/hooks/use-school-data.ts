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
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Medium, Entity, Consulente } from '@/lib/types';

const MEDIUMS_COLLECTION = 'mediums';

export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
          console.log("Tentando buscar dados do Firestore com getDocs para depuração...");
          const mediumsCollection = collection(db, MEDIUMS_COLLECTION);
          const q = query(mediumsCollection, orderBy('createdAt', 'asc'));
          const snapshot = await getDocs(q);

          const mediumsData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          })) as Medium[];
          
          setMediums(mediumsData);
          console.log("Dados buscados com sucesso:", mediumsData);

        } catch (error) {
          console.error("----------- ERRO DETALHADO DO FIREBASE -----------");
          console.error("Ocorreu um erro ao buscar os dados:", error);
          console.error("----------------------------------------------------");
          console.error("Isso geralmente indica um problema de permissão (regras do Firestore) ou que a API do Firestore não está ativada no seu projeto Google Cloud.");
        } finally {
          setIsLoaded(true);
        }
      } else {
        console.warn("Configuração do Firebase não encontrada. Os dados não serão salvos na nuvem.");
        setIsLoaded(true);
      }
    };

    fetchData();
  }, []);

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
      createdAt: new Date(),
    };
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            const docRef = await addDoc(collection(db, MEDIUMS_COLLECTION), newMedium);
            // Manually update state after adding
            setMediums(prev => [...prev, {...newMedium, id: docRef.id} as Medium]);
        } catch (error) {
            console.error("Erro ao adicionar médium: ", error);
        }
    } else {
        // Fallback para localStorage se o Firebase não estiver configurado
        setMediums(prev => [...prev, {...newMedium, id: `local-${Date.now()}`}]);
    }
  }, []);

  const removeMedium = useCallback(async (mediumId: string) => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await deleteDoc(doc(db, MEDIUMS_COLLECTION, mediumId));
             // Manually update state after removing
            setMediums(prev => prev.filter(m => m.id !== mediumId));
        } catch (error) {
            console.error("Erro ao remover médium: ", error);
        }
    } else {
        setMediums(prev => prev.filter(m => m.id !== mediumId));
    }
  }, []);

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
             // Manually update state
            setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
        } catch (error) {
            console.error("Erro ao adicionar consulente: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
    }
  }, [mediums]);

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
             // Manually update state
            setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
        } catch (error) {
            console.error("Erro ao remover consulente: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
    }
  }, [mediums]);
  
  const toggleMediumPresence = useCallback(async (mediumId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;

    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
                isPresent: !medium.isPresent,
            });
             // Manually update state
            setMediums(prev => prev.map(m => m.id === mediumId ? {...m, isPresent: !m.isPresent} : m));
        } catch (error) {
            console.error("Erro ao alternar presença do médium: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => m.id === mediumId ? {...m, isPresent: !m.isPresent} : m));
    }
  }, [mediums]);

  const toggleEntityAvailability = useCallback(async (mediumId: string, entityId: string) => {
    const mediumToUpdate = mediums.find(m => m.id === mediumId);
    if (!mediumToUpdate) return;

    const updatedEntities = mediumToUpdate.entities.map(entity => {
      if (entity.id === entityId) {
        return { ...entity, isAvailable: !entity.isAvailable };
      }
      return entity;
    });

    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
                entities: updatedEntities,
            });
             // Manually update state
            setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
        } catch (error) {
            console.error("Erro ao alternar disponibilidade da entidade: ", error);
        }
    } else {
        setMediums(prev => prev.map(m => m.id === mediumId ? {...m, entities: updatedEntities} : m));
    }
  }, [mediums]);

  const updateMedium = useCallback(async (mediumId: string, updatedData: Partial<Pick<Medium, 'name' | 'entities'>>) => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            const mediumRef = doc(db, MEDIUMS_COLLECTION, mediumId);
            await updateDoc(mediumRef, updatedData);
            // Manually update state
             setMediums(prev => prev.map(m => {
                if (m.id === mediumId) {
                    return { ...m, ...updatedData } as Medium;
                }
                return m;
            }));
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
  }, [mediums]);

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
