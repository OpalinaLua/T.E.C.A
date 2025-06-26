/**
 * @fileoverview Componente para agendar um novo consulente.
 * Permite ao usuário selecionar um médium e uma entidade disponíveis
 * e inserir o nome do consulente para realizar o agendamento.
 */
"use client";

import { useState, useMemo } from 'react';
import type { Medium } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

// Interface para as props do componente.
interface ConsulenteRegistrationProps {
  mediums: Medium[];
  addConsulente: (consulenteName: string, mediumId: string, entityId: string) => void;
}

export function ConsulenteRegistration({ mediums, addConsulente }: ConsulenteRegistrationProps) {
  // Estados do componente.
  const [name, setName] = useState('');
  const [selectedMediumId, setSelectedMediumId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const { toast } = useToast();

  // Memoiza a lista de médiuns disponíveis para evitar recálculos desnecessários.
  // Um médium está disponível se estiver presente e tiver pelo menos uma entidade disponível para agendamento.
  const availableMediums = useMemo(() => mediums.filter(t => 
    t.isPresent && t.entities && t.entities.some(s => s.isAvailable && s.consulentes.length < s.consulenteLimit)
  ), [mediums]);
  
  // Memoiza a lista de entidades disponíveis para o médium selecionado.
  const availableEntities = useMemo(() => {
    const medium = availableMediums.find(t => t.id === selectedMediumId);
    // Uma entidade está disponível se `isAvailable` for true e o número de consulentes for menor que o limite.
    return medium ? medium.entities.filter(s => s.isAvailable && s.consulentes.length < s.consulenteLimit) : [];
  }, [availableMediums, selectedMediumId]);

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
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Médium</label>
            <Select onValueChange={handleMediumChange} value={selectedMediumId}>
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
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={availableMediums.length === 0}>
            {availableMediums.length > 0 ? 'Agendar Consulente' : 'Nenhum Médium Disponível'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
