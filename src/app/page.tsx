"use client";

import { useEffect, useState, Suspense } from "react";
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
import { Shield, Loader2 } from 'lucide-react';
import { MediumManagement } from "@/components/medium-management";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAILS } from "@/lib/secrets";
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginClient } from "@/components/login-client";

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
    toggleMediumPresence,
    toggleEntityAvailability,
    updateMedium,
    logLoginEvent,
    clearLoginHistory,
    addSpiritualCategory,
    removeSpiritualCategory,
    selectedCategories,
    updateSelectedCategories,
  } = useSchoolData();

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
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
                          updateMedium={updateMedium}
                          removeMedium={removeMedium}
                          toggleMediumPresence={toggleMediumPresence}
                          clearLoginHistory={clearLoginHistory}
                          addSpiritualCategory={addSpiritualCategory}
                          removeSpiritualCategory={removeSpiritualCategory}
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

            <ConsulenteRegistration
              mediums={mediums}
              addConsulente={addConsulente}
              selectedCategories={selectedCategories}
              spiritualCategories={spiritualCategories}
            />
          </aside>
          <div className="lg:col-span-2">
            <SchoolOverview
              mediums={mediums}
              removeConsulente={removeConsulente}
              toggleEntityAvailability={toggleEntityAvailability}
              selectedCategories={selectedCategories}
            />
          </div>
        </div>
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
