"use client";

import { useEffect, useState } from "react";
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
import { signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAILS } from "@/lib/secrets";
import { useRouter, useSearchParams } from 'next/navigation';


// --- Main Page Component ---
export default function Home() {
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

  const router = useRouter();
  const searchParams = useSearchParams();

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthenticatedUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Se o usuário estiver autenticado e o parâmetro 'openManagement' estiver na URL,
    // abra o diálogo de gerenciamento e remova o parâmetro para limpar a URL.
    if (authenticatedUser && searchParams.has('openManagement')) {
      if (ADMIN_EMAILS.includes(authenticatedUser.email || '')) {
        setIsManagementOpen(true);
      }
      // Limpa a URL para que o diálogo não reabra ao recarregar a página.
      const newPath = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newPath, url: newPath }, '', newPath);
    }
  }, [authenticatedUser, searchParams, router]);


  const handleCategoryChange = (category: Category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    updateSelectedCategories(newCategories);
  };

  const handleOpenManagement = () => {
    if (authenticatedUser && ADMIN_EMAILS.includes(authenticatedUser.email || '')) {
      setIsManagementOpen(true);
    } else {
      router.push('/login');
    }
  };

  const handleDialogChange = async (open: boolean) => {
    if (!open && auth.currentUser) {
      // Ao fechar o diálogo, fazemos o logout
      await signOut(auth);
    }
    setIsManagementOpen(open);
  };
  
  if (!isSchoolDataLoaded || isAuthLoading) {
    return <LoadingScreen text="Carregando dados..."/>;
  }

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
                <Button variant="outline" className="w-full" onClick={handleOpenManagement}>
                  <Shield className="mr-2 h-4 w-4" />
                  Gerenciar Médiuns e Gira
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col h-full max-h-[90vh]">
                 <DialogHeader className="p-6 pb-4">
                    <DialogTitle>Painel de Gerenciamento</DialogTitle>
                    <DialogDescription>
                       Gerencie a gira, médiuns e configurações.
                    </DialogDescription>
                 </DialogHeader>
                 <div className="flex-grow overflow-y-auto px-6">
                    {authenticatedUser ? (
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
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin mr-3" />
                        <span className="text-muted-foreground">Carregando dados do usuário...</span>
                      </div>
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
