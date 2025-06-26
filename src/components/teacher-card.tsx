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

// --- Interface de Propriedades para o Card do Médium ---
interface MediumCardProps {
  medium: Medium;
  removeMedium: (mediumId: string) => void;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
  updateMedium: (mediumId: string, data: { name?: string; entities?: Entity[] }) => void;
}

// --- Componente: Card do Médium ---
// Exibe todas as informações de um médium, suas entidades e consulentes.
// Permite realizar ações como editar, excluir, marcar presença e alterar disponibilidade.
export function MediumCard({ medium, removeMedium, removeConsulente, toggleMediumPresence, toggleEntityAvailability, updateMedium }: MediumCardProps) {
  const { toast } = useToast();

  // --- Estados para o formulário de edição ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Estado para o nome do médium editado
  const [editedName, setEditedName] = useState(medium.name);
  // Estado para a lista de entidades editadas (uma cópia profunda para evitar mutação direta)
  const [editedEntities, setEditedEntities] = useState<Entity[]>(JSON.parse(JSON.stringify(medium.entities)));

  // --- Funções de Manipulação (Handlers) ---

  // Lida com a remoção do médium.
  const handleRemoveMedium = () => {
    removeMedium(medium.id);
    toast({
        title: "Médium Removido",
        description: `O médium ${medium.name} foi removido com sucesso.`,
    })
  };

  // Lida com a remoção de um consulente.
  const handleRemoveConsulente = (entityId: string, consulenteId: string, consulenteName: string) => {
    removeConsulente(medium.id, entityId, consulenteId);
    toast({
        title: "Consulente Removido",
        description: `${consulenteName} foi removido(a).`,
    })
  };
  
  // Lida com a mudança de nome de uma entidade no modo de edição.
  const handleEntityNameChange = (entityId: string, newName: string) => {
    setEditedEntities(currentEntities => 
      currentEntities.map(e => e.id === entityId ? { ...e, name: newName } : e)
    );
  };
  
  // Lida com a remoção de uma entidade no modo de edição.
  const handleRemoveEntityFromEdit = (entityId: string) => {
      const entity = editedEntities.find(e => e.id === entityId);
      // Impede a remoção se a entidade tiver consulentes.
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
  
  // Lida com a adição de uma nova entidade no modo de edição.
  const handleAddEntityToEdit = () => {
      setEditedEntities(currentEntities => [
          ...currentEntities,
          {
              id: `entity-${Date.now()}`,
              name: "Nova Entidade",
              consulentes: [],
              isAvailable: true,
          }
      ])
  }

  // Lida com o salvamento das alterações feitas no formulário de edição.
  const handleUpdate = () => {
    // Validações básicas.
    if (editedName.trim() === '') {
      toast({ title: "Erro", description: "O nome do médium não pode ser vazio.", variant: "destructive" });
      return;
    }
    if (editedEntities.some(e => e.name.trim() === '')) {
      toast({ title: "Erro", description: "O nome da entidade não pode ser vazio.", variant: "destructive" });
      return;
    }
    
    // Verifica se houve alguma mudança real para evitar escritas desnecessárias no banco.
    const nameChanged = editedName !== medium.name;
    const entitiesChanged = JSON.stringify(editedEntities) !== JSON.stringify(medium.entities);

    if (nameChanged || entitiesChanged) {
        updateMedium(medium.id, { name: editedName, entities: editedEntities });
        toast({
            title: "Médium Atualizado",
            description: `Os dados de ${editedName} foram atualizados.`,
        });
    }

    setIsEditDialogOpen(false); // Fecha o diálogo de edição.
  }

  // Reseta os estados de edição para os valores originais caso o usuário cancele a edição.
  const resetEditState = () => {
      setEditedName(medium.name);
      setEditedEntities(JSON.parse(JSON.stringify(medium.entities)));
  }

  return (
    <Card className="flex flex-col h-full transition-all duration-300 ease-in-out">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline text-2xl">{medium.name}</CardTitle>
          <CardDescription>
            <Badge variant="outline" className={medium.isPresent ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}>
              {medium.isPresent ? 'Presente' : 'Ausente'}
            </Badge>
          </CardDescription>
        </div>
        {/* Container para os botões de ação */}
        <div className="flex items-center">
            {/* Diálogo de Edição */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
              if (!open) resetEditState(); // Reseta o estado se o diálogo for fechado.
              setIsEditDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-5 w-5" />
                  <span className="sr-only">Editar Médium</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Editar Médium</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Campo de edição do nome */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nome
                    </Label>
                    <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" />
                  </div>
                  {/* Seção de edição das entidades */}
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Entidades</Label>
                    <div className="col-span-3 space-y-2">
                      {editedEntities.map((entity) => (
                        <div key={entity.id} className="flex items-center gap-2">
                          <Input value={entity.name} onChange={(e) => handleEntityNameChange(entity.id, e.target.value)} />
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

            {/* Diálogo para Alternar Presença */}
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
                    {/* Mensagem de aviso adicional */}
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
            
            {/* Diálogo para Remover Médium */}
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
      <CardContent className="flex-grow space-y-4">
        {/* Mapeia e exibe as entidades e seus consulentes */}
        {medium.entities && medium.entities.map((entity, index) => (
          <div key={entity.id} className={cn(!entity.isAvailable && "opacity-60")}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex justify-between items-center mb-2">
              <h3 className={cn("font-semibold text-lg", !entity.isAvailable && "line-through")}>{entity.name}</h3>
              {/* Diálogo para Alternar Disponibilidade da Entidade */}
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
                      {/* Mensagem de aviso adicional */}
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
            {/* Lista de Consulentes */}
            {entity.consulentes.length > 0 ? (
              <ul className="space-y-2">
                {entity.consulentes.map(consulente => (
                  <li key={consulente.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 group">
                    <span className="text-secondary-foreground">{consulente.name}</span>
                    {/* Diálogo para Remover Consulente */}
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
                          <AlertDialogAction onClick={() => handleRemoveConsulente(medium.id, entity.id, consulente.id, consulente.name)} className="bg-destructive text-destructive-foreground">
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
