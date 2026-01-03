
"use client";

import { useMemo, useState } from 'react';
import type { Medium, Category, ConsulenteStatus, MediumRole } from '@/lib/types';
import { MediumCard } from './teacher-card';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLES } from '@/lib/types';


const getRoleOrder = (role?: MediumRole): number => {
    if (!role) return ROLES.length + 1;
    const index = ROLES.indexOf(role);
    return index === -1 ? ROLES.length + 1 : index;
};

interface SchoolOverviewProps {
  mediums: Medium[];
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => void;
  updateConsulenteName: (mediumId: string, entityId: string, consulenteId: string, newName: string) => void;
  updateConsulenteStatus: (mediumId: string, entityId: string, consulenteId: string, status: ConsulenteStatus) => void;
  selectedCategories: Category[];
  spiritualCategories: Category[];
}

export function SchoolOverview({ mediums, removeConsulente, updateConsulenteName, updateConsulenteStatus, selectedCategories, spiritualCategories }: SchoolOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('present');

  const listSource = useMemo(() => {
    return activeTab === 'present'
      ? mediums.filter(m => m.isPresent)
      : mediums;
  }, [mediums, activeTab]);

  const filteredAndSortedMediums = useMemo(() => {
    const sortedByRole = [...listSource].sort((a, b) => {
        const orderA = getRoleOrder(a.role);
        const orderB = getRoleOrder(b.role);
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return 0; // Mantém a ordem original (createdAt) se os cargos forem iguais
    });

    const query = searchQuery.toLowerCase().trim();

    // 1. Filtrar médiuns que têm entidades nas categorias da gira selecionada
    const mediumsInGira = sortedByRole.filter(medium =>
      medium.entities.some(entity => selectedCategories.includes(entity.category))
    );
      
    // 2. Se não houver busca, retorna a lista filtrada pela gira
    if (!query) {
      return mediumsInGira;
    }

    // 3. Aplicar o critério de busca sobre a lista já filtrada pela gira
    const searchedMediums = mediumsInGira.filter(medium => {
        // Check medium name
        if (medium.name.toLowerCase().includes(query)) {
            return true;
        }
        // Check entity name, category, or consulente name
        const entityMatch = medium.entities.some(entity =>
            selectedCategories.includes(entity.category) && (
                entity.name.toLowerCase().includes(query) || 
                entity.category.toLowerCase().includes(query) ||
                entity.consulentes.some(c => c.name.toLowerCase().includes(query))
            )
        );
        if (entityMatch) {
            return true;
        }

        return false;
    });

    return searchedMediums;

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
                  placeholder="Buscar médium, entidade, consulente..."
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
                updateConsulenteName={updateConsulenteName}
                updateConsulenteStatus={updateConsulenteStatus}
                selectedCategories={selectedCategories}
                spiritualCategories={spiritualCategories}
                searchQuery={searchQuery}
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
                        {selectedCategories.length === 0 ? 'Nenhuma gira selecionada' : (activeTab === 'present' ? 'Nenhum médium presente na gira' : 'Nenhum médium na gira')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        {selectedCategories.length === 0 ? 'Selecione uma categoria de gira no painel de gerenciamento.' : 'Verifique a presença dos médiuns ou as categorias selecionadas.'}
                    </p>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
