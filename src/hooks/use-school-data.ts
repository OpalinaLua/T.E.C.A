
/**
 * @fileoverview Hook personalizado para gerenciar os dados da escola.
 * Este hook encapsula a lógica de estado, comunicando-se em tempo real
 * com o banco de dados Firebase Firestore para carregar, salvar e
 * sincronizar os dados entre dispositivos.
 */
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Medium, Entity, Consulente, Category, MediumRole, ConsulenteStatus } from '@/lib/types';
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
import { ADMIN_EMAILS, SUPER_ADMINS, BOOTSTRAP_SUPER_ADMINS } from '@/lib/secrets';

const CATEGORIES_DOC_PATH = 'appState/spiritualCategories';
const PERMISSIONS_DOC_PATH = 'appState/permissions';

interface Permissions {
    admins: string[];
    superAdmins: string[];
}

/**
 * Hook para gerenciar os dados dos médiuns usando o Firebase Firestore.
 * @returns Um objeto contendo a lista de médiuns, estado de carregamento e funções para manipular os dados.
 */
export function useSchoolData() {
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [spiritualCategories, setSpiritualCategories] = useState<Category[]>([]);
  const [permissions, setPermissions] = useState<Permissions>({ admins: [], superAdmins: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [error, setError] = useState<string | null>(null);


  // Efeito para carregar e escutar os dados do Firestore na inicialização.
  useEffect(() => {
    let mediumsLoaded = false;
    let selectedCategoriesLoaded = false;
    let spiritualCategoriesLoaded = false;
    let permissionsLoaded = false;
    
    const updateLoadingState = () => {
      if (mediumsLoaded && selectedCategoriesLoaded && spiritualCategoriesLoaded && permissionsLoaded) {
        setIsLoaded(true);
      }
    };

    if (!db) {
      console.error("A conexão com o Firebase (db) não está disponível.");
      setError("A conexão com o banco de dados não foi estabelecida.");
      mediumsLoaded = selectedCategoriesLoaded = spiritualCategoriesLoaded = permissionsLoaded = true;
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
    
     // Listener para Permissões
    const permissionsDocRef = doc(db, PERMISSIONS_DOC_PATH);
    const unsubscribePermissions = onSnapshot(permissionsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setPermissions({
                admins: data.admins || [],
                superAdmins: data.superAdmins || [],
            });
        } else {
            // LÓGICA DE MIGRAÇÃO: Se o documento não existe, cria-o com os dados do secrets.ts
            const initialAdmins = [...new Set([...ADMIN_EMAILS])];
            const initialSuperAdmins = [...new Set([...BOOTSTRAP_SUPER_ADMINS, ...SUPER_ADMINS])];
            
            setDoc(permissionsDocRef, { admins: initialAdmins, superAdmins: initialSuperAdmins });
            setPermissions({ admins: initialAdmins, superAdmins: initialSuperAdmins });
        }
        permissionsLoaded = true;
        updateLoadingState();
    }, (err) => {
        console.error("----------- ERRO DE CONEXÃO DO FIREBASE (Permissões) -----------", err);
        setError("Não foi possível carregar as permissões de usuário.");
        permissionsLoaded = true; // Libera a tela mesmo com erro
        updateLoadingState();
    });


    return () => {
      unsubscribeMediums();
      unsubscribeGira();
      unsubscribeCategories();
      unsubscribePermissions();
    };
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
        const trimmedName = consulenteName.trim();
        if (!trimmedName) throw new Error("O nome do consulente não pode ser vazio.");

        const mediumDocRef = doc(db, 'mediums', mediumId);
        
        try {
            await runTransaction(db, async (transaction) => {
                const mediumDoc = await transaction.get(mediumDocRef);
                if (!mediumDoc.exists()) {
                    throw new Error("Médium não encontrado.");
                }

                const mediumData = mediumDoc.data() as Omit<Medium, 'id'>;
                const entityIndex = mediumData.entities.findIndex(e => e.id === entityId);
                
                if (entityIndex === -1) {
                    throw new Error("Entidade não encontrada.");
                }
                
                const entity = mediumData.entities[entityIndex];
                if (entity.consulentes.length >= entity.consulenteLimit) {
                    throw new Error(`A entidade "${entity.name}" já atingiu o limite de vagas.`);
                }

                const newConsulente: Consulente = {
                    id: `consulente-${Date.now()}`,
                    name: trimmedName,
                    status: 'agendado'
                };
                
                const newEntities = [...mediumData.entities];
                newEntities[entityIndex] = {
                    ...entity,
                    consulentes: [...entity.consulentes, newConsulente]
                };

                transaction.update(mediumDocRef, { entities: newEntities });
            });
        } catch(error: any) {
            console.error("Erro ao adicionar consulente:", error);
            // Re-throw o erro para ser capturado pela UI
            throw new Error(error.message || "Não foi possível agendar o consulente.");
        }
  }, []);

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
  
  const updateSelectedCategories = useCallback(async (categories: Category[]) => {
      // Esta função agora apenas atualiza o estado local.
      // A persistência será feita pelo saveAllManagementChanges.
      setSelectedCategories(categories);
  }, []);

  const archiveAndResetGira = useCallback(async () => {
    // 1. Calcular o resumo da gira atual
    const attendanceSummary = mediums
      .map(medium => {
        const attendedCount = medium.entities.reduce((acc, entity) => {
          return acc + entity.consulentes.filter(c => c.status === 'atendido').length;
        }, 0);
        return { mediumName: medium.name, attendedCount };
      })
      .filter(summary => summary.attendedCount > 0);

    const totalAttended = attendanceSummary.reduce((acc, summary) => acc + summary.attendedCount, 0);

    if (totalAttended === 0) {
      throw new Error("Nenhum consulente foi marcado como 'atendido'. Nada para arquivar.");
    }

    const batch = writeBatch(db);

    // 2. Criar novo documento na coleção 'giraHistory'
    const historyRef = doc(collection(db, 'giraHistory'));
    batch.set(historyRef, {
      date: serverTimestamp(),
      summary: attendanceSummary,
      totalAttended: totalAttended,
    });

    // 3. Limpar os consulentes de todos os médiuns
    mediums.forEach(medium => {
      const mediumRef = doc(db, 'mediums', medium.id);
      const clearedEntities = medium.entities.map(entity => ({
        ...entity,
        consulentes: [],
      }));
      batch.update(mediumRef, { entities: clearedEntities });
    });

    // 4. Executar o batch
    try {
      await batch.commit();
      return `Gira arquivada com ${totalAttended} atendimentos. Os agendamentos foram limpos.`;
    } catch (error) {
      console.error("Erro ao arquivar e resetar a gira:", error);
      throw new Error("Ocorreu um erro ao arquivar a gira. Tente novamente.");
    }
  }, [mediums]);

  // --- Funções de Gerenciamento de Permissões ---

    const addAdmin = useCallback(async (email: string) => {
        const permissionsDocRef = doc(db, PERMISSIONS_DOC_PATH);
        await updateDoc(permissionsDocRef, { admins: arrayUnion(email) });
        return `E-mail ${email} adicionado como Administrador.`;
    }, []);

    const removeAdmin = useCallback(async (email: string) => {
        const permissionsDocRef = doc(db, PERMISSIONS_DOC_PATH);
        await updateDoc(permissionsDocRef, { admins: arrayRemove(email) });
        return `E-mail ${email} removido da lista de Administradores.`;
    }, []);

    const addSuperAdmin = useCallback(async (email: string) => {
        const permissionsDocRef = doc(db, PERMISSIONS_DOC_PATH);
        await updateDoc(permissionsDocRef, { superAdmins: arrayUnion(email) });
        return `E-mail ${email} promovido a Super Administrador.`;
    }, []);

    const removeSuperAdmin = useCallback(async (email: string) => {
        const permissionsDocRef = doc(db, PERMISSIONS_DOC_PATH);
        // Garante que o bootstrap admin não pode ser removido
        if (BOOTSTRAP_SUPER_ADMINS.includes(email)) {
            throw new Error("O super administrador principal não pode ser removido.");
        }
        await updateDoc(permissionsDocRef, { superAdmins: arrayRemove(email) });
        return `E-mail ${email} removido da lista de Super Administradores.`;
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
    archiveAndResetGira,
    permissions,
    addAdmin,
    removeAdmin,
addSuperAdmin,
    removeSuperAdmin,
  };
}

    