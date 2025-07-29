
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
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2 } from 'lucide-react';
import { MediumManagement } from "@/components/medium-management";
import { GoogleAuthProvider, signInWithPopup, signOut, type User, getRedirectResult, signInWithRedirect } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAILS } from "@/lib/secrets";
import { useIsMobile } from "@/hooks/use-mobile";


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

  const { toast } = useToast();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const isMobile = useIsMobile();


  useEffect(() => {
    console.log("[AUTH_DEBUG] useEffect triggered. isMobile:", isMobile);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("[AUTH_DEBUG] onAuthStateChanged callback fired. User:", user);
      if (user) {
        console.log("[AUTH_DEBUG] User is already signed in via onAuthStateChanged.");
        setAuthenticatedUser(user);
        setIsCheckingAuth(false);
      } else {
        console.log("[AUTH_DEBUG] No user from onAuthStateChanged. Checking for redirect result...");
        // No user is signed in, so we check for the result of a redirect login.
        try {
          // Set loading state for login process
          setIsLoggingIn(true); 
          const result = await getRedirectResult(auth);
          console.log("[AUTH_DEBUG] getRedirectResult returned:", result);
          
          if (result && result.user) {
            const redirectedUser = result.user;
            console.log("[AUTH_DEBUG] Redirect successful. User:", redirectedUser.email);
            
            if (redirectedUser.email && ADMIN_EMAILS.includes(redirectedUser.email)) {
              console.log("[AUTH_DEBUG] User is an admin. Logging event and setting state.");
              await logLoginEvent(redirectedUser.email);
              setAuthenticatedUser(redirectedUser);
              setIsManagementOpen(true); // <--- This should open the dialog
              console.log("[AUTH_DEBUG] Setting authenticatedUser and isManagementOpen to true.");
            } else {
              console.log("[AUTH_DEBUG] User is not an admin. Signing out.");
              await signOut(auth);
              toast({
                title: "Acesso Negado",
                description: "Este e-mail não tem permissão para acessar a área de gerenciamento.",
                variant: "destructive",
              });
            }
          } else {
            console.log("[AUTH_DEBUG] No redirect result found. User is logged out.");
            setAuthenticatedUser(null);
          }
        } catch (error: any) {
          console.error("[AUTH_DEBUG] Error during getRedirectResult:", error);
          toast({
            title: "Erro de Login",
            description: `Código do Erro: ${error.code}. Mensagem: ${error.message}`,
            variant: "destructive",
          });
        } finally {
          console.log("[AUTH_DEBUG] Redirect check finished. Finalizing auth check.");
          setIsCheckingAuth(false);
          setIsLoggingIn(false);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("[AUTH_DEBUG] Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [logLoginEvent, toast, isMobile]);


  const handleCategoryChange = (category: Category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    updateSelectedCategories(newCategories);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();

    if (isMobile) {
      console.log("[AUTH_DEBUG] Mobile device detected. Using signInWithRedirect.");
      signInWithRedirect(auth, provider);
      return; 
    }

    try {
      console.log("[AUTH_DEBUG] Desktop device detected. Using signInWithPopup.");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("[AUTH_DEBUG] Popup login result:", result);
  
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        console.log("[AUTH_DEBUG] Popup user is admin. Opening dialog.");
        await logLoginEvent(user.email);
        setAuthenticatedUser(user);
        setIsManagementOpen(true);
      } else {
        console.log("[AUTH_DEBUG] Popup user is not admin. Signing out.");
        await signOut(auth);
        toast({
          title: "Acesso Negado",
          description: "Este e-mail não tem permissão para acessar a área de gerenciamento.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("[AUTH_DEBUG] Error in signInWithPopup:", error);
      let description = "Não foi possível autenticar com o Google. Tente novamente.";
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        description = "A janela de login foi fechada antes da conclusão.";
      }
      toast({
        title: "Erro de Login",
        description,
        variant: "destructive",
      });
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    console.log(`[AUTH_DEBUG] Dialog state changing to: ${open}`);
    if (!open) {
      if (auth.currentUser) {
        console.log("[AUTH_DEBUG] Dialog closing, signing out user.");
        signOut(auth);
      }
    }
    setIsManagementOpen(open);
  };
  
  if (!isSchoolDataLoaded || isCheckingAuth) {
    return <LoadingScreen text={isCheckingAuth ? "Verificando autenticação..." : "Carregando dados..."}/>;
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
                <Button variant="outline" className="w-full" onClick={() => setIsManagementOpen(true)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Gerenciar Médiuns e Gira
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col h-full max-h-[90vh]">
                 <DialogHeader className="p-6 pb-4">
                    <DialogTitle>Painel de Gerenciamento</DialogTitle>
                    <DialogDescription>
                       {!authenticatedUser ? "Acesse para gerenciar a gira." : "Gerencie a gira, médiuns e configurações."}
                    </DialogDescription>
                 </DialogHeader>
                 <div className="flex-grow overflow-y-auto px-6">
                    {!authenticatedUser ? (
                      <div className="py-4">
                        {isLoggingIn ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin mr-3" />
                            <span className="text-muted-foreground">Autenticando...</span>
                          </div>
                        ) : (
                          <Button type="button" onClick={handleGoogleLogin} className="w-full">
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7C337 97.4 297.9 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 431 248 431c97.2 0 130.2-72.2 132.9-110.5H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.6z"></path></svg>
                            Login com Google
                          </Button>
                        )}
                      </div>
                    ) : (
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

    