
# Resumo do Código do Projeto

Aqui está um resumo de todos os arquivos de código importantes do seu projeto. Você pode usar este arquivo para copiar e colar o código em seu ambiente de desenvolvimento local, como o VS Code.

---

## `src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'T.E.C.A',
  description: 'Uma forma simples para consulência.',
  applicationName: 'T.E.C.A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'T.E.C.A',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={ptSans.variable}>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---

## `src/app/page.tsx`

```tsx
"use client";

import { useSchoolData } from '@/hooks/use-school-data';
import { SchoolOverview } from '@/components/school-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { MediumRegistration } from '@/components/teacher-registration';
import { ConsulenteRegistration } from '@/components/student-registration';

// --- Componente Principal da Página ---
// Este é o componente que renderiza a página inicial do aplicativo.
// Ele utiliza o hook `useSchoolData` para obter e manipular os dados
// e organiza a interface em três seções principais:
// 1. Cadastro de Médiuns
// 2. Agendamento de Consulentes
// 3. Visão Geral dos Médiuns (presentes e ausentes)
export default function Home() {
  const {
    mediums,
    isLoaded,
    addMedium,
    removeMedium,
    addConsulente,
    removeConsulente,
    toggleMediumPresence,
    toggleEntityAvailability,
    updateMedium,
  } = useSchoolData();

  // Exibe um esqueleto de carregamento enquanto os dados do Firebase são buscados.
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-16 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-12 w-1/4 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-5xl font-bold font-headline text-primary">
            T.E.C.A
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Uma forma simples para consulência.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Coluna da esquerda com os formulários de cadastro */}
          <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
            <MediumRegistration addMedium={addMedium} />
            <ConsulenteRegistration mediums={mediums} addConsulente={addConsulente} />
          </aside>
          
          {/* Coluna da direita com a exibição dos médiuns */}
          <div className="lg:col-span-2">
            <SchoolOverview
              mediums={mediums}
              removeMedium={removeMedium}
              removeConsulente={removeConsulente}
              toggleMediumPresence={toggleMediumPresence}
              toggleEntityAvailability={toggleEntityAvailability}
              updateMedium={updateMedium}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
```

---

## `src/hooks/use-school-data.ts`

```ts
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
```

---

## `src/components/school-overview.tsx`

```tsx
"use client";

import type { Medium } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { LogIn } from 'lucide-react';
import { MediumCard } from './teacher-card';


// --- Componente: Visão Geral da Escola ---
// Este componente é responsável por exibir as listas de médiuns,
// separando-os em "Presentes" e "Ausentes".
interface SchoolOverviewProps {
  mediums: Medium[];
  removeMedium: (mediumId: string) => void;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
  updateMedium: (mediumId: string, data: { name?: string; entities?: any[] }) => void;
}

export function SchoolOverview({ mediums, removeMedium, removeConsulente, toggleMediumPresence, toggleEntityAvailability, updateMedium }: SchoolOverviewProps) {
  // Filtra a lista de médiuns para criar listas separadas de presentes e ausentes.
  const presentMediums = mediums.filter(m => m.isPresent);
  const absentMediums = mediums.filter(m => !m.isPresent);

  return (
    <div className="space-y-8">
      {/* Seção de Médiuns Presentes */}
      <div>
        <h2 className="text-3xl font-bold font-headline mb-4">Médiuns Presentes</h2>
        {presentMediums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mapeia a lista de médiuns presentes para renderizar um MediumCard para cada um. */}
            {presentMediums.map(medium => (
              <MediumCard
                key={medium.id}
                medium={medium}
                removeMedium={removeMedium}
                removeConsulente={removeConsulente}
                toggleMediumPresence={toggleMediumPresence}
                toggleEntityAvailability={toggleEntityAvailability}
                updateMedium={updateMedium}
              />
            ))}
          </div>
        ) : (
          // Mensagem exibida quando não há médiuns presentes.
          <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum médium está marcado como presente no momento.</h3>
          </div>
        )}
      </div>

      {/* Seção de Médiuns Ausentes (só aparece se houver algum) */}
      {absentMediums.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold font-headline mb-4">Médiuns Ausentes</h2>
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {absentMediums.map(medium => (
                  <li key={medium.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 group">
                    <span className="text-secondary-foreground">{medium.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => toggleMediumPresence(medium.id)}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Marcar como Presente
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```

---

## `src/components/teacher-card.tsx`

```tsx
"use client";

import { useState } from 'react';
import type { Medium, Entity } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserX, Eye, EyeOff, LogOut, LogIn, Trash2, Pencil, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// --- Interface de Propriedades para o Card do Médium ---
interface MediumCardProps {
  medium: Medium;
  removeMedium: (mediumId: string) => void;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
  updateMedium: (mediumId: string, data: { name?: string; entities?: Entity[] }) => void;
}

// --- Componente: Card do Médium ---
// Exibe todas as informações de um médium, suas entidades e consulentes.
// Permite realizar ações como editar, excluir, marcar presença e alterar disponibilidade.
export function MediumCard({ medium, removeMedium, removeConsulente, toggleMediumPresence, toggleEntityAvailability, updateMedium }: MediumCardProps) {
  const { toast } = useToast();

  // --- Estados para o formulário de edição ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Estado para o nome do médium editado
  const [editedName, setEditedName] = useState(medium.name);
  // Estado para a lista de entidades editadas (uma cópia profunda para evitar mutação direta)
  const [editedEntities, setEditedEntities] = useState<Entity[]>(JSON.parse(JSON.stringify(medium.entities)));

  // --- Funções de Manipulação (Handlers) ---

  // Lida com a remoção do médium.
  const handleRemoveMedium = () => {
    removeMedium(medium.id);
    toast({
        title: "Médium Removido",
        description: `O médium ${medium.name} foi removido com sucesso.`,
    })
  };

  // Lida com a remoção de um consulente.
  const handleRemoveConsulente = (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => {
    removeConsulente(mediumId, entityId, consulenteId);
    toast({
        title: "Consulente Removido",
        description: `${consulenteName} foi removido(a).`,
    })
  };
  
  // Lida com a mudança de nome de uma entidade no modo de edição.
  const handleEntityNameChange = (entityId: string, newName: string) => {
    setEditedEntities(currentEntities => 
      currentEntities.map(e => e.id === entityId ? { ...e, name: newName } : e)
    );
  };
  
  // Lida com a remoção de uma entidade no modo de edição.
  const handleRemoveEntityFromEdit = (entityId: string) => {
      const entity = editedEntities.find(e => e.id === entityId);
      // Impede a remoção se a entidade tiver consulentes.
      if (entity && entity.consulentes.length > 0) {
          toast({
              title: "Ação não permitida",
              description: `Não é possível remover a entidade "${entity.name}" pois ela possui consulentes agendados.`,
              variant: "destructive"
          });
          return;
      }
      setEditedEntities(currentEntities => currentEntities.filter(e => e.id !== entityId));
  }
  
  // Lida com a adição de uma nova entidade no modo de edição.
  const handleAddEntityToEdit = () => {
      setEditedEntities(currentEntities => [
          ...currentEntities,
          {
              id: `entity-${Date.now()}`,
              name: "Nova Entidade",
              consulentes: [],
              isAvailable: true,
          }
      ])
  }

  // Lida com o salvamento das alterações feitas no formulário de edição.
  const handleUpdate = () => {
    // Validações básicas.
    if (editedName.trim() === '') {
      toast({ title: "Erro", description: "O nome do médium não pode ser vazio.", variant: "destructive" });
      return;
    }
    if (editedEntities.some(e => e.name.trim() === '')) {
      toast({ title: "Erro", description: "O nome da entidade não pode ser vazio.", variant: "destructive" });
      return;
    }
    
    // Verifica se houve alguma mudança real para evitar escritas desnecessárias no banco.
    const nameChanged = editedName !== medium.name;
    const entitiesChanged = JSON.stringify(editedEntities) !== JSON.stringify(medium.entities);

    if (nameChanged || entitiesChanged) {
        updateMedium(medium.id, { name: editedName, entities: editedEntities });
        toast({
            title: "Médium Atualizado",
            description: `Os dados de ${editedName} foram atualizados.`,
        });
    }

    setIsEditDialogOpen(false); // Fecha o diálogo de edição.
  }

  // Reseta os estados de edição para os valores originais caso o usuário cancele a edição.
  const resetEditState = () => {
      setEditedName(medium.name);
      setEditedEntities(JSON.parse(JSON.stringify(medium.entities)));
  }

  return (
    <Card className="flex flex-col h-full transition-all duration-300 ease-in-out">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline text-2xl">{medium.name}</CardTitle>
          <CardDescription>
            <Badge variant="outline" className={medium.isPresent ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}>
              {medium.isPresent ? 'Presente' : 'Ausente'}
            </Badge>
          </CardDescription>
        </div>
        {/* Container para os botões de ação */}
        <div className="flex items-center">
            {/* Diálogo de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
              if (!open) resetEditState(); // Reseta o estado se o diálogo for fechado.
              setIsEditDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-5 w-5" />
                  <span className="sr-only">Editar Médium</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Editar Médium</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Campo de edição do nome */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nome
                    </Label>
                    <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" />
                  </div>
                  {/* Seção de edição das entidades */}
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Entidades</Label>
                    <div className="col-span-3 space-y-2">
                      {editedEntities.map((entity) => (
                        <div key={entity.id} className="flex items-center gap-2">
                          <Input value={entity.name} onChange={(e) => handleEntityNameChange(entity.id, e.target.value)} />
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveEntityFromEdit(entity.id)} className="shrink-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={handleAddEntityToEdit} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Entidade
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleUpdate}>Salvar Alterações</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Diálogo para Alternar Presença */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  {medium.isPresent ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                  <span className="sr-only">Alternar Presença</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso marcará o(a) médium como {medium.isPresent ? 'ausente' : 'presente'}.
                    {/* Mensagem de aviso adicional */}
                    {medium.isPresent && (medium.entities.some(e => e.consulentes?.length > 0)) && ' Ao fazer isso, todos os consulentes agendados para este médium serão removidos.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => toggleMediumPresence(medium.id)}>
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {/* Diálogo para Remover Médium */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive">
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Remover Médium</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso removerá permanentemente o médium e todos os seus consulentes agendados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMedium} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {/* Mapeia e exibe as entidades e seus consulentes */}
        {medium.entities && medium.entities.map((entity, index) => (
          <div key={entity.id} className={cn(!entity.isAvailable && "opacity-60")}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex justify-between items-center mb-2">
              <h3 className={cn("font-semibold text-lg", !entity.isAvailable && "line-through")}>{entity.name}</h3>
              {/* Diálogo para Alternar Disponibilidade da Entidade */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation() }}>
                    {entity.isAvailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">Alterar Disponibilidade da Entidade</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alterar Disponibilidade?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso marcará a entidade "{entity.name}" como {entity.isAvailable ? 'indisponível' : 'disponível'}.
                      {/* Mensagem de aviso adicional */}
                      {entity.isAvailable && (entity.consulentes?.length > 0) && ' Ao fazer isso, todos os consulentes agendados para esta entidade serão removidos.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => toggleEntityAvailability(medium.id, entity.id)}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {/* Lista de Consulentes */}
            {entity.consulentes.length > 0 ? (
              <ul className="space-y-2">
                {entity.consulentes.map(consulente => (
                  <li key={consulente.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 group">
                    <span className="text-secondary-foreground">{consulente.name}</span>
                    {/* Diálogo para Remover Consulente */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" disabled={!entity.isAvailable}>
                            <UserX className="h-4 w-4" />
                            <span className="sr-only">Excluir consulente</span>
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Consulente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza de que deseja remover {consulente.name} desta entidade?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveConsulente(medium.id, entity.id, consulente.id, consulente.name)} className="bg-destructive text-destructive-foreground">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum consulente agendado.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

## `src/components/teacher-registration.tsx`

```tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Interface de Propriedades ---
interface MediumRegistrationProps {
  // Função recebida do componente pai para adicionar um novo médium.
  addMedium: (name: string, entities: string[]) => void;
}

// --- Componente: Cadastro de Médium ---
// Este componente renderiza um formulário para que o usuário possa cadastrar
// um novo médium, especificando seu nome e uma ou mais entidades.
export function MediumRegistration({ addMedium }: MediumRegistrationProps) {
  const [name, setName] = useState('');
  const [currentEntity, setCurrentEntity] = useState('');
  const [entities, setEntities] = useState<string[]>([]);
  const { toast } = useToast();

  // Adiciona uma entidade à lista de entidades do novo médium.
  const handleAddEntity = () => {
    // Garante que a entidade não está vazia e não é duplicada.
    if (currentEntity.trim() && !entities.includes(currentEntity.trim())) {
      setEntities([...entities, currentEntity.trim()]);
      setCurrentEntity(''); // Limpa o campo de input.
    }
  };

  // Remove uma entidade da lista.
  const handleRemoveEntity = (entityToRemove: string) => {
    setEntities(entities.filter(s => s !== entityToRemove));
  };

  // Lida com o envio do formulário.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Valida se o nome e pelo menos uma entidade foram fornecidos.
    if (name.trim() && entities.length > 0) {
      addMedium(name.trim(), entities);
      // Limpa todos os campos do formulário após o sucesso.
      setName('');
      setEntities([]);
      setCurrentEntity('');
      toast({
        title: "Sucesso",
        description: `Médium ${name.trim()} foi cadastrado(a).`,
      });
    } else {
        // Exibe uma mensagem de erro se a validação falhar.
        toast({
            title: "Erro",
            description: "Por favor, forneça um nome para o médium e pelo menos uma entidade.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastro de Médium</CardTitle>
        <CardDescription>Adicione um novo médium e suas entidades ao sistema.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Campo para o nome do médium */}
          <div className="space-y-2">
            <label htmlFor="medium-name" className="text-sm font-medium">Nome do Médium</label>
            <Input
              id="medium-name"
              placeholder="ex: Médium João"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {/* Campo para adicionar entidades */}
          <div className="space-y-2">
            <label htmlFor="entity-name" className="text-sm font-medium">Entidades</label>
            <div className="flex gap-2">
              <Input
                id="entity-name"
                placeholder="ex: Pombagira"
                value={currentEntity}
                onChange={(e) => setCurrentEntity(e.target.value)}
                onKeyDown={(e) => {
                    // Permite adicionar a entidade pressionando Enter.
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEntity();
                    }
                }}
              />
              <Button type="button" onClick={handleAddEntity} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Adicionar Entidade</span>
              </Button>
            </div>
          </div>
          {/* Exibição das entidades já adicionadas */}
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {entity}
                <button type="button" onClick={() => handleRemoveEntity(entity)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remover {entity}</span>
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Cadastrar Médium</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

---

## `src/components/student-registration.tsx`

```tsx
"use client";

import { useState, useMemo } from 'react';
import type { Medium } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

// --- Interface de Propriedades ---
interface ConsulenteRegistrationProps {
  mediums: Medium[];
  addConsulente: (consulenteName: string, mediumId: string, entityId: string) => void;
}

// --- Componente: Agendamento de Consulente ---
// Renderiza um formulário para agendar um novo consulente com um médium e entidade
// que estejam disponíveis no momento.
export function ConsulenteRegistration({ mediums, addConsulente }: ConsulenteRegistrationProps) {
  // Estados para os campos do formulário.
  const [name, setName] = useState('');
  const [selectedMediumId, setSelectedMediumId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const { toast } = useToast();

  // `useMemo` otimiza o cálculo das listas de médiuns e entidades disponíveis,
  // refazendo o cálculo apenas quando a lista principal de médiuns muda.

  // Filtra apenas os médiuns que estão presentes e têm pelo menos uma entidade disponível.
  const availableMediums = useMemo(() => mediums.filter(t => t.isPresent && t.entities && t.entities.some(s => s.isAvailable)), [mediums]);
  
  // Filtra as entidades disponíveis do médium que foi selecionado.
  const availableEntities = useMemo(() => {
    const medium = availableMediums.find(t => t.id === selectedMediumId);
    return medium ? medium.entities.filter(s => s.isAvailable) : [];
  }, [availableMediums, selectedMediumId]);

  // Atualiza o médium selecionado e reseta a seleção de entidade.
  const handleMediumChange = (mediumId: string) => {
    setSelectedMediumId(mediumId);
    setSelectedEntityId('');
  }

  // Lida com o envio do formulário de agendamento.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Valida se todos os campos foram preenchidos.
    if (name.trim() && selectedMediumId && selectedEntityId) {
      addConsulente(name.trim(), selectedMediumId, selectedEntityId);
      // Limpa o formulário após o sucesso.
      setName('');
      setSelectedMediumId('');
      setSelectedEntityId('');
      toast({
        title: "Sucesso",
        description: `Consulente ${name.trim()} foi agendado(a).`,
      });
    } else {
        toast({
            title: "Erro",
            description: "Por favor, preencha todos os campos para agendar um consulente.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agendamento de Consulente</CardTitle>
        <CardDescription>Agende um consulente com um médium e entidade disponíveis.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Campo para o nome do consulente */}
          <div className="space-y-2">
            <label htmlFor="consulente-name" className="text-sm font-medium">Nome do Consulente</label>
            <Input
              id="consulente-name"
              placeholder="ex: Maria da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {/* Seletor de Médium */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Médium</label>
            <Select onValueChange={handleMediumChange} value={selectedMediumId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um(a) médium" />
              </SelectTrigger>
              <SelectContent>
                {availableMediums.map(medium => (
                  <SelectItem key={medium.id} value={medium.id}>{medium.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Seletor de Entidade (habilitado apenas após selecionar um médium) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Entidade</label>
            <Select onValueChange={setSelectedEntityId} value={selectedEntityId} disabled={!selectedMediumId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma entidade" />
              </SelectTrigger>
              <SelectContent>
                {availableEntities.map(entity => (
                  <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          {/* O botão é desabilitado se não houver médiuns disponíveis */}
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={availableMediums.length === 0}>
            {availableMediums.length > 0 ? 'Agendar Consulente' : 'Nenhum Médium Disponível'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

---

## `src/lib/firebase.ts`

```ts
// --- Arquivo de Configuração do Firebase ---
// Este arquivo é responsável por inicializar e configurar a conexão
// com os serviços do Firebase que o aplicativo utiliza (Firestore e Analytics).

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Objeto de configuração com as credenciais do seu projeto Firebase.
// Estas chaves são públicas e seguras para serem expostas no lado do cliente.
// A segurança é garantida pelas Regras do Firestore.
const firebaseConfig = {
  apiKey: "AIzaSyBBw04_jbA8PSZvnnUtV5kF_tmvBkOk6HA",
  authDomain: "teca-30ef5.firebaseapp.com",
  projectId: "teca-30ef5",
  storageBucket: "teca-30ef5.firebasestorage.app",
  messagingSenderId: "233265567374",
  appId: "1:233265567374:web:b46a19b11e63247e165bdf",
  measurementId: "G-4036QGWNBC"
};

// Inicializa o Firebase, mas evita a reinicialização se já houver uma instância.
// Isso é importante em ambientes como o Next.js, que podem renderizar o código várias vezes.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Obtém a instância do Firestore, que é o nosso banco de dados.
const db = getFirestore(app);

// Inicializa o Google Analytics apenas se estiver rodando no navegador e for suportado.
// Isso evita erros durante a renderização no servidor (SSR).
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

// Exporta a instância do banco de dados para ser usada em outras partes do aplicativo.
export { db };
```

---

## `src/lib/types.ts`

```ts
// --- Arquivo de Definição de Tipos ---
// Este arquivo centraliza as "formas" (interfaces) dos dados utilizados em todo o aplicativo.
// Usar interfaces ajuda a garantir consistência e a evitar erros de digitação.

/**
 * @interface Consulente
 * @description Representa uma pessoa que será atendida.
 * @property {string} id - Identificador único do consulente.
 * @property {string} name - Nome do consulente.
 */
export interface Consulente {
  id: string;
  name: string;
}

/**
 * @interface Entity
 * @description Representa uma entidade espiritual que atua através de um médium.
 * @property {string} id - Identificador único da entidade.
 * @property {string} name - Nome da entidade (ex: "Pombagira", "Caboclo").
 * @property {Consulente[]} consulentes - Lista de consulentes agendados para esta entidade.
 * @property {boolean} isAvailable - Indica se a entidade está disponível para atendimento.
 */
export interface Entity {
  id: string;
  name: string;
  consulentes: Consulente[];
  isAvailable: boolean;
}

/**
 * @interface Medium
 * @description Representa um médium do terreiro.
 * @property {string} id - Identificador único do médium no banco de dados.
 * @property {string} name - Nome do médium.
 * @property {Entity[]} entities - Lista de entidades que o médium incorpora.
 * @property {boolean} isPresent - Indica se o médium está presente no dia.
 * @property {any} createdAt - Data de criação do registro, usado para ordenação. 
 */
export interface Medium {
  id: string;
  name: string;
  entities: Entity[];
  isPresent: boolean;
  createdAt: any; 
}
```

---

## `package.json`

```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@genkit-ai/googleai": "^1.8.0",
    "@genkit-ai/next": "^1.8.0",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "firebase": "^11.9.1",
    "genkit": "^1.8.0",
    "lucide-react": "^0.475.0",
    "next": "15.3.3",
    "patch-package": "^8.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "genkit-cli": "^1.8.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```
