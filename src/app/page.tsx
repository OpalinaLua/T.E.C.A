"use client";

import { useState } from "react";
import { useSchoolData } from '@/hooks/use-school-data';
import { SchoolOverview } from '@/components/school-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { ConsulenteRegistration } from '@/components/student-registration';
import type { Category } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield } from 'lucide-react';
import { MediumManagement } from "@/components/medium-management";


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
  } = useSchoolData();

  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handlePasswordCheck = async () => {
    if (userName.trim() === '') {
      toast({
        title: "Identificação Necessária",
        description: "Por favor, insira seu nome para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      try {
        await logLoginEvent(userName);
        setIsAuthenticated(true);
      } catch (error) {
        // O hook useSchoolData já exibe um toast de erro.
        // Apenas evitamos o login se o registro falhar.
      }
    } else {
      toast({
        title: "Senha Incorreta",
        description: "A senha para acessar a área de gerenciamento está incorreta.",
        variant: "destructive",
      });
      setPassword('');
    }
  };


  const handleDialogChange = (open: boolean) => {
    setIsManagementOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setPassword('');
      setUserName('');
      setIsAuthenticated(false);
    }
  };
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-16 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-12 w-full mb-4" />
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
              <DialogContent className="sm:max-w-3xl">
                {!isAuthenticated ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Acesso Restrito</DialogTitle>
                      <DialogDescription>
                        Para gerenciar médiuns e a gira, por favor, identifique-se e insira a senha de administrador.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                       <div className="space-y-2">
                        <Label htmlFor="userName">Seu Nome</Label>
                        <Input
                          id="userName"
                          placeholder="Digite seu nome"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handlePasswordCheck();
                              }
                          }}
                        />
                      </div>
                      <Button type="button" onClick={handlePasswordCheck} className="w-full mt-2">Entrar</Button>
                    </div>
                  </>
                ) : (
                  <div className="max-h-[80vh] overflow-y-auto -mx-6 px-6 pt-2">
                     <MediumManagement
                        mediums={mediums}
                        addMedium={addMedium}
                        updateMedium={updateMedium}
                        removeMedium={removeMedium}
                        clearLoginHistory={clearLoginHistory}
                        selectedCategories={selectedCategories}
                        onSelectionChange={handleCategoryChange}
                        onSuccess={() => { /* No need to close dialog anymore */ }}
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
              toggleMediumPresence={toggleMediumPresence}
              toggleEntityAvailability={toggleEntityAvailability}
              selectedCategories={selectedCategories}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
