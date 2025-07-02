
"use client";

import { useState } from "react";
import { useSchoolData } from '@/hooks/use-school-data';
import { SchoolOverview } from '@/components/school-overview';
import { LoadingScreen } from "@/components/loading-screen";
import { ConsulenteRegistration } from '@/components/student-registration';
import type { Category } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield } from 'lucide-react';
import { MediumManagement } from "@/components/medium-management";
import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAILS } from "@/lib/secrets";


// --- Main Page Component ---
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
    logLoginEvent,
    clearLoginHistory,
    selectedCategories,
    updateSelectedCategories,
  } = useSchoolData();

  const { toast } = useToast();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  const handleCategoryChange = (category: Category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    updateSelectedCategories(newCategories);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        await logLoginEvent(user.email);
        setAuthenticatedUser(user);
      } else {
        await signOut(auth);
        toast({
          title: "Acesso Negado",
          description: "Este e-mail não tem permissão para acessar a área de gerenciamento.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro no login com Google:", error);

      let description = "Não foi possível autenticar com o Google. Tente novamente.";
      if (error.code === 'auth/popup-closed-by-user') {
        description = "A janela de login foi fechada antes da conclusão.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        description = "Múltiplas tentativas de login. Por favor, tente novamente.";
      } else if (error.code === 'auth/configuration-not-found') {
        description = "CONFIGURAÇÃO INCOMPLETA: O método de login com Google não foi ativado no painel do Firebase. Por favor, habilite o provedor 'Google' na seção de Autenticação do seu projeto.";
      } else if (error.code === 'auth/unauthorized-domain') {
        description = "CONFIGURAÇÃO INCOMPLETA: O domínio do seu site não está autorizado. Vá em Autenticação > Configurações e adicione o domínio à lista de 'Domínios autorizados' no Firebase.";
      }

      toast({
        title: "Erro de Login",
        description,
        variant: "destructive",
      });
    }
  };


  const handleDialogChange = (open: boolean) => {
    setIsManagementOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setAuthenticatedUser(null);
       if (auth.currentUser) {
        signOut(auth);
      }
    }
  };
  
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto mb-8">
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
              <DialogContent className={authenticatedUser ? "sm:max-w-3xl" : "sm:max-w-md"}>
                {!authenticatedUser ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Acesso Restrito</DialogTitle>
                      <DialogDescription>
                        Para gerenciar médiuns e a gira, por favor, faça login com uma conta Google autorizada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Button type="button" onClick={handleGoogleLogin} className="w-full">
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7C337 97.4 297.9 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 431 248 431c97.2 0 130.2-72.2 132.9-110.5H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.6z"></path></svg>
                        Login com Google
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="max-h-[80vh] overflow-y-auto -mx-6 px-6 pt-2">
                     <MediumManagement
                        user={authenticatedUser}
                        mediums={mediums}
                        addMedium={addMedium}
                        updateMedium={updateMedium}
                        removeMedium={removeMedium}
                        toggleMediumPresence={toggleMediumPresence}
                        clearLoginHistory={clearLoginHistory}
                        selectedCategories={selectedCategories}
                        onSelectionChange={handleCategoryChange}
                        onSuccess={() => { /* No need to close dialog anymore */ }}
                        onClose={() => handleDialogChange(false)}
                      />
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <ConsulenteRegistration
              mediums={mediums}
              addConsulente={addConsulente}
              selectedCategories={selectedCategories}
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
