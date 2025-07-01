"use client";

import type { Medium, Category } from '@/lib/types';
import { MediumCard } from './teacher-card';

interface SchoolOverviewProps {
  mediums: Medium[];
  removeMedium: (mediumId: string) => void;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
  updateMedium: (mediumId: string, data: { name?: string; entities?: any[] }) => void;
  selectedCategories: Category[];
}

export function SchoolOverview({ mediums, removeMedium, removeConsulente, toggleMediumPresence, toggleEntityAvailability, updateMedium, selectedCategories }: SchoolOverviewProps) {
  const presentMediums = mediums.filter(m => m.isPresent);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-headline mb-4">Médiuns Presentes</h2>
        {presentMediums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentMediums.map(medium => (
              <MediumCard
                key={medium.id}
                medium={medium}
                removeMedium={removeMedium}
                removeConsulente={removeConsulente}
                toggleMediumPresence={toggleMediumPresence}
                toggleEntityAvailability={toggleEntityAvailability}
                updateMedium={updateMedium}
                selectedCategories={selectedCategories}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum médium está marcado como presente.</h3>
            <p className="text-sm text-muted-foreground mt-2">Volte ao Passo 2 para marcar a presença dos médiuns.</p>
          </div>
        )}
      </div>
    </div>
  );
}