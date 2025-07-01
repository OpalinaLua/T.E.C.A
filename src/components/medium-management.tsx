
"use client";

import { useState } from 'react';
import type { Medium, Entity, Category } from '@/lib/types';
import { spiritualCategories } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pencil, Trash2, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MediumRegistration } from './teacher-registration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { LoginHistory } from './login-history';
import { CategorySelection } from './category-selection';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { ADMIN_EMAILS } from '@/lib/secrets';
import { auth } from '@/lib/firebase';

interface MediumManagementProps {
  mediums: Medium[];
  addMedium: (name: string, entities: { name: string; limit: number; category: Category }[]) => Promise<void>;
  updateMedium: (mediumId: string, data: { name?: string; entities?: Entity[] }) => void;
  removeMedium: (mediumId: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  clearLoginHistory: () => Promise<void>;
  selectedCategories: Category[];
  onSelectionChange: (category: Category) => void;
  onSuccess?: () => void;
  onClose: () => void;
}

// Internal component to handle the state for editing a single medium
function EditMedium({ medium, updateMedium }: { medium: Medium; updateMedium: MediumManagementProps['updateMedium'] }) {
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editedName, setEditedName] = useState(medium.name);
    const [editedEntities, setEditedEntities] = useState<Entity[]>(JSON.parse(JSON.stringify(medium.entities)));

    const handleEntityNameChange = (entityId: string, newName: string) => {
        setEditedEntities(currentEntities => 
        currentEntities.map(e => e.id === entityId ? { ...e, name: newName } : e)
        );
    };

    const handleEntityCategoryChange = (entityId: string, newCategory: Category) => {
        setEditedEntities(currentEntities =>
        currentEntities.map(e => e.id === entityId ? { ...e, category: newCategory } : e)
        );
    };
    
    const handleEntityLimitChange = (entityId: string, newLimit: string) => {
        const limit = parseInt(newLimit, 10);
        setEditedEntities(currentEntities => 
            currentEntities.map(e => e.id === entityId ? { ...e, consulenteLimit: isNaN(limit) ? 0 : limit } : e)
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
                category: "Exu",
                consulentes: [],
                isAvailable: true,
                consulenteLimit: 5,
            }
        ])
    }

    const handleUpdate = () => {
        if (editedName.trim() === '') {
            toast({ title: "Erro", description: "O nome do médium não pode ser vazio.", variant: "destructive" });
            return;
        }
        if (editedEntities.some(e => e.name.trim() === '')) {
            toast({ title: "Erro", description: "O nome da entidade não pode ser vazio.", variant: "destructive" });
            return;
        }
        
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

    const resetEditState = () => {
        setEditedName(medium.name);
        setEditedEntities(JSON.parse(JSON.stringify(medium.entities)));
    }

    return (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            if (!open) resetEditState();
            setIsEditDialogOpen(open);
        }}>
            <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar Médium</span>
            </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Editar Médium</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:items-center sm:gap-x-4">
                <Label htmlFor="name" className="text-left sm:text-right">
                    Nome
                </Label>
                <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-1 sm:col-span-3" />
                </div>
                <div className="grid grid-cols-1 gap-y-2 sm:items-start sm:gap-x-4">
                <Label className="text-left sm:pt-2">Entidades</Label>
                <div className="col-span-1 sm:col-span-3 space-y-4">
                    {editedEntities.map((entity) => (
                    <div key={entity.id} className="space-y-3 rounded-md border p-3 relative">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveEntityFromEdit(entity.id)} className="absolute top-1 right-1 h-6 w-6 shrink-0">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remover Entidade</span>
                        </Button>
                        <div className='pr-8 space-y-1.5'>
                            <Label htmlFor={`entity-name-${entity.id}`}>Nome da Entidade</Label>
                            <Input id={`entity-name-${entity.id}`} placeholder="Nome da entidade" value={entity.name} onChange={(e) => handleEntityNameChange(entity.id, e.target.value)} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="w-full space-y-1.5">
                            <Label htmlFor={`entity-category-${entity.id}`}>Categoria</Label>
                            <Select value={entity.category} onValueChange={(v) => handleEntityCategoryChange(entity.id, v as Category)}>
                                <SelectTrigger id={`entity-category-${entity.id}`}>
                                <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                {spiritualCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            </div>
                            <div className="w-full space-y-1.5">
                            <Label htmlFor={`entity-limit-${entity.id}`}>Limite</Label>
                            <Input id={`entity-limit-${entity.id}`} placeholder="Limite" type="number" value={entity.consulenteLimit} onChange={(e) => handleEntityLimitChange(entity.id, e.target.value)} />
                            </div>
                        </div>
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
    );
}

export function MediumManagement({ mediums, addMedium, updateMedium, removeMedium, toggleMediumPresence, clearLoginHistory, onSuccess, selectedCategories, onSelectionChange, onClose }: MediumManagementProps) {
    const { toast } = useToast();
    const user = auth.currentUser;

    const handleConfirmClearHistory = async () => {
        if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
            try {
                await clearLoginHistory();
            } catch (error) {
                // Toast for error is handled in the useSchoolData hook
            }
        } else {
            toast({
                title: "Acesso Negado",
                description: "Você não tem permissão para executar esta ação. Apenas administradores podem limpar o histórico.",
                variant: "destructive",
            });
        }
    };

    const handleSaveChanges = () => {
        toast({
            title: "Alterações Salvas",
            description: "Suas alterações na gira e na presença dos médiuns foram salvas com sucesso.",
        });
        onClose();
    }

    return (
        <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold font-headline">Seleção da Gira</CardTitle>
                    <CardDescription>Selecione as linhas de trabalho que estarão ativas hoje.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CategorySelection
                    selectedCategories={selectedCategories}
                    onSelectionChange={onSelectionChange}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Médiuns Cadastrados</CardTitle>
                    <CardDescription>Gerencie os médiuns do sistema. Edite, remova ou altere a presença dos médiuns.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-72">
                        <div className="space-y-2 pr-4">
                            {mediums.map(medium => (
                                <div key={medium.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <Switch
                                        id={`presence-${medium.id}`}
                                        checked={medium.isPresent}
                                        onCheckedChange={() => toggleMediumPresence(medium.id)}
                                        aria-label={`Marcar presença para ${medium.name}`}
                                      />
                                      <Label htmlFor={`presence-${medium.id}`} className="font-medium cursor-pointer flex items-center gap-2">
                                        {medium.name}
                                        <Badge variant="outline" className={cn("text-xs py-0.5", medium.isPresent ? "text-green-600 border-green-600" : "text-red-600 border-red-600")}>
                                            {medium.isPresent ? 'Presente' : 'Ausente'}
                                        </Badge>
                                      </Label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <EditMedium medium={medium} updateMedium={updateMedium} />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
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
                                                    <AlertDialogAction onClick={() => removeMedium(medium.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                        Excluir
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                             {mediums.length === 0 && (
                                <p className="text-sm text-muted-foreground italic text-center py-4">Nenhum médium cadastrado.</p>
                             )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-medium">
                    <AccordionTrigger className="text-xl font-bold font-headline">Adicionar Novo Médium</AccordionTrigger>
                    <AccordionContent>
                        <MediumRegistration addMedium={addMedium} onSuccess={onSuccess} />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="login-history">
                    <AccordionTrigger className="text-xl font-bold font-headline">Histórico de Acesso</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4">
                            <LoginHistory />
                             {user && user.email && ADMIN_EMAILS.includes(user.email) && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full">
                                            Limpar Histórico de Acesso
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação é irreversível e apagará TODO o histórico de acessos. Apenas administradores podem realizar esta ação.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleConfirmClearHistory} variant="destructive">
                                                Confirmar e Limpar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                             )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
            </div>
        </div>
    );
}
