/**
 * @fileoverview Hook personalizado para gerenciar os dados da escola.
 * Este hook encapsula a lógica de estado, comunicando-se em tempo real
 * com o banco de dados Firebase Firestore para carregar, salvar e
 * sincronizar os dados entre dispositivos.
 */
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Medium, Entity, Consulente, Category } from '@/lib/types';
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';

/**
 * Hook para gerenciar os dados dos médiuns usando o Firebase Firestore.
 * @returns Um objeto contendo a lista de médiuns, estado de carregamento e funções para manipular os dados.
 */
export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Efeito para carregar e escutar os dados do Firestore na inicialização.
  useEffect(() => {
    setIsLoaded(false);
    if (!db) {
      console.error("A conexão com o Firebase (db) não está disponível.");
      toast({
        title: "Erro de Configuração",
        description: "A conexão com o banco de dados não foi estabelecida. Verifique o arquivo de configuração do Firebase.",
        variant: "destructive",
        duration: Infinity,
      });
      setIsLoaded(true);
      return;
    }
    
    const mediumsCollection = collection(db, 'mediums');
    const q = query(mediumsCollection, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mediumsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medium[];
      setMediums(mediumsData);
      setIsLoaded(true);
    }, (error) => {
      console.error("----------- ERRO DE CONEXÃO DO FIREBASE -----------", error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao banco de dados. Verifique a configuração do seu projeto Firebase e as regras de segurança.",
        variant: "destructive",
        duration: Infinity,
      });
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [toast]);

  /**
   * Adiciona um novo médium à coleção no Firestore.
   */
  const addMedium = useCallback(async (name: string, entities: { name: string; limit: number; category: Category }[]) => {
    if (!name.trim() || entities.length === 0) {
        toast({ title: "Erro", description: "Nome e entidades são obrigatórios.", variant: "destructive" });
        return;
    }
    try {
      const newMedium = {
        name,
        isPresent: true,
        entities: entities.map((entity, index) => ({
          id: `entity-${Date.now()}-${index}`,
          name: entity.name,
          category: entity.category,
          consulentes: [],
          isAvailable: true,
          consulenteLimit: entity.limit,
        })),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'mediums'), newMedium);
      toast({
        title: "Sucesso",
        description: `Médium ${name.trim()} foi cadastrado(a).`,
      });
    } catch (error) {
      console.error("Erro ao adicionar médium:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível cadastrar o médium.", variant: "destructive" });
    }
  }, [toast]);

  /**
   * Remove um médium da coleção no Firestore.
   */
  const removeMedium = useCallback(async (mediumId: string) => {
    try {
      const mediumDocRef = doc(db, 'mediums', mediumId);
      await deleteDoc(mediumDocRef);
      toast({
          title: "Médium Removido",
          description: `O médium foi removido com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao remover médium:", error);
      toast({ title: "Erro ao Remover", description: "Não foi possível remover o médium.", variant: "destructive" });
    }
  }, [toast]);

  /**
   * Adiciona um novo consulente a uma entidade de um médium específico.
   */
  const addConsulente = useCallback(async (consulenteName: string, mediumId: string, entityId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;

    const newConsulente: Consulente = { id: `consulente-${Date.now()}`, name: consulenteName };
    
    const updatedEntities = medium.entities.map(entity => {
      if (entity.id === entityId) {
        const consulentes = entity.consulentes || [];
        return { ...entity, consulentes: [...consulentes, newConsulente] };
      }
      return entity;
    });

    try {
        const mediumDocRef = doc(db, 'mediums', mediumId);
        await updateDoc(mediumDocRef, { entities: updatedEntities });
        toast({
          title: "Sucesso",
          description: `Consulente ${consulenteName.trim()} foi agendado(a).`,
        });
    } catch(error) {
        console.error("Erro ao adicionar consulente:", error);
        toast({ title: "Erro ao Agendar", description: "Não foi possível agendar o consulente.", variant: "destructive" });
    }
  }, [mediums, toast]);

  /**
   * Remove um consulente de uma entidade de um médium. Busca os dados mais recentes antes de atualizar.
   */
  const removeConsulente = useCallback(async (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => {
    const mediumDocRef = doc(db, 'mediums', mediumId);
    
    try {
      const docSnap = await getDoc(mediumDocRef);

      if (!docSnap.exists()) {
        throw new Error("Médium não encontrado no banco de dados.");
      }

      const currentMedium = docSnap.data() as Omit<Medium, 'id'>;

      const updatedEntities = currentMedium.entities.map(entity =>
        entity.id === entityId
          ? { ...entity, consulentes: entity.consulentes.filter(c => c.id !== consulenteId) }
          : entity
      );

      await updateDoc(mediumDocRef, { entities: updatedEntities });
      
      toast({
          title: "Consulente Removido",
          description: `${consulenteName} foi removido(a).`,
      });

    } catch(error) {
        console.error("Erro ao remover consulente:", error);
        toast({ title: "Erro ao Remover", description: `Não foi possível remover ${consulenteName}.`, variant: "destructive" });
    }
  }, [toast]);

  /**
   * Alterna o estado de presença de um médium.
   * Se o médium for marcado como ausente, todos os seus consulentes são removidos.
   */
  const toggleMediumPresence = useCallback(async (mediumId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;

    const newIsPresent = !medium.isPresent;
    const updateData: Partial<Medium> = { isPresent: newIsPresent };
    
    const hadConsulentes = medium.entities.some(e => e.consulentes?.length > 0);
    
    if (!newIsPresent) {
      updateData.entities = medium.entities.map(entity => ({ ...entity, consulentes: [] }));
    }

    try {
        const mediumDocRef = doc(db, 'mediums', mediumId);
        await updateDoc(mediumDocRef, updateData as any);
        const newStatus = newIsPresent ? 'presente' : 'ausente';
        let description = `O(a) médium ${medium.name} foi marcado(a) como ${newStatus}.`;
        if (!newIsPresent && hadConsulentes) {
          description += " Todos os consulentes agendados foram removidos.";
        }
        toast({ title: "Presença Alterada", description });
    } catch(error) {
        console.error("Erro ao alterar presença:", error);
        toast({ title: "Erro ao Atualizar", description: "Não foi possível alterar a presença do médium.", variant: "destructive" });
    }
  }, [mediums, toast]);

  /**
   * Alterna a disponibilidade de uma entidade.
   * Se a entidade ficar indisponível, seus consulentes são removidos.
   */
  const toggleEntityAvailability = useCallback(async (mediumId: string, entityId: string) => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) return;

    let entityName = '';
    const updatedEntities = medium.entities.map(entity => {
        if (entity.id !== entityId) return entity;
        
        entityName = entity.name;
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
    
    try {
        const mediumDocRef = doc(db, 'mediums', mediumId);
        await updateDoc(mediumDocRef, { entities: updatedEntities });
    } catch(error) {
        console.error("Erro ao alterar disponibilidade:", error);
        toast({ title: "Erro ao Atualizar", description: `Não foi possível alterar a disponibilidade de ${entityName}.`, variant: "destructive" });
    }
  }, [mediums, toast]);

  /**
   * Atualiza os dados de um médium (nome e entidades) no Firestore.
   */
  const updateMedium = useCallback(async (mediumId: string, updatedData: Partial<Pick<Medium, 'name' | 'entities'>>) => {
    try {
      const mediumDocRef = doc(db, 'mediums', mediumId);
      await updateDoc(mediumDocRef, updatedData);
    } catch(error) {
        console.error("Erro ao atualizar médium:", error);
        toast({ title: "Erro ao Atualizar", description: "Não foi possível salvar as alterações.", variant: "destructive" });
    }
  }, [toast]);
  
  /**
   * Registra um evento de login no Firestore.
   */
  const logLoginEvent = useCallback(async (userName: string) => {
    if (!userName.trim()) {
      toast({ title: "Erro de Auditoria", description: "O nome de usuário é obrigatório.", variant: "destructive" });
      throw new Error("Username is required");
    }
    try {
      await addDoc(collection(db, 'loginHistory'), {
        userName: userName.trim(),
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao registrar login:", error);
      toast({ title: "Erro de Auditoria", description: "Não foi possível registrar o evento de login.", variant: "destructive" });
      throw error; // Lança o erro para ser tratado pelo chamador
    }
  }, [toast]);

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
    logLoginEvent,
  };
}
