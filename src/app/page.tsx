
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
import { ADMIN_EMAILS } from "@/lib/secrets";
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
  } = useSchoolData();
  
  const { toast } = useToast();

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState("overview");
  
  const handleAsyncAction = useCallback(async <T extends any[], R>(
      action: (...args: T) => Promise<R>,
      success: { title: string; description?: string } | ((result: R) => { title: string; description?: string }),
      ...args: T
  ): Promise<R> => {
      try {
          const result = await action(...args);
          const toastMessage = typeof success === 'function' ? success(result) : success;
          toast(toastMessage);
          return result;
      } catch (error: any) {
          toast({
              title: "Erro na Operação",
              description: error.message || "Ocorreu um erro inesperado.",
              variant: "destructive",
          });
          throw error; // Re-lança o erro para que a chamada original saiba da falha
      }
  }, [toast]);
  
  // Wrappers for data functions to include toasts
  const addMedium = useCallback((...args: Parameters<typeof _addMedium>) => 
      handleAsyncAction(_addMedium, { title: "Sucesso", description: `Médium ${args[0]} foi cadastrado(a).` }, ...args), 
  [_addMedium, handleAsyncAction]);

  const removeMedium = useCallback((...args: Parameters<typeof _removeMedium>) => 
      handleAsyncAction(_removeMedium, { title: "Médium Removido", description: `O médium foi removido com sucesso.` }, ...args),
  [_removeMedium, handleAsyncAction]);

  const addConsulente = useCallback((...args: Parameters<typeof _addConsulente>) => 
      handleAsyncAction(_addConsulente, { title: "Sucesso", description: `Consulente ${args[0]} foi agendado(a).` }, ...args),
  [_addConsulente, handleAsyncAction]);

  const removeConsulente = useCallback((...args: Parameters<typeof _removeConsulente>) => 
      handleAsyncAction(_removeConsulente, { title: "Consulente Removido", description: `${args[3]} foi removido(a).` }, ...args),
  [_removeConsulente, handleAsyncAction]);

  const updateConsulenteName = useCallback((...args: Parameters<typeof _updateConsulenteName>) => 
      handleAsyncAction(_updateConsulenteName, { title: "Nome Atualizado", description: `O nome foi alterado para ${args[3]}.` }, ...args),
  [_updateConsulenteName, handleAsyncAction]);

  const clearLoginHistory = useCallback((...args: Parameters<typeof _clearLoginHistory>) =>
      handleAsyncAction(_clearLoginHistory, (desc) => ({ title: "Sucesso", description: desc as string }), ...args),
  [_clearLoginHistory, handleAsyncAction]);

  const addSpiritualCategory = useCallback((...args: Parameters<typeof _addSpiritualCategory>) =>
      handleAsyncAction(_addSpiritualCategory, (desc) => ({ title: "Sucesso", description: desc as string }), ...args),
  [_addSpiritualCategory, handleAsyncAction]);

  const removeSpiritualCategory = useCallback((...args: Parameters<typeof _removeSpiritualCategory>) =>
      handleAsyncAction(_removeSpiritualCategory, (desc) => ({ title: "Sucesso", description: desc as string }), ...args),
  [_removeSpiritualCategory, handleAsyncAction]);
  
  const updateSpiritualCategoryOrder = useCallback((...args: Parameters<typeof _updateSpiritualCategoryOrder>) => 
    handleAsyncAction(_updateSpiritualCategoryOrder, { title: 'Sucesso', description: 'Ordem das categorias foi atualizada.' }, ...args),
  [_updateSpiritualCategoryOrder, handleAsyncAction]);
  
  const updateAllEntityLimits = useCallback((...args: Parameters<typeof _updateAllEntityLimits>) =>
      handleAsyncAction(_updateAllEntityLimits, (desc) => ({ title: "Sucesso!", description: desc as string }), ...args),
  [_updateAllEntityLimits, handleAsyncAction]);
  
  const updateSpiritualCategoryName = useCallback((...args: Parameters<typeof _updateSpiritualCategoryName>) =>
      handleAsyncAction(_updateSpiritualCategoryName, (desc) => ({ title: "Sucesso!", description: desc as string }), ...args),
  [_updateSpiritualCategoryName, handleAsyncAction]);
  
  const saveAllManagementChanges = useCallback((...args: Parameters<typeof _saveAllManagementChanges>) => 
      handleAsyncAction(_saveAllManagementChanges, { title: "Sucesso", description: "Todas as alterações foram salvas." }, ...args),
  [_saveAllManagementChanges, handleAsyncAction]);
  
  const archiveAndResetGira = useCallback((...args: Parameters<typeof _archiveAndResetGira>) => 
    handleAsyncAction(_archiveAndResetGira, (desc) => ({ title: "Gira Arquivada", description: desc as string }), ...args),
  [_archiveAndResetGira, handleAsyncAction]);

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

  const userIsAdmin = authenticatedUser && ADMIN_EMAILS.includes(authenticatedUser.email || '');

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
            <div className="flex-grow overflow-y-auto px-6">
              {isAuthLoading ? (
                <div className="flex items-center justify-center p-4">
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
                  />
              ) : (
                <LoginClient 
                    onLoginSuccess={(user) => setAuthenticatedUser(user)}
                    showDisclaimer={!!authenticatedUser}
                />
              )}
            </div>
        </DialogContent>
      </Dialog>
  )

  const RegistrationForm = () => (
      <ConsulenteRegistration
        mediums={mediums}
        addConsulente={addConsulente}
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
