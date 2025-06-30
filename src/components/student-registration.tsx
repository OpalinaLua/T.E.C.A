/**
 * @fileoverview Componente para agendar um novo consulente.
 * Permite ao usuário selecionar um médium e uma entidade disponíveis
 * e inserir o nome do consulente para realizar o agendamento.
 */
"use client";

import { useState, useMemo } from 'react';
import type { Medium, Category } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

// Interface para as props do componente.
interface ConsulenteRegistrationProps {
  mediums: Medium[];
  addConsulente: (consulenteName: string, mediumId: string, entityId: string) => void;
  selectedCategories: Category[];
}

export function ConsulenteRegistration({ mediums, addConsulente, selectedCategories }: ConsulenteRegistrationProps) {
  // Estados do componente.
  const [name, setName] = useState('');
  const [selectedMediumId, setSelectedMediumId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const { toast } = useToast();

  // Memoiza a lista de médiuns disponíveis para evitar recálculos desnecessários.
  // Um médium está disponível se estiver presente e tiver pelo menos uma entidade disponível para agendamento
  // que pertença às categorias selecionadas para a gira.
  const availableMediums = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    return mediums.filter(t => 
      t.isPresent && t.entities && t.entities.some(s => 
        selectedCategories.includes(s.category) &&
        s.isAvailable && 
        s.consulenteLimit > 0 && 
        s.consulentes.length < s.consulenteLimit
      )
    );
  }, [mediums, selectedCategories]);
  
  // Memoiza a lista de entidades disponíveis para o médium selecionado.
  // Uma entidade está disponível se pertencer à categoria da gira, `isAvailable` for true, e houver vagas.
  const availableEntities = useMemo(() => {
    if (!selectedMediumId) return [];
    const medium = mediums.find(t => t.id === selectedMediumId);
    if (!medium) return [];

    return medium.entities.filter(s => 
      selectedCategories.includes(s.category) &&
      s.isAvailable && 
      s.consulenteLimit > 0 && 
      s.consulentes.length < s.consulenteLimit
    );
  }, [mediums, selectedMediumId, selectedCategories]);

  /**
   * Manipula a mudança de seleção do médium, resetando a entidade selecionada.
   * @param mediumId - O ID do médium selecionado.
   */
  const handleMediumChange = (mediumId: string) => {
    setSelectedMediumId(mediumId);
    setSelectedEntityId('');
  }

  /**
   * Submete o formulário de agendamento.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedMediumId && selectedEntityId) {
      addConsulente(name.trim(), selectedMediumId, selectedEntityId);
      // Limpa o formulário após o sucesso.
      setName('');
      setSelectedMediumId('');
      setSelectedEntityId('');
      toast({
        title: "Sucesso",
        description: `Consulente ${name.trim()} foi agendado(a).`,
      });
    } else {
        toast({
            title: "Erro",
            description: "Por favor, preencha todos os campos para agendar um consulente.",
            variant: "destructive",
        });
    }
  };
  
  const getButtonText = () => {
    if (selectedCategories.length === 0) return "Selecione uma Gira";
    if (availableMediums.length === 0) return "Nenhum Médium Disponível";
    return "Agendar Consulente";
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agendamento de Consulente</CardTitle>
        <CardDescription>Agende um consulente com um médium e entidade disponíveis.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="consulente-name" className="text-sm font-medium">Nome do Consulente</label>
            <Input
              id="consulente-name"
              placeholder="ex: Maria da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={selectedCategories.length === 0}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Médium</label>
            <Select onValueChange={handleMediumChange} value={selectedMediumId} disabled={availableMediums.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um(a) médium" />
              </SelectTrigger>
              <SelectContent>
                {availableMediums.map(medium => (
                  <SelectItem key={medium.id} value={medium.id}>{medium.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Entidade</label>
            <Select onValueChange={setSelectedEntityId} value={selectedEntityId} disabled={!selectedMediumId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma entidade" />
              </SelectTrigger>
              <SelectContent>
                {availableEntities.map(entity => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name} ({entity.consulentes.length}/{entity.consulenteLimit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={selectedCategories.length === 0 || availableMediums.length === 0}>
            {getButtonText()}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
