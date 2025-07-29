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
import { Label } from './ui/label';

// Interface para as props do componente.
interface ConsulenteRegistrationProps {
  mediums: Medium[];
  addConsulente: (consulenteName: string, mediumId: string, entityId: string) => Promise<void>;
  selectedCategories: Category[];
  spiritualCategories: Category[];
}

export function ConsulenteRegistration({ mediums, addConsulente, selectedCategories }: ConsulenteRegistrationProps) {
  // Estados do componente.
  const [name, setName] = useState('');
  const [selectedMediumId, setSelectedMediumId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedMediumId && selectedEntityId && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await addConsulente(name.trim(), selectedMediumId, selectedEntityId);
        // Limpa o formulário apenas em caso de sucesso.
        setName('');
        setSelectedMediumId('');
        setSelectedEntityId('');
      } catch (error) {
        // O erro já é exibido pelo hook, então não precisamos fazer nada aqui.
        console.error("Falha ao agendar consulente:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else if (!isSubmitting) {
        toast({
            title: "Erro de Validação",
            description: "Por favor, preencha todos os campos para agendar um consulente.",
            variant: "destructive",
        });
    }
  };
  
  const getButtonText = () => {
    if (selectedCategories.length === 0) return "Selecione uma Gira";
    if (availableMediums.length === 0) return "Nenhum Médium Disponível";
    if (isSubmitting) return "Agendando...";
    return "Agendar Consulente";
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Agendamento</CardTitle>
        <CardDescription>Agende um consulente com um médium e entidade disponíveis.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consulente-name">Nome do Consulente</Label>
            <Input
              id="consulente-name"
              placeholder="ex: Maria da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={selectedCategories.length === 0 || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="medium-select">Médium</Label>
            <Select onValueChange={handleMediumChange} value={selectedMediumId} disabled={availableMediums.length === 0 || isSubmitting} name="medium-select">
              <SelectTrigger id="medium-select">
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
            <Label htmlFor="entity-select">Entidade</Label>
            <Select onValueChange={setSelectedEntityId} value={selectedEntityId} disabled={!selectedMediumId || isSubmitting} name="entity-select">
              <SelectTrigger id="entity-select">
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
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={selectedCategories.length === 0 || availableMediums.length === 0 || isSubmitting}>
            {getButtonText()}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
