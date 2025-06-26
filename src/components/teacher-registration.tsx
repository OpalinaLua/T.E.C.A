"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Interface de Propriedades ---
interface MediumRegistrationProps {
  // Função recebida do componente pai para adicionar um novo médium.
  addMedium: (name: string, entities: string[]) => void;
}

// --- Componente: Cadastro de Médium ---
// Este componente renderiza um formulário para que o usuário possa cadastrar
// um novo médium, especificando seu nome e uma ou mais entidades.
export function MediumRegistration({ addMedium }: MediumRegistrationProps) {
  const [name, setName] = useState('');
  const [currentEntity, setCurrentEntity] = useState('');
  const [entities, setEntities] = useState<string[]>([]);
  const { toast } = useToast();

  // Adiciona uma entidade à lista de entidades do novo médium.
  const handleAddEntity = () => {
    // Garante que a entidade não está vazia e não é duplicada.
    if (currentEntity.trim() && !entities.includes(currentEntity.trim())) {
      setEntities([...entities, currentEntity.trim()]);
      setCurrentEntity(''); // Limpa o campo de input.
    }
  };

  // Remove uma entidade da lista.
  const handleRemoveEntity = (entityToRemove: string) => {
    setEntities(entities.filter(s => s !== entityToRemove));
  };

  // Lida com o envio do formulário.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Valida se o nome e pelo menos uma entidade foram fornecidos.
    if (name.trim() && entities.length > 0) {
      addMedium(name.trim(), entities);
      // Limpa todos os campos do formulário após o sucesso.
      setName('');
      setEntities([]);
      setCurrentEntity('');
      toast({
        title: "Sucesso",
        description: `Médium ${name.trim()} foi cadastrado(a).`,
      });
    } else {
        // Exibe uma mensagem de erro se a validação falhar.
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
          {/* Campo para o nome do médium */}
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
          {/* Campo para adicionar entidades */}
          <div className="space-y-2">
            <label htmlFor="entity-name" className="text-sm font-medium">Entidades</label>
            <div className="flex gap-2">
              <Input
                id="entity-name"
                placeholder="ex: Pombagira"
                value={currentEntity}
                onChange={(e) => setCurrentEntity(e.target.value)}
                onKeyDown={(e) => {
                    // Permite adicionar a entidade pressionando Enter.
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
          {/* Exibição das entidades já adicionadas */}
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
