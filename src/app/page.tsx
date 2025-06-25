"use client";

import { useState, useMemo } from 'react';
import type { Medium } from '@/lib/types';

import { useSchoolData } from '@/hooks/use-school-data';
import { useToast } from '@/hooks/use-toast';
import { SchoolOverview } from '@/components/school-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// --- Component: MediumRegistration ---
interface MediumRegistrationProps {
  addMedium: (name: string, entities: string[]) => void;
}

function MediumRegistration({ addMedium }: MediumRegistrationProps) {
  const [name, setName] = useState('');
  const [currentEntity, setCurrentEntity] = useState('');
  const [entities, setEntities] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAddEntity = () => {
    if (currentEntity.trim() && !entities.includes(currentEntity.trim())) {
      setEntities([...entities, currentEntity.trim()]);
      setCurrentEntity('');
    }
  };

  const handleRemoveEntity = (entityToRemove: string) => {
    setEntities(entities.filter(s => s !== entityToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && entities.length > 0) {
      addMedium(name.trim(), entities);
      setName('');
      setEntities([]);
      setCurrentEntity('');
      toast({
        title: "Sucesso",
        description: `Médium ${name.trim()} foi cadastrado(a).`,
      });
    } else {
        toast({
            title: "Erro",
            description: "Por favor, forneça um nome para o médium e pelo menos uma entidade.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastro de Médium</CardTitle>
        <CardDescription>Adicione um novo médium e suas entidades ao sistema.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="medium-name" className="text-sm font-medium">Nome do Médium</label>
            <Input
              id="medium-name"
              placeholder="ex: Médium João"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="entity-name" className="text-sm font-medium">Entidades</label>
            <div className="flex gap-2">
              <Input
                id="entity-name"
                placeholder="ex: Pombagira"
                value={currentEntity}
                onChange={(e) => setCurrentEntity(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEntity();
                    }
                }}
              />
              <Button type="button" onClick={handleAddEntity} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Adicionar Entidade</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {entity}
                <button type="button" onClick={() => handleRemoveEntity(entity)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remover {entity}</span>
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Cadastrar Médium</Button>
        </CardFooter>
      </form>
    </Card>
  );
}


// --- Component: ConsulenteRegistration ---
interface ConsulenteRegistrationProps {
  mediums: Medium[];
  addConsulente: (consulenteName: string, mediumId: string, entityId: string) => void;
}

function ConsulenteRegistration({ mediums, addConsulente }: ConsulenteRegistrationProps) {
  const [name, setName] = useState('');
  const [selectedMediumId, setSelectedMediumId] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const { toast } = useToast();

  const availableMediums = useMemo(() => mediums.filter(t => t.isPresent && t.entities && t.entities.some(s => s.isAvailable)), [mediums]);
  
  const availableEntities = useMemo(() => {
    const medium = availableMediums.find(t => t.id === selectedMediumId);
    return medium ? medium.entities.filter(s => s.isAvailable) : [];
  }, [availableMediums, selectedMediumId]);

  const handleMediumChange = (mediumId: string) => {
    setSelectedMediumId(mediumId);
    setSelectedEntityId('');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedMediumId && selectedEntityId) {
      addConsulente(name.trim(), selectedMediumId, selectedEntityId);
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
                  <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
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
  } = useSchoolData();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-16 w-1/3" />
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

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-5xl font-bold font-headline text-primary">
            T.E.C.A
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Uma forma simples para consulência.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
            <MediumRegistration addMedium={addMedium} />
            <ConsulenteRegistration mediums={mediums} addConsulente={addConsulente} />
          </aside>
          
          <div className="lg:col-span-2">
            <SchoolOverview
              mediums={mediums}
              removeMedium={removeMedium}
              removeConsulente={removeConsulente}
              toggleMediumPresence={toggleMediumPresence}
              toggleEntityAvailability={toggleEntityAvailability}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
