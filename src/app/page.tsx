
"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSchoolData } from '@/hooks/use-school-data';
import { SchoolOverview } from '@/components/school-overview';
import { LoadingScreen } from "@/components/loading-screen";
import { ConsulenteRegistration } from '@/components/student-registration';
import type { Medium, Category, ConsulenteStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, BookUser, Users } from 'lucide-react';
import { MediumManagement } from "@/components/medium-management";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BOOTSTRAP_SUPER_ADMINS } from "@/lib/secrets";
import { LoginClient } from "@/components/login-client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


export const dynamic = 'force-dynamic';

function HomeClient() {
  const {
    mediums,
    spiritualCategories,
    isLoaded: isSchoolDataLoaded,
    addMedium: _addMedium,
    removeMedium: _removeMedium,
    addConsulente: _addConsulente,
    removeConsulente: _removeConsulente,
    updateConsulenteName: _updateConsulenteName,
    logLoginEvent: _logLoginEvent,
    clearLoginHistory: _clearLoginHistory,
    addSpiritualCategory: _addSpiritualCategory,
    removeSpiritualCategory: _removeSpiritualCategory,
    updateSpiritualCategoryOrder: _updateSpiritualCategoryOrder,
    updateAllEntityLimits: _updateAllEntityLimits,
    updateSpiritualCategoryName: _updateSpiritualCategoryName,
    selectedCategories,
    updateSelectedCategories: _updateSelectedCategories,
    saveAllManagementChanges: _saveAllManagementChanges,
    updateConsulenteStatus: _updateConsulenteStatus,
    archiveAndResetGira: _archiveAndResetGira,
    permissions,
    addAdmin: _addAdmin,
    removeAdmin: _removeAdmin,
    addSuperAdmin: _addSuperAdmin,
    removeSuperAdmin: _removeSuperAdmin,
    deleteGiraHistoryEntry: _deleteGiraHistoryEntry,
    clearAllGiraHistory: _clearAllGiraHistory,
  } = useSchoolData();
  
  const { toast } = useToast();

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState("overview");
  
  const handleAsyncActionWithToast = useCallback(async <T extends any[], R>(
      action: (...args: T) => Promise<R>,
      successMessage: string,
      ...args: T
  ): Promise<R | undefined> => {
      try {
          const result = await action(...args);
          toast({ title: "Sucesso", description: successMessage });
          return result;
      } catch (error: any) {
          toast({
              title: "Erro na Operação",
              description: error.message || "Ocorreu um erro inesperado.",
              variant: "destructive",
          });
          return undefined;
      }
  }, [toast]);
  
  // Wrappers for data functions to include toasts
  const addMedium = useCallback((...args: Parameters<typeof _addMedium>) => 
      handleAsyncActionWithToast(_addMedium, `Médium ${args[0]} foi cadastrado(a).`, ...args), 
  [_addMedium, handleAsyncActionWithToast]);

  const removeMedium = useCallback((...args: Parameters<typeof _removeMedium>) => 
      handleAsyncActionWithToast(_removeMedium, `O médium foi removido com sucesso.`, ...args),
  [_removeMedium, handleAsyncActionWithToast]);

  const removeConsulente = useCallback((...args: Parameters<typeof _removeConsulente>) => 
      handleAsyncActionWithToast(_removeConsulente, `${args[3]} foi removido(a).`, ...args),
  [_removeConsulente, handleAsyncActionWithToast]);

  const updateConsulenteName = useCallback((...args: Parameters<typeof _updateConsulenteName>) => 
      handleAsyncActionWithToast(_updateConsulenteName, `O nome foi alterado para ${args[3]}.`, ...args),
  [_updateConsulenteName, handleAsyncActionWithToast]);

  const clearLoginHistory = useCallback(async () => {
    try {
        const resultMessage = await _clearLoginHistory();
        toast({ title: "Sucesso", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_clearLoginHistory, toast]);


  const addSpiritualCategory = useCallback(async (categoryName: string) => {
    try {
        const resultMessage = await _addSpiritualCategory(categoryName);
        toast({ title: "Sucesso", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_addSpiritualCategory, toast]);


  const removeSpiritualCategory = useCallback(async (categoryName: string) => {
    try {
        const resultMessage = await _removeSpiritualCategory(categoryName);
        toast({ title: "Sucesso", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_removeSpiritualCategory, toast]);
  
  const updateSpiritualCategoryOrder = useCallback((...args: Parameters<typeof _updateSpiritualCategoryOrder>) => 
    handleAsyncActionWithToast(_updateSpiritualCategoryOrder, 'Ordem das categorias foi atualizada.', ...args),
  [_updateSpiritualCategoryOrder, handleAsyncActionWithToast]);
  
  const updateAllEntityLimits = useCallback(async (newLimit: number) => {
    try {
        const resultMessage = await _updateAllEntityLimits(newLimit);
        toast({ title: "Sucesso!", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_updateAllEntityLimits, toast]);
  
  const updateSpiritualCategoryName = useCallback(async (oldName: string, newName: string) => {
    try {
        const resultMessage = await _updateSpiritualCategoryName(oldName, newName);
        toast({ title: "Sucesso!", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_updateSpiritualCategoryName, toast]);
  
  const saveAllManagementChanges = useCallback((...args: Parameters<typeof _saveAllManagementChanges>) => 
      handleAsyncActionWithToast(_saveAllManagementChanges, "Todas as alterações foram salvas.", ...args),
  [_saveAllManagementChanges, handleAsyncActionWithToast]);
  
  const archiveAndResetGira = useCallback(async () => {
    try {
        const resultMessage = await _archiveAndResetGira();
        toast({ title: "Gira Arquivada", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_archiveAndResetGira, toast]);

  const deleteGiraHistoryEntry = useCallback((...args: Parameters<typeof _deleteGiraHistoryEntry>) => 
    handleAsyncActionWithToast(_deleteGiraHistoryEntry, "A entrada do histórico foi removida.", ...args),
  [_deleteGiraHistoryEntry, handleAsyncActionWithToast]);

  const clearAllGiraHistory = useCallback(async () => {
    try {
        const resultMessage = await _clearAllGiraHistory();
        toast({ title: "Histórico Limpo", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_clearAllGiraHistory, toast]);

  const updateConsulenteStatus = useCallback(async (...args: Parameters<typeof _updateConsulenteStatus>) => {
    try {
        await _updateConsulenteStatus(...args);
    } catch (error: any) {
        toast({
            title: "Erro ao Atualizar Status",
            description: error.message || "Não foi possível alterar o status do consulente.",
            variant: "destructive",
        });
    }
  }, [_updateConsulenteStatus, toast]);
  
  const addAdmin = useCallback(async (email: string) => {
    try {
        const resultMessage = await _addAdmin(email);
        toast({ title: "Sucesso", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_addAdmin, toast]);

  const removeAdmin = useCallback(async (email: string) => {
    try {
        const resultMessage = await _removeAdmin(email);
        toast({ title: "Sucesso", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_removeAdmin, toast]);

  const addSuperAdmin = useCallback(async (email: string) => {
    try {
        const resultMessage = await _addSuperAdmin(email);
        toast({ title: "Sucesso", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_addSuperAdmin, toast]);

  const removeSuperAdmin = useCallback(async (email: string) => {
    try {
        const resultMessage = await _removeSuperAdmin(email);
        toast({ title: "Sucesso", description: resultMessage });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  }, [_removeSuperAdmin, toast]);
  
  const logLoginEvent = useCallback((...args: Parameters<typeof _logLoginEvent>) => {
     _logLoginEvent(...args); // Erros já são tratados dentro da função
  }, [_logLoginEvent]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticatedUser(user);
      setIsAuthLoading(false);
      // Se o usuário logou, registra o evento
      if (user && user.email) {
          logLoginEvent(user.email);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleDialogChange = async (open: boolean) => {
    if (!open && authenticatedUser) {
        // O logout agora acontece apenas se o usuário não clicar em "salvar e fechar"
    }
    setIsManagementOpen(open);
  };

  const handleLogoutOnClose = async () => {
    if (authenticatedUser) {
        await signOut(auth);
    }
    setIsManagementOpen(false);
  }
  
  if (!isSchoolDataLoaded || isAuthLoading) {
    return <LoadingScreen text="Carregando dados..."/>;
  }

  const userIsAdmin = authenticatedUser && authenticatedUser.email && (permissions.admins.includes(authenticatedUser.email) || permissions.superAdmins.includes(authenticatedUser.email) || BOOTSTRAP_SUPER_ADMINS.includes(authenticatedUser.email));

  const ManagementDialog = () => (
     <Dialog open={isManagementOpen} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            Gerenciar Médiuns e Gira
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>{userIsAdmin ? 'Painel de Gerenciamento' : 'Acesso Restrito'}</DialogTitle>
              <DialogDescription>
                  {userIsAdmin ? 'Gerencie a gira, médiuns e configurações. As alterações são salvas ao clicar em "Fechar e Salvar".' : 'Faça login com uma conta autorizada para continuar.'}
              </DialogDescription>
            </DialogHeader>
            
              {isAuthLoading ? (
                <div className="flex items-center justify-center p-4 flex-grow">
                  <Loader2 className="h-6 w-6 animate-spin mr-3" />
                  <span className="text-muted-foreground">Verificando...</span>
                </div>
              ) : userIsAdmin ? (
                  <MediumManagement
                    user={authenticatedUser}
                    initialMediums={mediums}
                    initialSelectedCategories={selectedCategories}
                    spiritualCategories={spiritualCategories}
                    addMedium={addMedium}
                    removeMedium={removeMedium}
                    clearLoginHistory={clearLoginHistory}
                    addSpiritualCategory={addSpiritualCategory}
                    removeSpiritualCategory={removeSpiritualCategory}
                    updateSpiritualCategoryOrder={updateSpiritualCategoryOrder}
                    updateAllEntityLimits={updateAllEntityLimits}
                    updateSpiritualCategoryName={updateSpiritualCategoryName}
                    updateSelectedCategories={_updateSelectedCategories}
                    archiveAndResetGira={archiveAndResetGira}
                    onSaveAndClose={async (updatedMediums, updatedCategories) => {
                        await saveAllManagementChanges(updatedMediums, updatedCategories);
                        await handleLogoutOnClose();
                    }}
                    permissions={permissions}
                    addAdmin={addAdmin}
                    removeAdmin={removeAdmin}
                    addSuperAdmin={addSuperAdmin}
                    removeSuperAdmin={removeSuperAdmin}
                    deleteGiraHistoryEntry={deleteGiraHistoryEntry}
                    clearAllGiraHistory={clearAllGiraHistory}
                  />
              ) : (
                <div className="flex-grow flex items-center justify-center">
                    <LoginClient 
                        onLoginSuccess={(user) => setAuthenticatedUser(user)}
                        showDisclaimer={!!authenticatedUser}
                        permissions={permissions}
                    />
                </div>
              )}
            
        </DialogContent>
      </Dialog>
  )

  const RegistrationForm = () => (
      <ConsulenteRegistration
        mediums={mediums}
        addConsulente={_addConsulente}
        selectedCategories={selectedCategories}
        spiritualCategories={spiritualCategories}
      />
  )

  const OverviewDisplay = () => (
     <SchoolOverview
        mediums={mediums}
        removeConsulente={removeConsulente}
        updateConsulenteName={updateConsulenteName}
        updateConsulenteStatus={updateConsulenteStatus}
        selectedCategories={selectedCategories}
        spiritualCategories={spiritualCategories}
      />
  )


  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto mb-6 sm:mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">
          T.E.C.A
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          Uma forma simples para consulência.
        </p>
      </header>
      
      <div className="max-w-7xl mx-auto space-y-8">
        {isMobile ? (
          // --- Mobile Layout with Tabs ---
          <div className="space-y-4">
              <ManagementDialog />
              <Tabs value={activeMobileTab} onValueChange={setActiveMobileTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview"><Users className="mr-2" /> Atendimentos</TabsTrigger>
                  <TabsTrigger value="register"><BookUser className="mr-2" /> Agendar</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                   <OverviewDisplay />
                </TabsContent>
                <TabsContent value="register" className="mt-4">
                   <RegistrationForm />
                </TabsContent>
              </Tabs>
          </div>
        ) : (
          // --- Desktop Layout with Grid ---
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
              <ManagementDialog />
              <RegistrationForm />
            </aside>
            <div className="lg:col-span-2">
              <OverviewDisplay />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// --- Main Page Component ---
export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen text="Carregando página..." />}>
      <HomeClient />
    </Suspense>
  );
}
