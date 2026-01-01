
/**
 * @fileoverview Componente que exibe as informações de um médium em um card.
 * Este componente mostra os detalhes do médium, suas entidades e consulentes.
 * Também fornece ações como editar, remover, e alterar o status de presença do médium
 * e a disponibilidade de suas entidades.
 */
"use client";

import { useMemo, useState } from 'react';
import type { Medium, Category, Entity, Consulente } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserX, Pencil, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

interface EditConsulenteDialogProps {
  consulente: Consulente;
  onSave: (newName: string) => void;
  trigger: React.ReactNode;
}

function EditConsulenteDialog({ consulente, onSave, trigger }: EditConsulenteDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(consulente.name);

  const handleSave = () => {
    if (newName.trim() && newName.trim() !== consulente.name) {
      onSave(newName.trim());
    }
    setOpen(false);
  };
  
  // Reseta o nome ao abrir o dialog
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setNewName(consulente.name);
    }
    setOpen(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar Nome do Consulente</AlertDialogTitle>
          <AlertDialogDescription>
            Altere o nome de "{consulente.name}" e clique em Salvar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>
            Salvar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


// Interface para as props do componente.
interface MediumCardProps {
  medium: Medium;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => void;
  updateConsulenteName: (mediumId: string, entityId: string, consulenteId: string, newName: string) => void;
  selectedCategories: Category[];
  spiritualCategories: Category[];
  searchQuery?: string;
}

export function MediumCard({ medium, removeConsulente, updateConsulenteName, selectedCategories, spiritualCategories, searchQuery }: MediumCardProps) {
  
  const sortedEntities = useMemo(() => {
    // Cria um mapa da ordem global das categorias para busca rápida.
    const categoryOrderMap = new Map(spiritualCategories.map((cat, index) => [cat, index]));
    
    return [...medium.entities].sort((a, b) => {
        const orderA = categoryOrderMap.get(a.category) ?? Infinity;
        const orderB = categoryOrderMap.get(b.category) ?? Infinity;
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return a.order - b.order; // Fallback para a ordem da entidade, se houver
    });
  }, [medium.entities, spiritualCategories]);

  const activeEntitiesForGira = useMemo(() => {
    const query = searchQuery?.toLowerCase().trim() || '';

    // 1. Filtra primeiro pelas categorias selecionadas na gira
    let entitiesForGira = sortedEntities.filter(e => selectedCategories.includes(e.category));

    // 2. Se houver um termo de busca, aplica a filtragem adicional
    if (query) {
      const isSearchingForMedium = medium.name.toLowerCase().includes(query);
      if (!isSearchingForMedium) {
        entitiesForGira = entitiesForGira.filter(e => 
          e.name.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          e.consulentes.some(c => c.name.toLowerCase().includes(query))
        );
      }
    }
    
    return entitiesForGira;
  }, [sortedEntities, selectedCategories, searchQuery, medium.name]);


  const totalConsulentes = useMemo(() => {
    return medium.entities.reduce((acc, entity) => acc + entity.consulentes.length, 0);
  }, [medium.entities]);

  /**
   * Manipula a remoção de um consulente.
   */
  const handleRemoveConsulente = (entityId: string, consulenteId: string, consulenteName: string) => {
    removeConsulente(medium.id, entityId, consulenteId, consulenteName);
  };
  
  const handleUpdateConsulente = (entityId: string, consulenteId: string, newName: string) => {
    updateConsulenteName(medium.id, entityId, consulenteId, newName);
  };
  
  const query = searchQuery?.toLowerCase().trim() || '';

  return (
    <Card className="flex flex-col h-full transition-all duration-300 ease-in-out">
      {/* Cabeçalho do Card com nome, status e botões de ação */}
      <CardHeader>
        <div className='flex items-start justify-between w-full'>
          <div className="flex flex-col gap-2">
            <CardTitle className="font-headline text-xl sm:text-2xl">{medium.name}</CardTitle>
             {medium.role && (
              <Badge variant="secondary" className="w-fit">
                <Crown className="mr-1.5 h-3 w-3 text-amber-500" />
                {medium.role}
              </Badge>
            )}
          </div>
          <Badge variant="outline" className={cn("text-xs shrink-0", medium.isPresent ? "text-green-600 border-green-600" : "text-red-600 border-red-600")}>
            {medium.isPresent ? 'Presente' : 'Ausente'}
          </Badge>
        </div>
      </CardHeader>
      
      {/* Conteúdo do Card com a lista de entidades e consulentes */}
      <CardContent className={cn("flex-grow space-y-4", totalConsulentes === 0 && "pt-0 sm:pt-0")}>
        {selectedCategories.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4">Selecione uma ou mais categorias de gira para ver as entidades disponíveis.</p>
        )}
        
        {selectedCategories.length > 0 && activeEntitiesForGira.length === 0 && (
           <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma entidade deste médium corresponde à sua busca ou às categorias selecionadas.</p>
        )}

        {totalConsulentes > 0 ? (
          // --- VISÃO DETALHADA (COM CONSULENTES) ---
          activeEntitiesForGira.map((entity, index) => (
            <div key={entity.id} className={cn((!entity.isAvailable || entity.consulenteLimit === 0) && "opacity-60")}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className={cn("font-semibold text-lg", (!entity.isAvailable || entity.consulenteLimit === 0) && "line-through")}>
                    {entity.name} <span className="font-normal text-sm text-muted-foreground">({entity.consulentes.length}/{entity.consulenteLimit})</span>
                  </h3>
                  <Badge variant="outline">{entity.category}</Badge>
                </div>
                 {/* O botão de toggle foi removido, pois a disponibilidade é gerenciada no painel de admin */}
              </div>
              {entity.consulentes.length > 0 ? (
                <ul className="space-y-2">
                  {entity.consulentes.map(consulente => {
                    const isConsulenteMatch = query && consulente.name.toLowerCase().includes(query);
                    return (
                        <li key={consulente.id} className={cn("flex items-center justify-between p-2 rounded-md bg-secondary/50", isConsulenteMatch && "ring-2 ring-accent")}>
                          <span className="text-secondary-foreground">{consulente.name}</span>
                          <div className="flex items-center">
                            <EditConsulenteDialog
                              consulente={consulente}
                              onSave={(newName) => handleUpdateConsulente(entity.id, consulente.id, newName)}
                              trigger={
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" disabled={!entity.isAvailable}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar consulente</span>
                                </Button>
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" disabled={!entity.isAvailable}>
                                    <UserX className="h-4 w-4" />
                                    <span className="sr-only">Excluir consulente</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Consulente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza de que deseja remover {consulente.name} desta entidade?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveConsulente(entity.id, consulente.id, consulente.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhum consulente agendado.</p>
              )}
            </div>
          ))
        ) : (
          // --- VISÃO SIMPLIFICADA (SEM CONSULENTES) ---
          activeEntitiesForGira.length > 0 && (
            <div className="space-y-2">
              {activeEntitiesForGira.map((entity: Entity) => (
                <div 
                  key={entity.id} 
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md bg-secondary/30",
                    (!entity.isAvailable || entity.consulenteLimit === 0) && "opacity-50"
                  )}
                >
                  <p className={cn(
                    "text-secondary-foreground",
                    (!entity.isAvailable || entity.consulenteLimit === 0) && "line-through"
                  )}>
                    {entity.name}
                  </p>
                  <Badge variant="outline" className="text-xs">{entity.category}</Badge>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
