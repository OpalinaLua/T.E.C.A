
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
  getDocs,
  writeBatch,
  setDoc,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';

const CATEGORIES_DOC_PATH = 'appState/spiritualCategories';

/**
 * Hook para gerenciar os dados dos médiuns usando o Firebase Firestore.
 * @returns Um objeto contendo a lista de médiuns, estado de carregamento e funções para manipular os dados.
 */
export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [spiritualCategories, setSpiritualCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Efeito para carregar e escutar os dados do Firestore na inicialização.
  useEffect(() => {
    let mediumsLoaded = false;
    let selectedCategoriesLoaded = false;
    let spiritualCategoriesLoaded = false;
    
    const updateLoadingState = () => {
      if (mediumsLoaded && selectedCategoriesLoaded && spiritualCategoriesLoaded) {
        setIsLoaded(true);
      }
    };

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
    
    // Listener para Médiuns
    const mediumsCollection = collection(db, 'mediums');
    const q = query(mediumsCollection, orderBy('createdAt', 'asc'));

    const unsubscribeMediums = onSnapshot(q, (snapshot) => {
      const mediumsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medium[];
      setMediums(mediumsData);
      mediumsLoaded = true;
      updateLoadingState();
    }, (error) => {
      console.error("----------- ERRO DE CONEXÃO DO FIREBASE (Médiuns) -----------", error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao banco de dados para buscar os médiuns.",
        variant: "destructive",
        duration: Infinity,
      });
      mediumsLoaded = true; // Marca como carregado mesmo com erro para liberar a tela
      updateLoadingState();
    });

    // Listener para Categorias da Gira (selecionadas)
    const giraDocRef = doc(db, 'appState', 'gira');
    const unsubscribeGira = onSnapshot(giraDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSelectedCategories(docSnap.data().categories || []);
      } else {
        setSelectedCategories([]);
      }
      selectedCategoriesLoaded = true;
      updateLoadingState();
    }, (error) => {
      console.error("----------- ERRO DE CONEXÃO DO FIREBASE (Gira) -----------", error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar as configurações da gira.",
        variant: "destructive",
      });
      selectedCategoriesLoaded = true; // Marca como carregado mesmo com erro
      updateLoadingState();
    });

    // Listener para Categorias Espirituais (disponíveis)
    const categoriesDocRef = doc(db, CATEGORIES_DOC_PATH);
    const unsubscribeCategories = onSnapshot(categoriesDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Garante que é um array e ordena alfabeticamente
        const categories = Array.isArray(data.list) ? data.list.sort() : [];
        setSpiritualCategories(categories);
      } else {
        // Se não existir, cria o documento com uma lista padrão
        const defaultCategories = ["Exu", "Pombogira", "Malandros", "Pretos-Velhos", "Caboclos", "Boiadeiros", "Marinheiros", "Erês"];
        setDoc(categoriesDocRef, { list: defaultCategories.sort() });
        setSpiritualCategories(defaultCategories);
      }
      spiritualCategoriesLoaded = true;
      updateLoadingState();
    }, (error) => {
      console.error("----------- ERRO DE CONEXÃO DO FIREBASE (Categorias Espirituais) -----------", error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar a lista de categorias da gira.",
        variant: "destructive",
      });
      spiritualCategoriesLoaded = true; // Marca como carregado mesmo com erro
      updateLoadingState();
    });

    return () => {
      unsubscribeMediums();
      unsubscribeGira();
      unsubscribeCategories();
    };
  }, [toast]);
  
  /**
   * Atualiza as categorias selecionadas para a gira no Firestore.
   */
  const updateSelectedCategories = useCallback(async (categories: Category[]) => {
    try {
      const giraDocRef = doc(db, 'appState', 'gira');
      await setDoc(giraDocRef, { categories: categories });
    } catch (error) {
      console.error("Erro ao atualizar a seleção da gira:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a seleção da gira.",
        variant: "destructive",
      });
    }
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
      // O toast de sucesso foi removido daqui para ser controlado pelo componente que chama.
    } catch (error) {
      console.error("Erro ao adicionar médium:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível cadastrar o médium.", variant: "destructive" });
      throw error; // Propaga o erro
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
   * Adiciona um novo consulente a uma entidade de um médium específico. Lança erro em caso de falha.
   */
  const addConsulente = useCallback(async (consulenteName: string, mediumId: string, entityId: string): Promise<void> => {
    const medium = mediums.find(m => m.id === mediumId);
    if (!medium) {
      const msg = "Médium não encontrado.";
      toast({ title: "Erro Interno", description: msg, variant: "destructive" });
      throw new Error(msg);
    }

    const entity = medium.entities.find(e => e.id === entityId);
    if (!entity) {
      const msg = "Entidade não encontrada.";
      toast({ title: "Erro Interno", description: msg, variant: "destructive" });
      throw new Error(msg);
    }
    
    const targetCategory = entity.category;
    const trimmedConsulenteName = consulenteName.trim();
    const lowerCaseConsulenteName = trimmedConsulenteName.toLowerCase();

    // Verifica se o consulente já está agendado em uma entidade da mesma categoria.
    for (const m of mediums) {
      for (const e of m.entities) {
        if (e.category === targetCategory) {
          const alreadyExists = e.consulentes.some(c => c.name.trim().toLowerCase() === lowerCaseConsulenteName);
          if (alreadyExists) {
            const errorMessage = `${trimmedConsulenteName} já está agendado(a) na categoria "${targetCategory}". Um consulente só pode ser agendado em uma entidade por categoria.`;
            toast({
              title: "Agendamento Duplicado",
              description: errorMessage,
              variant: "destructive",
              duration: 5000,
            });
            throw new Error(errorMessage);
          }
        }
      }
    }
    
    const newConsulente: Consulente = { id: `consulente-${Date.now()}`, name: trimmedConsulenteName };
    
    const updatedEntities = medium.entities.map(e => {
      if (e.id === entityId) {
        const consulentes = e.consulentes || [];
        return { ...e, consulentes: [...consulentes, newConsulente] };
      }
      return e;
    });

    try {
        const mediumDocRef = doc(db, 'mediums', mediumId);
        await updateDoc(mediumDocRef, { entities: updatedEntities });
        toast({
          title: "Sucesso",
          description: `Consulente ${trimmedConsulenteName} foi agendado(a).`,
        });
    } catch(error) {
        console.error("Erro ao adicionar consulente:", error);
        toast({ title: "Erro ao Agendar", description: "Não foi possível agendar o consulente.", variant: "destructive" });
        throw error; // Propaga o erro para ser tratado pelo chamador
    }
  }, [mediums, toast]);

  /**
   * Remove um consulente de uma entidade de um médium. Busca os dados mais recentes antes de atualizar.
   */
  const removeConsulente = useCallback(async (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => {
    const mediumDocRef = doc(db, 'mediums', mediumId);
    
    // Otimisticamente atualiza a UI
    setMediums(prevMediums => prevMediums.map(medium => {
      if (medium.id !== mediumId) return medium;
      
      const updatedEntities = medium.entities.map(entity => {
          if (entity.id !== entityId) return entity;
          return {
              ...entity,
              consulentes: entity.consulentes.filter(c => c.id !== consulenteId)
          };
      });
      
      return { ...medium, entities: updatedEntities };
    }));

    try {
      // Tenta atualizar no backend
      const mediumDoc = await getDoc(mediumDocRef);
      if (!mediumDoc.exists()) {
        throw new Error("Médium não encontrado no banco de dados.");
      }
      const currentMedium = mediumDoc.data() as Omit<Medium, 'id'>;
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
        // Reverte a UI em caso de erro. A sincronização do onSnapshot também ajudaria aqui.
        // Uma implementação mais robusta poderia buscar os dados novamente.
    }
  }, [toast]);

  /**
   * Alterna o estado de presença de um médium.
   * Se o médium for marcado como ausente, todos os seus consulentes são removidos.
   */
  const toggleMediumPresence = useCallback(async (mediumId: string) => {
    const mediumDocRef = doc(db, 'mediums', mediumId);
    try {
      await runTransaction(db, async (transaction) => {
        const mediumDoc = await transaction.get(mediumDocRef);
        if (!mediumDoc.exists()) throw new Error("Médium não encontrado.");
        
        const medium = mediumDoc.data() as Omit<Medium, 'id'>;
        const newIsPresent = !medium.isPresent;
        const updateData: any = { isPresent: newIsPresent };
        
        const hadConsulentes = medium.entities.some(e => e.consulentes?.length > 0);
        
        if (!newIsPresent) {
          updateData.entities = medium.entities.map(entity => ({ ...entity, consulentes: [] }));
        }
        
        transaction.update(mediumDocRef, updateData);

        const newStatus = newIsPresent ? 'presente' : 'ausente';
        let description = `O(a) médium ${medium.name} foi marcado(a) como ${newStatus}.`;
        if (!newIsPresent && hadConsulentes) {
          description += " Todos os consulentes agendados foram removidos.";
        }
        toast({ title: "Presença Alterada", description });
      });
    } catch(error) {
        console.error("Erro ao alterar presença:", error);
        toast({ title: "Erro ao Atualizar", description: "Não foi possível alterar a presença do médium.", variant: "destructive" });
    }
  }, [toast]);

  /**
   * Alterna a disponibilidade de uma entidade.
   * Se a entidade ficar indisponível, seus consulentes são removidos.
   */
  const toggleEntityAvailability = useCallback(async (mediumId: string, entityId: string) => {
    const mediumDocRef = doc(db, 'mediums', mediumId);
    let entityName = '';
    
    try {
      await runTransaction(db, async (transaction) => {
        const mediumDoc = await transaction.get(mediumDocRef);
        if (!mediumDoc.exists()) throw new Error("Médium não encontrado.");
        
        const medium = mediumDoc.data() as Omit<Medium, 'id'>;
        const updatedEntities = medium.entities.map(entity => {
            if (entity.id !== entityId) return entity;
            
            entityName = entity.name;
            const newIsAvailable = !entity.isAvailable;

            const newStatus = newIsAvailable ? 'disponível' : 'indisponível';
            let description = `A entidade ${entity.name} foi marcada como ${newStatus}.`;
            if (!newIsAvailable && (entity.consulentes?.length || 0) > 0) {
              description += " Todos os consulentes agendados foram removidos.";
            }
            toast({ title: "Disponibilidade Alterada", description });

            return { ...entity, isAvailable: newIsAvailable, consulentes: !newIsAvailable ? [] : entity.consulentes };
        });

        transaction.update(mediumDocRef, { entities: updatedEntities });
      });
    } catch(error) {
        console.error("Erro ao alterar disponibilidade:", error);
        toast({ title: "Erro ao Atualizar", description: `Não foi possível alterar a disponibilidade de ${entityName}.`, variant: "destructive" });
    }
  }, [toast]);

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
  const logLoginEvent = useCallback(async (email: string | null) => {
    if (!email) {
      // Não mostra toast, pois pode ser um log interno. Apenas registra o erro.
      console.error("Erro de Auditoria: O e-mail do usuário é inválido para registro.");
      return;
    }
    try {
      await addDoc(collection(db, 'loginHistory'), {
        email: email,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao registrar login:", error);
      toast({ title: "Erro de Auditoria", description: "Não foi possível registrar o evento de login.", variant: "destructive" });
    }
  }, [toast]);

  /**
   * Limpa todo o histórico de login do Firestore.
   */
  const clearLoginHistory = useCallback(async () => {
    try {
      const historyCollectionRef = collection(db, 'loginHistory');
      const snapshot = await getDocs(historyCollectionRef);
      
      if (snapshot.empty) {
        toast({ title: "Histórico Vazio", description: "Não há registros de acesso para limpar." });
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      toast({ title: "Sucesso", description: "O histórico de acesso foi limpo." });
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      toast({ title: "Erro ao Limpar", description: "Não foi possível limpar o histórico de acesso.", variant: "destructive" });
      throw error;
    }
  }, [toast]);

  /**
   * Adiciona uma nova categoria espiritual à lista no Firestore.
   */
  const addSpiritualCategory = useCallback(async (category: string) => {
    if (!category || category.trim() === '') {
        toast({ title: 'Erro', description: 'O nome da categoria não pode ser vazio.', variant: 'destructive' });
        return;
    }
    const categoriesDocRef = doc(db, CATEGORIES_DOC_PATH);
    try {
        await updateDoc(categoriesDocRef, {
            list: arrayUnion(category.trim())
        });
        toast({ title: 'Sucesso', description: `Categoria "${category.trim()}" adicionada.` });
    } catch (error) {
        console.error('Erro ao adicionar categoria:', error);
        toast({ title: 'Erro', description: 'Não foi possível adicionar a categoria.', variant: 'destructive' });
    }
  }, [toast]);

  /**
   * Remove uma categoria espiritual.
   * Esta operação é transacional para garantir a consistência dos dados:
   * 1. Remove a categoria da lista de categorias disponíveis.
   * 2. Remove a categoria da lista de categorias selecionadas para a gira atual.
   * 3. Percorre todos os médiuns e atualiza a categoria das entidades associadas para 'Sem Categoria'.
   */
  const removeSpiritualCategory = useCallback(async (category: string) => {
    try {
        await runTransaction(db, async (transaction) => {
            const categoriesDocRef = doc(db, CATEGORIES_DOC_PATH);
            const giraDocRef = doc(db, 'appState', 'gira');
            const mediumsCollectionRef = collection(db, 'mediums');
            
            // 1. Agendar remoção da lista de categorias
            transaction.update(categoriesDocRef, { list: arrayRemove(category) });
            // 2. Agendar remoção da gira atual
            transaction.update(giraDocRef, { categories: arrayRemove(category) });
            
            // 3. Ler todos os médiuns para atualizar entidades
            const mediumsSnapshot = await getDocs(query(mediumsCollectionRef));
            mediumsSnapshot.forEach(mediumDoc => {
                const mediumData = mediumDoc.data() as Omit<Medium, 'id'>;
                const hasEntitiesToUpdate = mediumData.entities.some(e => e.category === category);
                
                if (hasEntitiesToUpdate) {
                    const updatedEntities = mediumData.entities.map(entity => 
                        entity.category === category ? { ...entity, category: 'Sem Categoria' as Category } : entity
                    );
                    transaction.update(mediumDoc.ref, { entities: updatedEntities });
                }
            });
        });
        toast({ title: 'Sucesso', description: `Categoria "${category}" removida.` });
    } catch (error) {
        console.error('Erro ao remover categoria:', error);
        toast({ title: 'Erro na Transação', description: 'Não foi possível remover a categoria de forma consistente.', variant: 'destructive' });
    }
}, [toast]);

  return {
    mediums,
    spiritualCategories,
    isLoaded,
    addMedium,
    removeMedium,
    addConsulente,
    removeConsulente,
    toggleMediumPresence,
    toggleEntityAvailability,
    updateMedium,
    logLoginEvent,
    clearLoginHistory,
    addSpiritualCategory,
    removeSpiritualCategory,
    selectedCategories,
    updateSelectedCategories,
  };
}

    