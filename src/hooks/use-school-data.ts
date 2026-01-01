

/**
 * @fileoverview Hook personalizado para gerenciar os dados da escola.
 * Este hook encapsula a lógica de estado, comunicando-se em tempo real
 * com o banco de dados Firebase Firestore para carregar, salvar e
 * sincronizar os dados entre dispositivos.
 */
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Medium, Entity, Consulente, Category, MediumRole, ConsulenteStatus, GiraHistoryEntry } from '@/lib/types';
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
  
  const [error, setError] = useState<string | null>(null);


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
      setError("A conexão com o banco de dados não foi estabelecida.");
      mediumsLoaded = selectedCategoriesLoaded = spiritualCategoriesLoaded = true;
      updateLoadingState();
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
    }, (err) => {
      console.error("----------- ERRO DE CONEXÃO DO FIREBASE (Médiuns) -----------", err);
      setError("Não foi possível conectar ao banco de dados para buscar os médiuns.");
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
    }, (err) => {
      console.error("----------- ERRO DE CONEXÃO DO FIREBASE (Gira) -----------", err);
      setError("Não foi possível carregar as configurações da gira.");
      selectedCategoriesLoaded = true; // Marca como carregado mesmo com erro
      updateLoadingState();
    });

    // Listener para Categorias Espirituais (disponíveis e ordenadas)
    const categoriesDocRef = doc(db, CATEGORIES_DOC_PATH);
    const unsubscribeCategories = onSnapshot(categoriesDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const categories = Array.isArray(data.list) ? data.list : [];
        setSpiritualCategories(categories);
      } else {
        const defaultCategories = ["Exu", "Pombogira", "Malandros", "Pretos-Velhos", "Caboclos", "Boiadeiros", "Marinheiros", "Erês"];
        setDoc(categoriesDocRef, { list: defaultCategories });
        setSpiritualCategories(defaultCategories);
      }
      spiritualCategoriesLoaded = true;
      updateLoadingState();
    }, (err) => {
      console.error("----------- ERRO DE CONEXÃO DO FIREBASE (Categorias Espirituais) -----------", err);
      setError("Não foi possível carregar a lista de categorias da gira.");
      spiritualCategoriesLoaded = true; // Marca como carregado mesmo com erro
      updateLoadingState();
    });

    return () => {
      unsubscribeMediums();
      unsubscribeGira();
      unsubscribeCategories();
    };
  }, []);
  
  /**
   * Atualiza as categorias selecionadas para a gira no Firestore.
   */
  const updateSelectedCategories = useCallback(async (categories: Category[]) => {
    try {
      const giraDocRef = doc(db, 'appState', 'gira');
      await setDoc(giraDocRef, { categories: categories });
    } catch (error) {
      console.error("Erro ao atualizar a seleção da gira:", error);
      throw new Error("Não foi possível salvar a seleção da gira.");
    }
  }, []);

  /**
   * Adiciona um novo médium à coleção no Firestore.
   */
  const addMedium = useCallback(async (name: string, entities: { name: string; limit: number; category: Category }[], role?: MediumRole) => {
    if (!name.trim() || entities.length === 0) {
        throw new Error("Nome e entidades são obrigatórios.");
    }
    try {
      const newMedium: Omit<Medium, 'id' | 'createdAt'> = {
        name,
        isPresent: true,
        entities: entities.map((entity, index) => ({
          id: `entity-${Date.now()}-${index}`,
          name: entity.name,
          category: entity.category,
          consulentes: [],
          isAvailable: true,
          consulenteLimit: entity.limit,
          order: index, 
        })),
        role: role,
        createdAt: serverTimestamp() as any, // Cast to any to avoid type issues with serverTimestamp
      };

      await addDoc(collection(db, 'mediums'), newMedium);
    } catch (error) {
      console.error("Erro ao adicionar médium:", error);
      throw new Error("Não foi possível cadastrar o médium.");
    }
  }, []);

  /**
   * Remove um médium da coleção no Firestore.
   */
  const removeMedium = useCallback(async (mediumId: string) => {
    try {
      const mediumDocRef = doc(db, 'mediums', mediumId);
      await deleteDoc(mediumDocRef);
    } catch (error) {
      console.error("Erro ao remover médium:", error);
      throw new Error("Não foi possível remover o médium.");
    }
  }, []);

  /**
   * Adiciona um novo consulente a uma entidade de um médium específico. Lança erro em caso de falha.
   */
    const addConsulente = useCallback(async (consulenteName: string, mediumId: string, entityId: string): Promise<void> => {
    const trimmedConsulenteName = consulenteName.trim();
    const lowerCaseName = trimmedConsulenteName.toLowerCase();
    
    // Encontrar o médium e a entidade alvo
    const targetMedium = mediums.find(m => m.id === mediumId);
    const targetEntity = targetMedium?.entities.find(e => e.id === entityId);

    if (!targetMedium || !targetEntity) {
        throw new Error("Médium ou Entidade alvo não encontrado(a).");
    }

    let existingConsulenteLocation: { mediumId: string, entityId: string, consulente: Consulente } | null = null;
    
    // Verificar se o consulente já existe em qualquer lugar
    for (const medium of mediums) {
        for (const entity of medium.entities) {
            const consulente = entity.consulentes.find(c => c.name.toLowerCase() === lowerCaseName);
            if (consulente) {
                existingConsulenteLocation = { mediumId: medium.id, entityId: entity.id, consulente };
                break;
            }
        }
        if (existingConsulenteLocation) break;
    }

    const batch = writeBatch(db);

    try {
        const newHistoryEntry: GiraHistoryEntry = {
            date: new Date().toISOString(),
            categories: selectedCategories,
            entityName: targetEntity.name,
        };
        
        let consulenteToRegister: Consulente;

        // Se o consulente já existe, vamos movê-lo
        if (existingConsulenteLocation) {
            const { mediumId: oldMediumId, entityId: oldEntityId, consulente: oldConsulente } = existingConsulenteLocation;
            
            // Cria o novo histórico (mantém no máximo 1 entrada anterior)
            const newHistory = [newHistoryEntry, ...(oldConsulente.history || [])].slice(0, 2);
            consulenteToRegister = { ...oldConsulente, status: 'agendado', history: newHistory };
            
            // 1. Remover o consulente da lista antiga
            const oldMediumDocRef = doc(db, 'mediums', oldMediumId);
            batch.update(oldMediumDocRef, {
                [`entities`]: arrayRemove(existingConsulenteLocation) // This is tricky, easier to update the whole entities array
            });
            // Firestore SDK não tem uma forma simples de remover um item aninhado. 
            // É mais seguro ler, modificar e escrever a entidade ou o médium inteiro.
            // Para a lógica do batch, vamos ler os médiuns e reescrevê-los.
            
            // A abordagem mais simples (sem ler todos os docs) é reescrever os arrays de consulentes.
            const oldMediumData = mediums.find(m => m.id === oldMediumId);
            if (!oldMediumData) throw new Error("Médium antigo não encontrado para remoção.");

            const oldMediumEntitiesUpdated = oldMediumData.entities.map(e => {
                if (e.id === oldEntityId) {
                    return { ...e, consulentes: e.consulentes.filter(c => c.id !== oldConsulente.id) };
                }
                return e;
            });
            batch.update(oldMediumDocRef, { entities: oldMediumEntitiesUpdated });

        } else { // Consulente é novo
            consulenteToRegister = {
                id: `consulente-${Date.now()}`,
                name: trimmedConsulenteName,
                status: 'agendado',
                history: [newHistoryEntry]
            };
        }

        // 2. Adicionar o consulente à nova lista
        const newMediumDocRef = doc(db, 'mediums', mediumId);
        const newMediumEntitiesUpdated = targetMedium.entities.map(e => {
            if (e.id === entityId) {
                // Verificar limite de vagas antes de adicionar
                if (e.consulentes.length >= e.consulenteLimit) {
                    throw new Error(`A entidade "${e.name}" já atingiu o limite de vagas.`);
                }
                return { ...e, consulentes: [...e.consulentes, consulenteToRegister] };
            }
            return e;
        });
        batch.update(newMediumDocRef, { entities: newMediumEntitiesUpdated });

        await batch.commit();

    } catch(error: any) {
        console.error("Erro ao adicionar/mover consulente:", error);
        throw new Error(error.message || "Não foi possível agendar o consulente.");
    }
  }, [mediums, selectedCategories]);

  /**
   * Remove um consulente de uma entidade de um médium. Busca os dados mais recentes antes de atualizar.
   */
    const removeConsulente = useCallback(async (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => {
    // Otimisticamente atualiza a UI para uma resposta imediata
    setMediums(prevMediums => prevMediums.map(medium => {
        if (medium.id !== mediumId) return medium;
        const updatedEntities = medium.entities.map(entity => {
            if (entity.id !== entityId) return entity;
            const updatedConsulentes = entity.consulentes.filter(c => c.id !== consulenteId);
            return { ...entity, consulentes: updatedConsulentes };
        });
        return { ...medium, entities: updatedEntities };
    }));
    
    const mediumDocRef = doc(db, 'mediums', mediumId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const mediumDoc = await transaction.get(mediumDocRef);
        if (!mediumDoc.exists()) {
          throw new Error("Médium não encontrado no banco de dados.");
        }
        const currentMedium = mediumDoc.data() as Omit<Medium, 'id'>;
        const updatedEntities = currentMedium.entities.map(entity =>
          entity.id === entityId
            ? { ...entity, consulentes: entity.consulentes.filter(c => c.id !== consulenteId) }
            : entity
        );
        transaction.update(mediumDocRef, { entities: updatedEntities });
      });

    } catch(error) {
        console.error("Erro ao remover consulente:", error);
        // Em caso de erro, a sincronização do onSnapshot irá corrigir o estado da UI.
        throw new Error(`Não foi possível remover ${consulenteName}. A página será atualizada para refletir os dados corretos.`);
    }
  }, []);

  const updateConsulenteName = useCallback(async (mediumId: string, entityId: string, consulenteId: string, newName: string) => {
    const mediumDocRef = doc(db, 'mediums', mediumId);
    try {
        await runTransaction(db, async (transaction) => {
            const mediumDoc = await transaction.get(mediumDocRef);
            if (!mediumDoc.exists()) {
                throw new Error("Médium não encontrado.");
            }
            const mediumData = mediumDoc.data() as Medium;
            const updatedEntities = mediumData.entities.map(entity => {
                if (entity.id === entityId) {
                    const updatedConsulentes = entity.consulentes.map(consulente => {
                        if (consulente.id === consulenteId) {
                            return { ...consulente, name: newName };
                        }
                        return consulente;
                    });
                    return { ...entity, consulentes: updatedConsulentes };
                }
                return entity;
            });
            transaction.update(mediumDocRef, { entities: updatedEntities });
        });
    } catch (error) {
        console.error("Erro ao atualizar nome do consulente:", error);
        throw new Error("Não foi possível atualizar o nome do consulente.");
    }
  }, []);
  
  const updateConsulenteStatus = useCallback(async (mediumId: string, entityId: string, consulenteId: string, status: ConsulenteStatus) => {
    const mediumDocRef = doc(db, 'mediums', mediumId);
    try {
        await runTransaction(db, async (transaction) => {
            const mediumDoc = await transaction.get(mediumDocRef);
            if (!mediumDoc.exists()) {
                throw new Error("Médium não encontrado.");
            }
            const mediumData = mediumDoc.data() as Medium;
            const updatedEntities = mediumData.entities.map(entity => {
                if (entity.id === entityId) {
                    const updatedConsulentes = entity.consulentes.map(consulente => {
                        if (consulente.id === consulenteId) {
                            return { ...consulente, status: status };
                        }
                        return consulente;
                    });
                    return { ...entity, consulentes: updatedConsulentes };
                }
                return entity;
            });
            transaction.update(mediumDocRef, { entities: updatedEntities });
        });
    } catch (error) {
        console.error("Erro ao atualizar status do consulente:", error);
        throw new Error("Não foi possível atualizar o status do consulente.");
    }
  }, []);

  /**
   * Registra um evento de login no Firestore.
   */
  const logLoginEvent = useCallback(async (email: string | null) => {
    if (!email) {
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
      // Não joga erro para não quebrar a UI por causa de log.
    }
  }, []);

  /**
   * Limpa todo o histórico de login do Firestore.
   */
  const clearLoginHistory = useCallback(async () => {
    try {
      const historyCollectionRef = collection(db, 'loginHistory');
      const snapshot = await getDocs(historyCollectionRef);
      
      if (snapshot.empty) {
        return "Não há registros de acesso para limpar.";
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return "O histórico de acesso foi limpo.";
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      throw new Error("Não foi possível limpar o histórico de acesso.");
    }
  }, []);

  /**
   * Adiciona uma nova categoria espiritual à lista no Firestore.
   * Agora, ele adiciona a nova categoria ao final da lista existente.
   */
  const addSpiritualCategory = useCallback(async (category: string) => {
      const trimmedCategory = category.trim();
      if (!trimmedCategory) {
          throw new Error('O nome da categoria não pode ser vazio.');
      }
      const categoriesDocRef = doc(db, CATEGORIES_DOC_PATH);
      try {
          await updateDoc(categoriesDocRef, {
              list: arrayUnion(trimmedCategory)
          });
          return `Categoria "${trimmedCategory}" adicionada.`;
      } catch (error) {
          if ((error as any).code === 'not-found') {
              await setDoc(categoriesDocRef, { list: [trimmedCategory] });
              return `Categoria "${trimmedCategory}" adicionada.`;
          } else {
              console.error('Erro ao adicionar categoria:', error);
              throw new Error('Não foi possível adicionar a categoria.');
          }
      }
  }, []);


  /**
   * Remove uma categoria espiritual. A lógica transacional foi movida para esta função.
   */
  const removeSpiritualCategory = useCallback(async (category: string) => {
    try {
        await runTransaction(db, async (transaction) => {
            const categoriesDocRef = doc(db, CATEGORIES_DOC_PATH);
            const giraDocRef = doc(db, 'appState', 'gira');
            const mediumsCollectionRef = collection(db, 'mediums');
            
            // Remove a categoria da lista principal e da gira ativa
            transaction.update(categoriesDocRef, { list: arrayRemove(category) });
            transaction.update(giraDocRef, { categories: arrayRemove(category) });
            
            // Verifica se a categoria 'Sem Categoria' existe, se não, adiciona
            const categoriesDoc = await transaction.get(categoriesDocRef);
            const categoriesData = categoriesDoc.data();
            if (categoriesData && !categoriesData.list.includes('Sem Categoria')) {
                transaction.update(categoriesDocRef, { list: arrayUnion('Sem Categoria') });
            }

            // Atualiza todas as entidades que usam a categoria removida
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
        return `Categoria "${category}" removida e entidades atualizadas.`;
    } catch (error) {
        console.error('Erro ao remover categoria:', error);
        throw new Error('Não foi possível remover a categoria de forma consistente.');
    }
  }, []);


  /**
   * Atualiza a ordem da lista de categorias espirituais no Firestore.
   */
  const updateSpiritualCategoryOrder = useCallback(async (categories: Category[]) => {
      const categoriesDocRef = doc(db, CATEGORIES_DOC_PATH);
      try {
          await updateDoc(categoriesDocRef, { list: categories });
      } catch (error) {
          console.error("Erro ao atualizar a ordem das categorias:", error);
          throw new Error('Não foi possível salvar a nova ordem das categorias.');
      }
  }, []);

  /**
   * Atualiza o limite de consulentes para TODAS as entidades de TODOS os médiuns, com exceções.
   */
  const updateAllEntityLimits = useCallback(async (newLimit: number): Promise<string> => {
    if (newLimit < 0 || isNaN(newLimit)) {
        throw new Error('O limite deve ser um número igual ou maior que zero.');
    }
    
    const mediumsCollectionRef = collection(db, 'mediums');
    
    try {
        let updatedCount = 0;
        await runTransaction(db, async (transaction) => {
            const mediumsSnapshot = await getDocs(query(mediumsCollectionRef));
            
            if (mediumsSnapshot.empty) {
                return; // Sai da transação se não houver médiuns
            }

            mediumsSnapshot.forEach(mediumDoc => {
                const mediumData = mediumDoc.data() as Omit<Medium, 'id'>;

                // EXCEÇÃO 1: Ignora médiuns com cargo definido
                if (mediumData.role) {
                    return;
                }
                
                const updatedEntities = mediumData.entities.map(entity => {
                    // EXCEÇÃO 2: Ignora entidades com limite 0
                    if (entity.consulenteLimit === 0) {
                        return entity;
                    }
                    return {
                        ...entity,
                        consulenteLimit: newLimit
                    };
                });
                
                transaction.update(mediumDoc.ref, { entities: updatedEntities });
                updatedCount++;
            });
        });
        
        if (updatedCount > 0) {
           return `O limite de entidades para ${updatedCount} médiuns foi atualizado para ${newLimit}.`;
        } else {
           return 'Nenhum médium elegível para a atualização global foi encontrado.';
        }

    } catch (error) {
        console.error("Erro ao atualizar todos os limites de entidades:", error);
        throw new Error('Não foi possível atualizar os limites das entidades.');
    }
  }, []);

  /**
   * Renomeia uma categoria espiritual em toda a aplicação através de uma transação.
   */
  const updateSpiritualCategoryName = useCallback(async (oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName || trimmedNewName === oldName) {
        throw new Error("O novo nome da categoria não pode ser vazio ou igual ao antigo.");
    }
    
    try {
        await runTransaction(db, async (transaction) => {
            const categoriesDocRef = doc(db, CATEGORIES_DOC_PATH);
            const giraDocRef = doc(db, 'appState', 'gira');
            const mediumsQuery = query(collection(db, 'mediums'));

            // --- FASE DE LEITURA ---
            const categoriesDoc = await transaction.get(categoriesDocRef);
            if (!categoriesDoc.exists()) throw new Error("Documento de categorias não encontrado.");
            
            const giraDoc = await transaction.get(giraDocRef);
            const mediumsSnapshot = await getDocs(mediumsQuery); // Leitura fora da transação para obter referências

            const categoriesData = categoriesDoc.data();
            const currentCategories = categoriesData.list as Category[];
            if (currentCategories.includes(trimmedNewName)) {
                throw new Error(`A categoria "${trimmedNewName}" já existe.`);
            }
            
            const mediumsToUpdate: { ref: any, data: any }[] = [];
            for (const mediumDoc of mediumsSnapshot.docs) {
                const mediumData = mediumDoc.data() as Omit<Medium, 'id'>;
                const needsUpdate = mediumData.entities.some(e => e.category === oldName);
                if (needsUpdate) {
                    const updatedEntities = mediumData.entities.map(entity => 
                        entity.category === oldName ? { ...entity, category: trimmedNewName } : entity
                    );
                    mediumsToUpdate.push({ ref: mediumDoc.ref, data: { entities: updatedEntities } });
                }
            }

            // --- FASE DE ESCRITA ---
            // 1. Atualizar a lista de categorias mestre
            const updatedCategoriesList = currentCategories.map(c => c === oldName ? trimmedNewName : c);
            transaction.update(categoriesDocRef, { list: updatedCategoriesList });

            // 2. Atualizar a seleção da gira, se necessário
            if (giraDoc.exists()) {
                const giraData = giraDoc.data();
                const selectedGiraCategories = giraData.categories as Category[];
                if (selectedGiraCategories.includes(oldName)) {
                    const updatedGiraList = selectedGiraCategories.map(c => c === oldName ? trimmedNewName : c);
                    transaction.update(giraDocRef, { categories: updatedGiraList });
                }
            }

            // 3. Atualizar todos os médiuns afetados
            mediumsToUpdate.forEach(mediumUpdate => {
                transaction.update(mediumUpdate.ref, mediumUpdate.data);
            });
        });
        return `Categoria "${oldName}" foi renomeada para "${trimmedNewName}" em toda a aplicação.`;
    } catch (error: any) {
        console.error("Erro ao renomear categoria:", error);
        throw new Error(error.message || 'Não foi possível completar a operação.');
    }
  }, []);
  
  const saveAllManagementChanges = useCallback(async (
    mediumsToUpdate: Medium[],
    categoriesToUpdate: Category[]
  ) => {
    const batch = writeBatch(db);

    // 1. Salvar mudanças nos médiuns
    mediumsToUpdate.forEach(medium => {
        const mediumRef = doc(db, 'mediums', medium.id);
        const { id, ...dataToSave } = medium; // remove o 'id' do objeto a ser salvo
        batch.update(mediumRef, dataToSave);
    });

    // 2. Salvar mudanças nas categorias da gira selecionadas
    const giraDocRef = doc(db, 'appState', 'gira');
    batch.set(giraDocRef, { categories: categoriesToUpdate });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Erro ao salvar todas as alterações em lote:", error);
        throw new Error("Ocorreu um erro ao salvar as alterações. Tente novamente.");
    }
  }, []);

  useEffect(() => {
    if(error) {
        // This is a simple way to propagate the error to a boundary.
        // In a real app, you might use a toast or a dedicated error UI.
        throw new Error(error);
    }
  }, [error]);


  return {
    mediums,
    spiritualCategories,
    isLoaded,
    addMedium,
    removeMedium,
    addConsulente,
    removeConsulente,
    updateConsulenteName,
    logLoginEvent,
    clearLoginHistory,
    addSpiritualCategory,
    removeSpiritualCategory,
    updateSpiritualCategoryOrder,
    updateAllEntityLimits,
    updateSpiritualCategoryName,
    selectedCategories,
    updateSelectedCategories,
    saveAllManagementChanges,
    updateConsulenteStatus,
  };
}
