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

const MEDIUMS_COLLECTION = 'mediums';

export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
      console.log("Setting up Firebase real-time listener...");
      const mediumsCollection = collection(db, MEDIUMS_COLLECTION);
      const q = query(mediumsCollection, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mediumsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Medium[];
        
        setMediums(mediumsData);
        if (!isLoaded) {
          setIsLoaded(true);
        }
        console.log("Firestore real-time update received:", mediumsData);

      }, (error) => {
        console.error("----------- FIREBASE LISTENER ERROR -----------");
        console.error("An error occurred while listening for real-time updates. This is very likely a PERMISSIONS or CONFIGURATION issue with your Firebase project.");
        console.error("1. Ensure you have created a Firestore database in the Firebase Console.");
        console.error("2. Ensure your Firestore Security Rules allow read access to the 'mediums' collection. Example for testing: allow read, write: if true;");
        console.error("3. Ensure the Firestore API is enabled in your Google Cloud project.");
        console.error("Full error object:", error);
        console.error("----------------------------------------------------");
        setIsLoaded(true);
      });

      return () => {
        console.log("Cleaning up Firebase listener.");
        unsubscribe();
      };
    } else {
      console.warn("Firebase config not found or is set to placeholder values. Running in offline mode. Data will not be saved.");
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
  
  const toggleMediumPresence = useCallback(async (mediumId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;

    if (db && db.app.options.projectId && db.app.options.projectId !== 'YOUR_PROJECT_ID') {
        try {
            await updateDoc(doc(db, MEDIUMS_COLLECTION, mediumId), {
                isPresent: !medium.isPresent,
            });
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
