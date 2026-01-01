
"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSchoolData } from '@/hooks/use-school-data';
import { SchoolOverview } from '@/components/school-overview';
import { LoadingScreen } from "@/components/loading-screen";
import { ConsulenteRegistration } from '@/components/student-registration';
import type { Category } from "@/lib/types";
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
    toggleMediumPresence: _toggleMediumPresence,
    toggleEntityAvailability: _toggleEntityAvailability,
    updateMedium: _updateMedium,
    logLoginEvent: _logLoginEvent,
    clearLoginHistory: _clearLoginHistory,
    addSpiritualCategory: _addSpiritualCategory,
    removeSpiritualCategory: _removeSpiritualCategory,
    updateSpiritualCategoryOrder: _updateSpiritualCategoryOrder,
    updateAllEntityLimits: _updateAllEntityLimits,
    updateSpiritualCategoryName: _updateSpiritualCategoryName,
    selectedCategories,
    updateSelectedCategories: _updateSelectedCategories,
  } = useSchoolData();
  
  const { toast } = useToast();

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState("overview");
  
  const handleAsyncAction = useCallback(async <T extends any[]>(
      action: (...args: T) => Promise<string | void>,
      success: { title: string; description?: string } | ((result: string | void) => { title: string; description?: string }),
      ...args: T
  ) => {
      try {
          const result = await action(...args);
          const toastMessage = typeof success === 'function' ? success(result) : success;
          toast(toastMessage);
      } catch (error: any) {
          toast({
              title: "Erro na Operação",
              description: error.message || "Ocorreu um erro inesperado.",
              variant: "destructive",
          });
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
  
  const toggleMediumPresence = useCallback((...args: Parameters<typeof _toggleMediumPresence>) => 
      handleAsyncAction(_toggleMediumPresence, (desc) => ({ title: "Presença Alterada", description: desc as string }), ...args),
  [_toggleMediumPresence, handleAsyncAction]);
  
  const toggleEntityAvailability = useCallback((...args: Parameters<typeof _toggleEntityAvailability>) =>
      handleAsyncAction(_toggleEntityAvailability, (desc) => ({ title: "Disponibilidade Alterada", description: desc as string }), ...args),
  [_toggleEntityAvailability, handleAsyncAction]);

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

  const updateSelectedCategories = useCallback(async (categories: Category[]) => {
      try {
        await _updateSelectedCategories(categories);
        toast({
          title: "Gira Atualizada",
          description: "A seleção de categorias da gira foi salva."
        })
      } catch (error: any) {
        toast({
            title: "Erro ao Salvar",
            description: error.message || "Não foi possível salvar a seleção da gira.",
            variant: "destructive",
        });
      }
  }, [_updateSelectedCategories, toast]);
  
  const logLoginEvent = useCallback((...args: Parameters<typeof _logLoginEvent>) => {
     _logLoginEvent(...args).catch(err => {
        toast({ title: "Erro de Auditoria", description: err.message, variant: "destructive" });
     });
  }, [_logLoginEvent, toast]);

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


  const handleCategoryChange = (category: Category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    updateSelectedCategories(newCategories);
  };
  
  const handleDialogChange = async (open: boolean) => {
    // Se o modal for fechado, faz logout
    if (!open && authenticatedUser) {
        await signOut(auth);
    }
    setIsManagementOpen(open);
  };
  
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
                  {userIsAdmin ? 'Gerencie a gira, médiuns e configurações.' : 'Faça login com uma conta autorizada para continuar.'}
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
                    mediums={mediums}
                    spiritualCategories={spiritualCategories}
                    addMedium={addMedium}
                    updateMedium={_updateMedium}
                    removeMedium={removeMedium}
                    toggleMediumPresence={toggleMediumPresence}
                    clearLoginHistory={clearLoginHistory}
                    addSpiritualCategory={addSpiritualCategory}
                    removeSpiritualCategory={removeSpiritualCategory}
                    updateSpiritualCategoryOrder={updateSpiritualCategoryOrder}
                    updateAllEntityLimits={updateAllEntityLimits}
                    updateSpiritualCategoryName={updateSpiritualCategoryName}
                    selectedCategories={selectedCategories}
                    onSelectionChange={handleCategoryChange}
                    onClose={() => handleDialogChange(false)}
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
        toggleEntityAvailability={toggleEntityAvailability}
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
