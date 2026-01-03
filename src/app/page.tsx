
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
  DialogDescription,
  DialogTrigger,
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
    updateConsulenteStatus: _updateConsulenteStatus,
    archiveAndResetGira,
    permissions,
    addAdmin,
    removeAdmin,
    addSuperAdmin,
    removeSuperAdmin,
    deleteGiraHistoryEntry,
    clearAllGiraHistory,
  } = useSchoolData();
  
  const { toast } = useToast();

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isMobile = useIsMobile();
  const [activeMobileTab, setActiveMobileTab] = useState("overview");
  
  const updateConsulenteStatus = useCallback(async (mediumId: string, entityId: string, consulenteId: string, status: ConsulenteStatus) => {
    try {
      await _updateConsulenteStatus(mediumId, entityId, consulenteId, status);
    } catch (error: any) {
      toast({
        title: "Erro ao Atualizar Status",
        description: error.message || "Não foi possível alterar o status do consulente.",
        variant: "destructive",
      });
    }
  }, [_updateConsulenteStatus, toast]);

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
        <DialogContent className="p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader className="p-6 pb-4 flex-shrink-0">
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
                    updateSelectedCategories={updateSelectedCategories}
                    archiveAndResetGira={archiveAndResetGira}
                    onSaveAndClose={async (updatedMediums, updatedCategories) => {
                        await saveAllManagementChanges(updatedMediums, updatedCategories);
                        toast({ title: "Sucesso!", description: "Todas as alterações foram salvas." });
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
