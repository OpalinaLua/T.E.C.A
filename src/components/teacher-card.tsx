/**
 * @fileoverview Componente que exibe as informações de um médium em um card.
 * Este componente mostra os detalhes do médium, suas entidades e consulentes.
 * Também fornece ações como editar, remover, e alterar o status de presença do médium
 * e a disponibilidade de suas entidades.
 */
"use client";

import { useState } from 'react';
import type { Medium, Entity } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserX, Eye, EyeOff, LogOut, LogIn, Trash2, Pencil, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Interface para as props do componente.
interface MediumCardProps {
  medium: Medium;
  removeMedium: (mediumId: string) => void;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string, consulenteName: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
  updateMedium: (mediumId: string, data: { name?: string; entities?: Entity[] }) => void;
}

export function MediumCard({ medium, removeMedium, removeConsulente, toggleMediumPresence, toggleEntityAvailability, updateMedium }: MediumCardProps) {
  // Estados do componente para controle do diálogo de edição.
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(medium.name);
  const [editedEntities, setEditedEntities] = useState<Entity[]>(JSON.parse(JSON.stringify(medium.entities))); // Cópia profunda para edição

  /**
   * Manipula a remoção do médium.
   */
  const handleRemoveMedium = () => {
    removeMedium(medium.id);
  };

  /**
   * Manipula a remoção de um consulente.
   */
  const handleRemoveConsulente = (entityId: string, consulenteId: string, consulenteName: string) => {
    removeConsulente(medium.id, entityId, consulenteId, consulenteName);
  };

  // Funções para manipulação do estado de edição do médium e entidades.
  const handleEntityNameChange = (entityId: string, newName: string) => {
    setEditedEntities(currentEntities => 
      currentEntities.map(e => e.id === entityId ? { ...e, name: newName } : e)
    );
  };
  
  const handleEntityLimitChange = (entityId: string, newLimit: string) => {
    const limit = parseInt(newLimit, 10);
    setEditedEntities(currentEntities => 
        currentEntities.map(e => e.id === entityId ? { ...e, consulenteLimit: isNaN(limit) || limit < 0 ? 0 : limit } : e)
    );
  };

  const handleRemoveEntityFromEdit = (entityId: string) => {
      const entity = editedEntities.find(e => e.id === entityId);
      if (entity && entity.consulentes.length > 0) {
          toast({
              title: "Ação não permitida",
              description: `Não é possível remover a entidade "${entity.name}" pois ela possui consulentes agendados.`,
              variant: "destructive"
          });
          return;
      }
      setEditedEntities(currentEntities => currentEntities.filter(e => e.id !== entityId));
  }
  
  const handleAddEntityToEdit = () => {
      setEditedEntities(currentEntities => [
          ...currentEntities,
          {
              id: `entity-${Date.now()}`,
              name: "Nova Entidade",
              consulentes: [],
              isAvailable: true,
              consulenteLimit: 10, // Limite padrão para novas entidades
          }
      ])
  }

  /**
   * Salva as atualizações feitas no diálogo de edição.
   */
  const handleUpdate = () => {
    // Validações
    if (editedName.trim() === '') {
      toast({ title: "Erro", description: "O nome do médium não pode ser vazio.", variant: "destructive" });
      return;
    }
    if (editedEntities.some(e => e.name.trim() === '')) {
      toast({ title: "Erro", description: "O nome da entidade não pode ser vazio.", variant: "destructive" });
      return;
    }
    
    // Verifica se houve mudanças para evitar atualizações desnecessárias.
    const nameChanged = editedName !== medium.name;
    const entitiesChanged = JSON.stringify(editedEntities) !== JSON.stringify(medium.entities);

    if (nameChanged || entitiesChanged) {
        updateMedium(medium.id, { name: editedName, entities: editedEntities });
        toast({
            title: "Médium Atualizado",
            description: `Os dados de ${editedName} foram atualizados.`,
        });
    }

    setIsEditDialogOpen(false);
  }

  /**
   * Reseta o estado de edição para os valores originais do médium caso o usuário cancele a edição.
   */
  const resetEditState = () => {
      setEditedName(medium.name);
      setEditedEntities(JSON.parse(JSON.stringify(medium.entities)));
  }

  return (
    <Card className="flex flex-col h-full transition-all duration-300 ease-in-out">
      {/* Cabeçalho do Card com nome, status e botões de ação */}
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline text-2xl">{medium.name}</CardTitle>
          <CardDescription>
            <Badge variant="outline" className={medium.isPresent ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}>
              {medium.isPresent ? 'Presente' : 'Ausente'}
            </Badge>
          </CardDescription>
        </div>
        <div className="flex items-center">
            {/* Diálogo de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
              if (!open) resetEditState();
              setIsEditDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-5 w-5" />
                  <span className="sr-only">Editar Médium</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Médium</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nome
                    </Label>
                    <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Entidades</Label>
                    <div className="col-span-3 space-y-2">
                      {editedEntities.map((entity) => (
                        <div key={entity.id} className="flex items-center gap-2">
                          <Input placeholder="Nome da entidade" value={entity.name} onChange={(e) => handleEntityNameChange(entity.id, e.target.value)} />
                          <Input placeholder="Limite" type="number" value={entity.consulenteLimit} onChange={(e) => handleEntityLimitChange(entity.id, e.target.value)} className="w-20 shrink-0" />
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveEntityFromEdit(entity.id)} className="shrink-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={handleAddEntityToEdit} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Entidade
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleUpdate}>Salvar Alterações</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Ações de Presença e Remoção */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  {medium.isPresent ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                  <span className="sr-only">Alternar Presença</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso marcará o(a) médium como {medium.isPresent ? 'ausente' : 'presente'}.
                    {medium.isPresent && (medium.entities.some(e => e.consulentes?.length > 0)) && ' Ao fazer isso, todos os consulentes agendados para este médium serão removidos.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => toggleMediumPresence(medium.id)}>
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive">
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Remover Médium</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso removerá permanentemente o médium e todos os seus consulentes agendados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMedium} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      
      {/* Conteúdo do Card com a lista de entidades e consulentes */}
      <CardContent className="flex-grow space-y-4">
        {medium.entities && medium.entities.map((entity, index) => (
          <div key={entity.id} className={cn(!entity.isAvailable && "opacity-60")}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex justify-between items-center mb-2">
              <h3 className={cn("font-semibold text-lg", !entity.isAvailable && "line-through")}>
                {entity.name} <span className="font-normal text-sm text-muted-foreground">({entity.consulentes.length}/{entity.consulenteLimit})</span>
              </h3>
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
                  <li key={consulente.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 group">
                    <span className="text-secondary-foreground">{consulente.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" disabled={!entity.isAvailable}>
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
        ))}
      </CardContent>
    </Card>
  );
}
