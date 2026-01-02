/**
 * @fileoverview Componente que exibe as informações de um médium em um card.
 * Este componente mostra os detalhes do médium, suas entidades e consulentes.
 */
"use client";

import { useMemo, useState } from 'react';
import type { Medium, Category, Consulente, ConsulenteStatus } from '@/lib/types';
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
import { Pencil, Crown, UserCheck, UserMinus, UserX } from 'lucide-react';
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
  updateConsulenteStatus: (mediumId: string, entityId: string, consulenteId: string, status: ConsulenteStatus) => void;
  selectedCategories: Category[];
  spiritualCategories: Category[];
  searchQuery?: string;
}

export function MediumCard({ medium, removeConsulente, updateConsulenteName, updateConsulenteStatus, selectedCategories, spiritualCategories, searchQuery }: MediumCardProps) {
  
  const sortedEntities = useMemo(() => {
    const categoryOrderMap = new Map(spiritualCategories.map((cat, index) => [cat, index]));
    
    return [...medium.entities].sort((a, b) => {
        const orderA = categoryOrderMap.get(a.category) ?? Infinity;
        const orderB = categoryOrderMap.get(b.category) ?? Infinity;
        if (orderA !== orderB) {
            return orderA - orderB;
        }
        return a.order - b.order;
    });
  }, [medium.entities, spiritualCategories]);

  const activeEntitiesForGira = useMemo(() => {
    const query = searchQuery?.toLowerCase().trim() || '';
    let entitiesForGira = sortedEntities.filter(e => selectedCategories.includes(e.category));

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

  const totalConsulentesInGira = useMemo(() => {
     return activeEntitiesForGira.reduce((acc, entity) => acc + entity.consulentes.length, 0);
  }, [activeEntitiesForGira]);

  const handleUpdateConsulente = (entityId: string, consulenteId: string, newName: string) => {
    updateConsulenteName(medium.id, entityId, consulenteId, newName);
  };

  const handleUpdateConsulenteStatus = (entityId: string, consulente: Consulente, newStatus: ConsulenteStatus) => {
    const statusToSet = consulente.status === newStatus ? 'agendado' : newStatus;
    updateConsulenteStatus(medium.id, entityId, consulente.id, statusToSet);
  };
  
  const query = searchQuery?.toLowerCase().trim() || '';

  const getConsulenteStyle = (status: ConsulenteStatus) => {
    switch (status) {
      case 'atendido':
        return "bg-green-500/10 text-green-500/80";
      case 'ausente':
        return "bg-red-500/10 text-red-500/80 line-through";
      case 'agendado':
      default:
        return "bg-secondary/50 text-secondary-foreground";
    }
  };

  return (
      <Card className="flex flex-col h-full transition-all duration-300 ease-in-out">
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
        
        <CardContent className={cn("flex-grow space-y-4", totalConsulentesInGira === 0 && activeEntitiesForGira.length === 0 && "pt-0 sm:pt-0")}>
          {selectedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">Selecione uma ou mais categorias de gira para ver as entidades.</p>
          ) : activeEntitiesForGira.length === 0 ? (
             <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma entidade deste médium corresponde à sua busca ou às categorias selecionadas.</p>
          ) : (
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
                </div>
                {entity.consulentes.length > 0 ? (
                  <ul className="space-y-2">
                    {entity.consulentes.map(consulente => {
                      const isConsulenteMatch = query && consulente.name.toLowerCase().includes(query);
                      return (
                          <li key={consulente.id} className={cn("flex items-center justify-between p-2 rounded-md transition-colors", getConsulenteStyle(consulente.status), isConsulenteMatch && "ring-2 ring-accent")}>
                            <div className="flex items-center gap-2">
                                <span className={cn("font-medium", consulente.status === 'ausente' && 'line-through')}>{consulente.name}</span>
                            </div>

                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:text-green-500 h-8 w-8", consulente.status === 'atendido' && 'text-green-500')} onClick={() => handleUpdateConsulenteStatus(entity.id, consulente, 'atendido')}>
                                  <UserCheck className="h-4 w-4" />
                                  <span className="sr-only">Marcar como atendido</span>
                              </Button>
                              
                              <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:text-amber-500 h-8 w-8", consulente.status === 'ausente' && 'text-amber-500')} onClick={() => handleUpdateConsulenteStatus(entity.id, consulente, 'ausente')}>
                                  <UserMinus className="h-4 w-4" />
                                  <span className="sr-only">Marcar como ausente</span>
                              </Button>
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
                                        <span className="sr-only">Remover consulente</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação irá remover permanentemente o agendamento para {consulente.name}.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => removeConsulente(medium.id, entity.id, consulente.id, consulente.name)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
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
                  <p className="text-sm text-muted-foreground italic">Nenhum consulente para esta entidade.</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
  );
}
