/**
 * @fileoverview Componente que exibe as informações de um médium em um card.
 * Este componente mostra os detalhes do médium, suas entidades e consulentes.
 * Também fornece ações como editar, remover, e alterar o status de presença do médium
 * e a disponibilidade de suas entidades.
 */
"use client";

import { useMemo } from 'react';
import type { Medium, Category, Entity } from '@/lib/types';
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
import { UserX, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Interface para as props do componente.
interface MediumCardProps {
  medium: Medium;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
  selectedCategories: Category[];
}

export function MediumCard({ medium, removeConsulente, toggleEntityAvailability, selectedCategories }: MediumCardProps) {
  
  const activeEntitiesForGira = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    return medium.entities.filter(e => selectedCategories.includes(e.category));
  }, [medium.entities, selectedCategories]);

  const totalConsulentes = useMemo(() => {
    return medium.entities.reduce((acc, entity) => acc + entity.consulentes.length, 0);
  }, [medium.entities]);

  /**
   * Manipula a remoção de um consulente.
   */
  const handleRemoveConsulente = (entityId: string, consulenteId: string, consulenteName: string) => {
    removeConsulente(medium.id, entityId, consulenteId, consulenteName);
  };

  return (
    <Card className="flex flex-col h-full transition-all duration-300 ease-in-out">
      {/* Cabeçalho do Card com nome, status e botões de ação */}
      <CardHeader>
        <div className='flex items-start justify-between w-full'>
          <div className="flex flex-col">
            <CardTitle className="font-headline text-xl sm:text-2xl">{medium.name}</CardTitle>
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
           <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma entidade deste médium pertence às categorias selecionadas.</p>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation() }}>
                      {entity.isAvailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">Alterar Disponibilidade da Entidade</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Alterar Disponibilidade?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso marcará a entidade "{entity.name}" como {entity.isAvailable ? 'indisponível' : 'disponível'}.
                        {entity.isAvailable && (entity.consulentes?.length > 0) && ' Ao fazer isso, todos os consulentes agendados para esta entidade serão removidos.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => toggleEntityAvailability(medium.id, entity.id)}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {entity.consulentes.length > 0 ? (
                <ul className="space-y-2">
                  {entity.consulentes.map(consulente => (
                    <li key={consulente.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                      <span className="text-secondary-foreground">{consulente.name}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" disabled={!entity.isAvailable}>
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
                    </li>
                  ))}
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
