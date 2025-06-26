"use client";

import { useState, useMemo } from 'react';
import type { Medium } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

// --- Interface de Propriedades ---
interface ConsulenteRegistrationProps {
  mediums: Medium[];
  addConsulente: (consulenteName: string, mediumId: string, entityId: string) => void;
}

// --- Componente: Agendamento de Consulente ---
// Renderiza um formulário para agendar um novo consulente com um médium e entidade
// que estejam disponíveis no momento.
export function ConsulenteRegistration({ mediums, addConsulente }: ConsulenteRegistrationProps) {
  // Estados para os campos do formulário.
  const [name, setName] = useState('');
  const [selectedMediumId, setSelectedMediumId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const { toast } = useToast();

  // `useMemo` otimiza o cálculo das listas de médiuns e entidades disponíveis,
  // refazendo o cálculo apenas quando a lista principal de médiuns muda.

  // Filtra apenas os médiuns que estão presentes e têm pelo menos uma entidade disponível.
  const availableMediums = useMemo(() => mediums.filter(t => t.isPresent && t.entities && t.entities.some(s => s.isAvailable)), [mediums]);
  
  // Filtra as entidades disponíveis do médium que foi selecionado.
  const availableEntities = useMemo(() => {
    const medium = availableMediums.find(t => t.id === selectedMediumId);
    return medium ? medium.entities.filter(s => s.isAvailable) : [];
  }, [availableMediums, selectedMediumId]);

  // Atualiza o médium selecionado e reseta a seleção de entidade.
  const handleMediumChange = (mediumId: string) => {
    setSelectedMediumId(mediumId);
    setSelectedEntityId('');
  }

  // Lida com o envio do formulário de agendamento.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Valida se todos os campos foram preenchidos.
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
          {/* Campo para o nome do consulente */}
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
          {/* Seletor de Médium */}
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
          {/* Seletor de Entidade (habilitado apenas após selecionar um médium) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Entidade</label>
            <Select onValueChange={setSelectedEntityId} value={selectedEntityId} disabled={!selectedMediumId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma entidade" />
              </SelectTrigger>
              <SelectContent>
                {availableEntities.map(entity => (
                  <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          {/* O botão é desabilitado se não houver médiuns disponíveis */}
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={availableMediums.length === 0}>
            {availableMediums.length > 0 ? 'Agendar Consulente' : 'Nenhum Médium Disponível'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
