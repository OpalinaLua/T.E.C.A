/**
 * @fileoverview Componente de formulário para cadastrar um novo médium.
 * Permite ao usuário inserir o nome do médium e uma ou mais entidades associadas,
 * cada uma com seu próprio limite de consulentes.
 */
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { spiritualCategories, type Category } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Interface para as props do componente.
interface MediumRegistrationProps {
  addMedium: (name: string, entities: { name: string; limit: number, category: Category }[]) => void;
}

// Interface para representar a estrutura de uma entidade sendo adicionada.
interface EntityInput {
    name: string;
    limit: number;
    category: Category;
}

export function MediumRegistration({ addMedium }: MediumRegistrationProps) {
  // Estados do componente
  const [name, setName] = useState('');
  const [currentEntityName, setCurrentEntityName] = useState('');
  const [currentEntityLimit, setCurrentEntityLimit] = useState('10'); // Limite padrão
  const [currentEntityCategory, setCurrentEntityCategory] = useState<Category | ''>('');
  const [entities, setEntities] = useState<EntityInput[]>([]);
  const { toast } = useToast();

  /**
   * Adiciona uma nova entidade à lista de entidades a serem cadastradas com o médium.
   */
  const handleAddEntity = () => {
    const limit = parseInt(currentEntityLimit, 10);
    if (currentEntityName.trim() && !isNaN(limit) && limit >= 0 && currentEntityCategory) {
      if (entities.some(e => e.name === currentEntityName.trim())) {
          toast({
              title: "Entidade Duplicada",
              description: `A entidade "${currentEntityName.trim()}" já foi adicionada.`,
              variant: "destructive",
          });
          return;
      }
      setEntities([...entities, { name: currentEntityName.trim(), limit, category: currentEntityCategory }]);
      setCurrentEntityName('');
      setCurrentEntityLimit('10'); // Reseta o limite para o padrão
      setCurrentEntityCategory('');
    } else {
        toast({
            title: "Dados Inválidos",
            description: "Por favor, forneça nome, categoria e um limite válido (número igual ou maior que zero) para a entidade.",
            variant: "destructive",
        })
    }
  };

  /**
   * Remove uma entidade da lista.
   * @param entityToRemove - O objeto da entidade a ser removida.
   */
  const handleRemoveEntity = (entityToRemove: EntityInput) => {
    setEntities(entities.filter(s => s.name !== entityToRemove.name));
  };

  /**
   * Submete o formulário, cadastrando o novo médium.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && entities.length > 0) {
      addMedium(name.trim(), entities);
      // Limpa o formulário após o sucesso
      setName('');
      setEntities([]);
      setCurrentEntityName('');
      setCurrentEntityLimit('10');
      toast({
        title: "Sucesso",
        description: `Médium ${name.trim()} foi cadastrado(a).`,
      });
    } else {
        toast({
            title: "Erro",
            description: "Por favor, forneça um nome para o médium e adicione pelo menos uma entidade.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastro de Médium</CardTitle>
        <CardDescription>Adicione um novo médium, suas entidades e o limite de consulentes por entidade.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medium-name">Nome do Médium</Label>
            <Input
              id="medium-name"
              placeholder="ex: Médium João"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Entidades</Label>
            <div className="flex items-end gap-2">
              <div className="flex-grow space-y-1.5">
                <Label htmlFor="entity-name" className="text-xs text-muted-foreground">Nome da Entidade</Label>
                <Input
                  id="entity-name"
                  placeholder="ex: Pombagira"
                  value={currentEntityName}
                  onChange={(e) => setCurrentEntityName(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEntity();
                      }
                  }}
                />
              </div>
              <div className='w-[130px] space-y-1.5'>
                <Label htmlFor="entity-category" className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={currentEntityCategory} onValueChange={(v) => setCurrentEntityCategory(v as Category)}>
                  <SelectTrigger id="entity-category">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {spiritualCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                  <Label htmlFor="entity-limit" className="text-xs text-muted-foreground">Limite</Label>
                  <Input
                      id="entity-limit"
                      type="number"
                      min="0"
                      placeholder="10"
                      value={currentEntityLimit}
                      onChange={(e) => setCurrentEntityLimit(e.target.value)}
                      className="w-20"
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEntity();
                          }
                      }}
                  />
              </div>
              <Button type="button" onClick={handleAddEntity} variant="outline" size="icon" className="shrink-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Adicionar Entidade</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {entities.map((entity, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1.5 text-sm py-1">
                {entity.name} ({entity.category}, {entity.limit})
                <button type="button" onClick={() => handleRemoveEntity(entity)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remover {entity.name}</span>
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
