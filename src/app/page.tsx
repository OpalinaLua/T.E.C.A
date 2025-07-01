"use client";

import { useState } from "react";
import { useSchoolData } from '@/hooks/use-school-data';
import { SchoolOverview } from '@/components/school-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { MediumRegistration } from '@/components/teacher-registration';
import { ConsulenteRegistration } from '@/components/student-registration';
import { CategorySelection } from "@/components/category-selection";
import { MediumPresence } from "@/components/medium-presence";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
  } = useSchoolData();

  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-16 w-1/3" />
          <Skeleton className="h-48 w-full" />
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="w-full max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline">Passo 1: Seleção da Gira</CardTitle>
                <CardDescription className="text-lg">Selecione as linhas de trabalho que estarão ativas hoje.</CardDescription>
              </CardHeader>
              <CardContent>
                <CategorySelection
                  selectedCategories={selectedCategories}
                  onSelectionChange={handleCategoryChange}
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={nextStep} disabled={selectedCategories.length === 0}>
                  Avançar (Passo 2)
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      case 2:
        return (
          <MediumPresence
            mediums={mediums}
            toggleMediumPresence={toggleMediumPresence}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <div className="max-w-7xl mx-auto space-y-8">
             <Button variant="outline" onClick={prevStep} className="mb-4">
              Voltar (Passo 2)
            </Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
                <MediumRegistration addMedium={addMedium} />
                <ConsulenteRegistration
                  mediums={mediums}
                  addConsulente={addConsulente}
                  selectedCategories={selectedCategories}
                />
              </aside>
              <div className="lg:col-span-2">
                <SchoolOverview
                  mediums={mediums}
                  removeMedium={removeMedium}
                  removeConsulente={removeConsulente}
                  toggleMediumPresence={toggleMediumPresence}
                  toggleEntityAvailability={toggleEntityAvailability}
                  updateMedium={updateMedium}
                  selectedCategories={selectedCategories}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-5xl font-bold font-headline text-primary">
          T.E.C.A
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Uma forma simples para consulência.
        </p>
      </header>
      {renderStep()}
    </main>
  );
}