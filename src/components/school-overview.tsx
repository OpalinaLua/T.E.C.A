
"use client";

import { useMemo, useState } from 'react';
import type { Medium, Category } from '@/lib/types';
import { MediumCard } from './teacher-card';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SchoolOverviewProps {
  mediums: Medium[];
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
  selectedCategories: Category[];
}

export function SchoolOverview({ mediums, removeConsulente, toggleEntityAvailability, selectedCategories }: SchoolOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('present');

  const listSource = useMemo(() => {
    return activeTab === 'present'
      ? mediums.filter(m => m.isPresent)
      : mediums;
  }, [mediums, activeTab]);

  const filteredAndSortedMediums = useMemo(() => {
    // Função para calcular o total de consulentes de um médium
    const countConsulentes = (medium: Medium) => 
        medium.entities.reduce((acc, entity) => acc + entity.consulentes.length, 0);

    const filtered = listSource.filter(medium => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

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

    // Ordena o array filtrado
    return filtered.sort((a, b) => {
        const aHasConsulentes = countConsulentes(a) > 0;
        const bHasConsulentes = countConsulentes(b) > 0;

        if (aHasConsulentes && !bHasConsulentes) {
            return -1; // a vem primeiro
        }
        if (!aHasConsulentes && bHasConsulentes) {
            return 1; // b vem primeiro
        }
        return 0; // mantém a ordem original
    });

  }, [listSource, searchQuery, selectedCategories]);


  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="present">Presentes</TabsTrigger>
                <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                  placeholder="Buscar médium, entidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64 md:w-80"
              />
          </div>
        </div>

        {filteredAndSortedMediums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedMediums.map(medium => (
              <MediumCard
                key={medium.id}
                medium={medium}
                removeConsulente={removeConsulente}
                toggleEntityAvailability={toggleEntityAvailability}
                selectedCategories={selectedCategories}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            {searchQuery ? (
                 <>
                    <h3 className="text-lg font-medium text-muted-foreground">Nenhum resultado encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-2">Sua busca por "{searchQuery}" não encontrou nenhum resultado.</p>
                </>
            ) : (
                 <>
                    <h3 className="text-lg font-medium text-muted-foreground">
                        {activeTab === 'present' ? 'Nenhum médium presente' : 'Nenhum médium cadastrado'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        {activeTab === 'present' ? 'Marque a presença dos médiuns no painel de gerenciamento.' : 'Use o formulário para adicionar um novo médium.'}
                    </p>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
