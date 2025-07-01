"use client";

import { useMemo, useState } from 'react';
import type { Medium, Category } from '@/lib/types';
import { MediumCard } from './teacher-card';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface SchoolOverviewProps {
  mediums: Medium[];
  removeMedium: (mediumId: string) => void;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
  updateMedium: (mediumId: string, data: { name?: string; entities?: any[] }) => void;
  selectedCategories: Category[];
}

export function SchoolOverview({ mediums, removeMedium, removeConsulente, toggleMediumPresence, toggleEntityAvailability, updateMedium, selectedCategories }: SchoolOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const presentMediums = useMemo(() => mediums.filter(m => m.isPresent), [mediums]);

  const filteredMediums = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return presentMediums;

    return presentMediums.filter(medium => {
      // Check medium name
      if (medium.name.toLowerCase().includes(query)) {
        return true;
      }
      // Check entity name or category
      const entityMatch = medium.entities.some(entity =>
        selectedCategories.includes(entity.category) && (
          entity.name.toLowerCase().includes(query) ||
          entity.category.toLowerCase().includes(query)
        )
      );
      return entityMatch;
    });
  }, [presentMediums, searchQuery, selectedCategories]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold font-headline">Médiuns Presentes</h2>
          {presentMediums.length > 0 && (
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar médium, entidade..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-80"
                />
            </div>
          )}
        </div>

        {filteredMediums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMediums.map(medium => (
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
            {presentMediums.length === 0 ? (
                <>
                    <h3 className="text-lg font-medium text-muted-foreground">Nenhum médium está marcado como presente.</h3>
                    <p className="text-sm text-muted-foreground mt-2">Volte ao Passo 2 para marcar a presença dos médiuns.</p>
                </>
            ) : (
                <>
                    <h3 className="text-lg font-medium text-muted-foreground">Nenhum resultado encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-2">Sua busca por "{searchQuery}" não encontrou nenhum resultado.</p>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
