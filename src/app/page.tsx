"use client";

import { useState } from "react";
import { useSchoolData } from '@/hooks/use-school-data';
import { SchoolOverview } from '@/components/school-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { MediumRegistration } from '@/components/teacher-registration';
import { ConsulenteRegistration } from '@/components/student-registration';
import { CategorySelection } from "@/components/category-selection";
import type { Category } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
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
        <h1 className="text-5xl font-bold font-headline text-primary">
          T.E.C.A
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Uma forma simples para consulência.
        </p>
      </header>
      
      <div className="max-w-7xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline">Seleção da Gira</CardTitle>
            <CardDescription>Selecione as linhas de trabalho que estarão ativas hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategorySelection
              selectedCategories={selectedCategories}
              onSelectionChange={handleCategoryChange}
            />
          </CardContent>
        </Card>

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
    </main>
  );
}
