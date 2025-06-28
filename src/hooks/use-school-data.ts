/**
 * @fileoverview Hook personalizado para gerenciar os dados da escola.
 * Este hook encapsula a lógica de estado, usando o localStorage do navegador
 * para persistir os dados localmente. Isso permite que o aplicativo funcione
 * offline e mantenha os dados entre as sessões no mesmo navegador.
 * 
 * ATENÇÃO: Os dados NÃO são salvos na nuvem e não serão sincronizados
 * entre diferentes dispositivos ou navegadores. A integração com o Firebase
 * foi desativada temporariamente para resolver erros de conexão.
 */
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Medium, Entity, Consulente } from '@/lib/types';
import { useToast } from './use-toast';

const LOCAL_STORAGE_KEY = 'schoolsync-data';

/**
 * Hook para gerenciar os dados dos médiuns usando o localStorage.
 * @returns Um objeto contendo a lista de médiuns, estado de carregamento e funções para manipular os dados.
 */
export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Efeito para carregar os dados do localStorage na inicialização.
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        setMediums(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados salvos localmente.",
        variant: "destructive",
      });
    }
    setIsLoaded(true);
  }, [toast]);

  // Efeito para salvar os dados no localStorage sempre que o estado `mediums` mudar.
  useEffect(() => {
    if (!isLoaded) return; // Não salvar durante a carga inicial para evitar sobrescrever.
    try {
      // Ordena os médiuns por data de criação antes de salvar
      const sortedMediums = [...mediums].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedMediums));
    } catch (error) {
      console.error("Erro ao salvar dados no localStorage:", error);
    }
  }, [mediums, isLoaded]);

  /**
   * Adiciona um novo médium ao estado.
   */
  const addMedium = useCallback((name: string, entities: { name: string; limit: number }[]) => {
    const newMedium: Medium = {
      id: `medium-${Date.now()}`,
      name,
      isPresent: true,
      entities: entities.map((entity, index) => ({
        id: `entity-${Date.now()}-${index}`,
        name: entity.name,
        consulentes: [],
        isAvailable: true,
        consulenteLimit: entity.limit,
      })),
      createdAt: new Date().toISOString(),
    };

    setMediums(currentMediums => [...currentMediums, newMedium]);
  }, []);

  /**
   * Remove um médium do estado.
   */
  const removeMedium = useCallback((mediumId: string) => {
    setMediums(currentMediums => currentMediums.filter(m => m.id !== mediumId));
  }, []);

  /**
   * Adiciona um novo consulente a uma entidade.
   */
  const addConsulente = useCallback((consulenteName: string, mediumId: string, entityId: string) => {
    const newConsulente: Consulente = { id: `consulente-${Date.now()}`, name: consulenteName };

    setMediums(currentMediums => currentMediums.map(medium => {
      if (medium.id !== mediumId) return medium;

      const updatedEntities = medium.entities.map(entity =>
        entity.id === entityId
          ? { ...entity, consulentes: [...(entity.consulentes || []), newConsulente] }
          : entity
      );
      return { ...medium, entities: updatedEntities };
    }));
  }, []);

  /**
   * Remove um consulente de uma entidade.
   */
  const removeConsulente = useCallback((mediumId: string, entityId: string, consulenteId: string) => {
    setMediums(currentMediums => currentMediums.map(medium => {
      if (medium.id !== mediumId) return medium;

      const updatedEntities = medium.entities.map(entity =>
        entity.id === entityId
          ? { ...entity, consulentes: entity.consulentes.filter(c => c.id !== consulenteId) }
          : entity
      );
      return { ...medium, entities: updatedEntities };
    }));
  }, []);

  /**
   * Alterna o estado de presença de um médium.
   */
  const toggleMediumPresence = useCallback((mediumId: string) => {
    setMediums(currentMediums => currentMediums.map(medium => {
      if (medium.id !== mediumId) return medium;

      const newIsPresent = !medium.isPresent;
      const hadConsulentes = medium.entities.some(e => e.consulentes?.length > 0);
      let updatedEntities = medium.entities;
    
      if (!newIsPresent) {
        updatedEntities = medium.entities.map(entity => ({ ...entity, consulentes: [] }));
      }

      const newStatus = newIsPresent ? 'presente' : 'ausente';
      let description = `O(a) médium ${medium.name} foi marcado(a) como ${newStatus}.`;
      if (!newIsPresent && hadConsulentes) {
        description += " Todos os consulentes agendados foram removidos.";
      }
      toast({ title: "Presença Alterada", description });

      return { ...medium, isPresent: newIsPresent, entities: updatedEntities };
    }));
  }, [toast]);

  /**
   * Alterna a disponibilidade de uma entidade.
   */
  const toggleEntityAvailability = useCallback((mediumId: string, entityId: string) => {
    setMediums(currentMediums => currentMediums.map(medium => {
      if (medium.id !== mediumId) return medium;
      
      const updatedEntities = medium.entities.map(entity => {
        if (entity.id !== entityId) return entity;
        
        const hadConsulentes = (entity.consulentes?.length || 0) > 0;
        const newIsAvailable = !entity.isAvailable;

        const newStatus = newIsAvailable ? 'disponível' : 'indisponível';
        let description = `A entidade ${entity.name} foi marcada como ${newStatus}.`;
        if (!newIsAvailable && hadConsulentes) {
          description += " Todos os consulentes agendados foram removidos.";
        }
        toast({ title: "Disponibilidade Alterada", description });

        return { ...entity, isAvailable: newIsAvailable, consulentes: !newIsAvailable ? [] : entity.consulentes };
      });

      return { ...medium, entities: updatedEntities };
    }));
  }, [toast]);

  /**
   * Atualiza os dados de um médium (nome e entidades).
   */
  const updateMedium = useCallback((mediumId: string, updatedData: Partial<Pick<Medium, 'name' | 'entities'>>) => {
    setMediums(currentMediums => currentMediums.map(medium => 
      medium.id === mediumId ? { ...medium, ...updatedData } : medium
    ));
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
