"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Medium, Entity, Consulente } from '@/lib/types';

const SCHOOL_DATA_KEY = 'schoolSyncData';

export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(SCHOOL_DATA_KEY);
      if (item) {
        setMediums(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${SCHOOL_DATA_KEY}”:`, error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem(SCHOOL_DATA_KEY, JSON.stringify(mediums));
      } catch (error) {
        console.warn(`Error setting localStorage key “${SCHOOL_DATA_KEY}”:`, error);
      }
    }
  }, [mediums, isLoaded]);

  const addMedium = useCallback((name: string, entities: string[]) => {
    const newMedium: Medium = {
      id: `medium-${Date.now()}`,
      name,
      isPresent: true,
      entities: entities.map((entity, index) => ({
        id: `entity-${Date.now()}-${index}`,
        name: entity,
        consulentes: [],
        isAvailable: true,
      })),
    };
    setMediums(prev => [...prev, newMedium]);
  }, []);

  const addConsulente = useCallback((consulenteName: string, mediumId: string, entityId: string) => {
    const newConsulente: Consulente = {
      id: `consulente-${Date.now()}`,
      name: consulenteName,
    };
    setMediums(prev =>
      prev.map(medium => {
        if (medium.id === mediumId) {
          return {
            ...medium,
            entities: medium.entities.map(entity => {
              if (entity.id === entityId) {
                return {
                  ...entity,
                  consulentes: [...entity.consulentes, newConsulente],
                };
              }
              return entity;
            }),
          };
        }
        return medium;
      })
    );
  }, []);

  const removeConsulente = useCallback((mediumId: string, entityId: string, consulenteId: string) => {
    setMediums(prev =>
      prev.map(medium => {
        if (medium.id === mediumId) {
          return {
            ...medium,
            entities: medium.entities.map(entity => {
              if (entity.id === entityId) {
                return {
                  ...entity,
                  consulentes: entity.consulentes.filter(c => c.id !== consulenteId),
                };
              }
              return entity;
            }),
          };
        }
        return medium;
      })
    );
  }, []);
  
  const toggleMediumPresence = useCallback((mediumId: string) => {
    setMediums(prev =>
      prev.map(medium =>
        medium.id === mediumId ? { ...medium, isPresent: !medium.isPresent } : medium
      )
    );
  }, []);

  const toggleEntityAvailability = useCallback((mediumId: string, entityId: string) => {
    setMediums(prev =>
      prev.map(medium => {
        if (medium.id === mediumId) {
          return {
            ...medium,
            entities: medium.entities.map(entity => {
              if (entity.id === entityId) {
                return { ...entity, isAvailable: !entity.isAvailable };
              }
              return entity;
            }),
          };
        }
        return medium;
      })
    );
  }, []);

  return {
    mediums,
    isLoaded,
    addMedium,
    addConsulente,
    removeConsulente,
    toggleMediumPresence,
    toggleEntityAvailability,
  };
}
