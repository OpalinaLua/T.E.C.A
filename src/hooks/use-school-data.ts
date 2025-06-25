"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Medium, Entity, Consulente } from '@/lib/types';

const MEDIUMS_COLLECTION = 'mediums';

export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // A verificação `db.app` garante que o Firestore só será consultado 
    // se a configuração do Firebase estiver preenchida.
    if (db && db.app.options.projectId) {
      const mediumsCollection = collection(db, MEDIUMS_COLLECTION);
      const q = query(mediumsCollection, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mediumsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Medium[];
        setMediums(mediumsData);
        setIsLoaded(true);
      }, (error) => {
        console.error("Erro ao buscar médiuns:", error);
        console.error("Verifique se as regras de segurança do Firestore permitem leitura da coleção 'mediums'.");
        setIsLoaded(true);
      });

      return () => unsubscribe();
    } else {
        console.warn("Configuração do Firebase não encontrada em src/lib/firebase.ts. Os dados não serão salvos na nuvem.");
        setIsLoaded(true);
    }
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
    try {
      await addDoc(collection(db, MEDIUMS_COLLECTION), newMedium);
    } catch (error) {
      console.error("Erro ao adicionar médium: ", error);
    }
  }, []);

  const removeMedium = useCallback(async (mediumId: string) => {
    try {
      await deleteDoc(doc(db, MEDIUMS_COLLECTION, mediumId));
    } catch (error) {
      console.error("Erro ao remover médium: ", error);
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
          consulentes: [...entity.consulentes, newConsulente],
        };
      }
      return entity;
    });

    try {
      await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
        entities: updatedEntities,
      });
    } catch (error) {
      console.error("Erro ao adicionar consulente: ", error);
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

    try {
      await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
        entities: updatedEntities,
      });
    } catch (error) {
      console.error("Erro ao remover consulente: ", error);
    }
  }, [mediums]);
  
  const toggleMediumPresence = useCallback(async (mediumId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;
    try {
      await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
        isPresent: !medium.isPresent,
      });
    } catch (error) {
      console.error("Erro ao alternar presença do médium: ", error);
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

    try {
      await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
        entities: updatedEntities,
      });
    } catch (error) {
      console.error("Erro ao alternar disponibilidade da entidade: ", error);
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
  };
}
