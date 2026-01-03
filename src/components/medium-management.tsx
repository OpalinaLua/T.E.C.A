

"use client";

import { useState, useEffect } from 'react';
import type { Medium, Entity, Category, MediumRole } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { Pencil, Trash2, X, Plus, Cog, History, Users, Sparkles, BookUser, LogOut, ArrowUp, ArrowDown, Crown, Archive, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MediumRegistration } from './teacher-registration';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { LoginHistory } from './login-history';
import { CategorySelection } from './category-selection';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { SUPER_ADMINS, BOOTSTRAP_SUPER_ADMINS } from '@/lib/secrets';
import type { User } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLES } from '@/lib/types';
import { GiraHistory } from './gira-history';
import { PermissionsManagement } from './permissions-management';


interface MediumManagementProps {
  user: User;
  initialMediums: Medium[];
  initialSelectedCategories: Category[];
  spiritualCategories: Category[];
  addMedium: (name: string, entities: { name: string; limit: number; category: Category }[], role?: MediumRole) => Promise<void | undefined>;
  removeMedium: (mediumId: string) => void;
  clearLoginHistory: () => Promise<void>;
  addSpiritualCategory: (category: string) => Promise<void>;
  removeSpiritualCategory: (category: string) => Promise<void>;
  updateSpiritualCategoryOrder: (categories: Category[]) => Promise<void | undefined>;
  updateAllEntityLimits: (newLimit: number) => Promise<void>;
  updateSpiritualCategoryName: (oldName: string, newName: string) => Promise<void>;
  updateSelectedCategories: (categories: Category[]) => Promise<void>;
  archiveAndResetGira: () => Promise<void>;
  onSaveAndClose: (updatedMediums: Medium[], updatedCategories: Category[]) => Promise<void>;
  permissions: { admins: string[], superAdmins: string[] };
  addAdmin: (email: string) => Promise<void>;
  removeAdmin: (email: string) => Promise<void>;
  addSuperAdmin: (email: string) => Promise<void>;
  removeSuperAdmin: (email: string) => Promise<void>;
  deleteGiraHistoryEntry: (entryId: string) => Promise<void | undefined>;
  clearAllGiraHistory: () => Promise<void>;
}

function CategoryManagement({ spiritualCategories, addSpiritualCategory, removeSpiritualCategory, updateSpiritualCategoryName, onOrderChange }: { 
    spiritualCategories: Category[];
    addSpiritualCategory: (category: string) => Promise<void>;
    removeSpiritualCategory: (category: string) => Promise<void>;
    updateSpiritualCategoryName: (oldName: string, newName: string) => Promise<void>;
    onOrderChange: (categories: Category[]) => void;
}) {
    const { toast } = useToast();
    const [newCategory, setNewCategory] = useState('');
    const [orderedCategories, setOrderedCategories] = useState(spiritualCategories);
    const [editingCategory, setEditingCategory] = useState<{ oldName: string, newName: string } | null>(null);

    useEffect(() => {
        setOrderedCategories(spiritualCategories);
    }, [spiritualCategories]);

    const handleAddCategory = async () => {
        const trimmedCategory = newCategory.trim();
        if (trimmedCategory === '') {
            toast({ title: 'Erro', description: 'O nome da categoria não pode ser vazio.', variant: 'destructive' });
            return;
        }
        if (orderedCategories.includes(trimmedCategory)) {
            toast({ title: 'Erro', description: 'Essa categoria já existe.', variant: 'destructive' });
            return;
        }
        await addSpiritualCategory(trimmedCategory);
        setNewCategory('');
    };

    const handleRemoveCategory = async (category: string) => {
        await removeSpiritualCategory(category);
    };

    const handleUpdateCategoryName = async () => {
        if (!editingCategory) return;
        
        const { oldName, newName } = editingCategory;
        const trimmedNewName = newName.trim();

        if (trimmedNewName === '' || trimmedNewName === oldName) {
            setEditingCategory(null);
            return;
        }
        if (orderedCategories.includes(trimmedNewName)) {
            toast({ title: "Nome Duplicado", description: `A categoria "${trimmedNewName}" já existe.`, variant: "destructive" });
            return;
        }
        await updateSpiritualCategoryName(oldName, trimmedNewName);
        setEditingCategory(null);
    }

    const moveCategory = (index: number, direction: 'up' | 'down') => {
        const newCategories = [...orderedCategories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newCategories.length) return;

        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
        
        setOrderedCategories(newCategories);
        onOrderChange(newCategories); // Informa o pai sobre a mudança na ordem
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Adicionar Categoria</Label>
                <div className="flex gap-2">
                    <Input
                        placeholder="Nome da nova categoria"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCategory();
                            }
                        }}
                    />
                    <Button onClick={handleAddCategory}>Adicionar</Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Gerenciar Categorias</Label>
                <ScrollArea className="h-60 border rounded-lg p-2">
                    <div className="space-y-2">
                    {orderedCategories.map((cat, index) => (
                        <div key={cat} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveCategory(index, 'up')} disabled={index === 0}>
                                        <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveCategory(index, 'down')} disabled={index === orderedCategories.length - 1}>
                                        <ArrowDown className="h-3 w-3" />
                                    </Button>
                                </div>
                                <span className="font-medium">{cat}</span>
                            </div>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-7 w-7" onClick={() => setEditingCategory({ oldName: cat, newName: cat })}>
                                    <Pencil className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive h-7 w-7">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Remover a categoria "{cat}" também a removerá de todas as entidades associadas (serão movidas para "Sem Categoria"). Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleRemoveCategory(cat)} variant="destructive">
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                    {orderedCategories.length === 0 && <p className="text-sm text-center italic text-muted-foreground p-4">Nenhuma categoria cadastrada.</p>}
                    </div>
                </ScrollArea>
            </div>
             {editingCategory && (
                <AlertDialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Renomear Categoria</AlertDialogTitle>
                            <AlertDialogDescription>
                                Digite o novo nome para a categoria "{editingCategory.oldName}". Isso atualizará a categoria em todas as entidades associadas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input
                            value={editingCategory.newName}
                            onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleUpdateCategoryName();
                                }
                            }}
                            autoFocus
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setEditingCategory(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUpdateCategoryName}>Renomear</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}

function GlobalSettings({ updateAllEntityLimits }: { updateAllEntityLimits: (limit: number) => Promise<void> }) {
    const { toast } = useToast();
    const [newLimit, setNewLimit] = useState('');

    const handleUpdateAll = async () => {
        const limit = parseInt(newLimit, 10);
        if (isNaN(limit) || limit < 0) {
            toast({
                title: 'Valor Inválido',
                description: 'Por favor, insira um número válido igual ou maior que zero.',
                variant: 'destructive',
            });
            return;
        }
        await updateAllEntityLimits(limit);
        setNewLimit('');
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Alterar Limite de Atendimento Global</Label>
                 <p className="text-sm text-muted-foreground">
                    Altera o limite de vagas para <strong>todas</strong> as entidades de <strong>todos</strong> os médiuns de uma só vez. 
                    <br/><strong className="text-amber-500">Exceções:</strong> Médiuns com cargos (Pai de Santo, etc.) e entidades com limite 0 não são afetados.
                </p>
                <div className="flex gap-2">
                    <Input
                        type="number"
                        placeholder="Novo limite"
                        value={newLimit}
                        onChange={(e) => setNewLimit(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                // We need a confirmation dialog here, so just trigger button click
                            }
                        }}
                    />
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={newLimit.trim() === ''}>Aplicar a Todos</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Alteração Global?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Você tem certeza que deseja alterar o limite de atendimento para <strong>TODAS</strong> as entidades (com as exceções mencionadas) para <strong>{newLimit}</strong>? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUpdateAll}>
                                    Confirmar e Aplicar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
}

export function MediumManagement({ 
    user, 
    initialMediums, 
    initialSelectedCategories, 
    spiritualCategories, 
    addMedium, 
    removeMedium, 
    clearLoginHistory, 
    addSpiritualCategory, 
    removeSpiritualCategory, 
    updateSpiritualCategoryOrder, 
    updateAllEntityLimits, 
    updateSpiritualCategoryName, 
    updateSelectedCategories, 
    archiveAndResetGira, 
    onSaveAndClose,
    permissions,
    addAdmin,
    removeAdmin,
    addSuperAdmin,
    removeSuperAdmin,
    deleteGiraHistoryEntry,
    clearAllGiraHistory,
}: MediumManagementProps) {
    const { toast } = useToast();
    const isSuperAdmin = user && user.email && (BOOTSTRAP_SUPER_ADMINS.includes(user.email) || SUPER_ADMINS.includes(user.email) || permissions.superAdmins.includes(user.email));
    const [activeTab, setActiveTab] = useState("gira");
    
    // Estado local para gerenciar todas as alterações
    const [mediums, setMediums] = useState<Medium[]>(() => JSON.parse(JSON.stringify(initialMediums)));
    const [selectedCategories, setSelectedCategories] = useState<Category[]>(initialSelectedCategories);
    const [editingMediumId, setEditingMediumId] = useState<string | null>(null);
    const [pendingCategoryOrder, setPendingCategoryOrder] = useState<Category[] | null>(null);

    // Recarrega o estado local se os dados iniciais mudarem (ex: ao reabrir o modal)
    useEffect(() => {
        setMediums(JSON.parse(JSON.stringify(initialMediums)));
        setSelectedCategories(initialSelectedCategories);
    }, [initialMediums, initialSelectedCategories]);


    const handleMediumChange = (id: string, field: keyof Medium, value: any) => {
        setMediums(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };
    
    const handleEntityChange = (mediumId: string, entityId: string, field: keyof Entity, value: any) => {
        setMediums(prev => prev.map(medium => {
            if (medium.id !== mediumId) return medium;
            const newEntities = medium.entities.map(e => 
                e.id === entityId ? { ...e, [field]: value } : e
            );
            return { ...medium, entities: newEntities };
        }));
    };

    const handleAddEntity = (mediumId: string) => {
        setMediums(prev => prev.map(medium => {
            if (medium.id !== mediumId) return medium;

            const currentEntities = medium.entities;
            const newOrder = currentEntities.length > 0 ? Math.max(...currentEntities.map(e => e.order)) + 1 : 0;
            
            const newEntity: Entity = {
                id: `entity-${Date.now()}`,
                name: "Nova Entidade",
                category: spiritualCategories[0] || "Sem Categoria",
                consulentes: [],
                isAvailable: true,
                consulenteLimit: 5,
                order: newOrder,
            };

            return { ...medium, entities: [...currentEntities, newEntity] };
        }));
    };

    const handleRemoveEntity = (mediumId: string, entityId: string) => {
        const medium = mediums.find(m => m.id === mediumId);
        if (!medium) return;

        const entityToRemove = medium.entities.find(e => e.id === entityId);
        
        if (entityToRemove && entityToRemove.consulentes.length > 0) {
            toast({
                title: "Ação não permitida",
                description: `Não é possível remover la entidade "${entityToRemove.name}" pois ela possui consulentes agendados.`,
                variant: "destructive"
            });
            return;
        }

        setMediums(prev => prev.map(m => {
            if (m.id !== mediumId) return m;
            const newEntities = m.entities.filter(e => e.id !== entityId);
            return { ...medium, entities: newEntities };
        }));
    };

    const handleConfirmClearHistory = async () => {
        if (isSuperAdmin) {
            await clearLoginHistory();
        } else {
            toast({
                title: "Acesso Negado",
                description: "Você não tem permissão para executar esta ação. Apenas super administradores podem limpar o histórico.",
                variant: "destructive",
            });
        }
    };
    
    const handleCloseAndSaveChanges = async () => {
        if (pendingCategoryOrder) {
            await updateSpiritualCategoryOrder(pendingCategoryOrder);
        }
        await onSaveAndClose(mediums, selectedCategories);
    };

    const toggleEditing = (mediumId: string) => {
        setEditingMediumId(prevId => prevId === mediumId ? null : mediumId);
    }
    
    const handleCategorySelectionChange = (category: Category) => {
        const newSelected = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];
        
        setSelectedCategories(newSelected);
        updateSelectedCategories(newSelected);
    };
    
    const toggleMediumPresenceLocal = (mediumId: string) => {
        setMediums(prev => prev.map(m => {
            if (m.id !== mediumId) return m;
            
            const newIsPresent = !m.isPresent;
            // Se está marcando como ausente, limpa os consulentes
            const newEntities = !newIsPresent 
                ? m.entities.map(e => ({ ...e, consulentes: [] })) 
                : m.entities;
            
            return { ...m, isPresent: newIsPresent, entities: newEntities };
        }));
    };
    
    const moveMedium = (index: number, direction: 'up' | 'down') => {
        const newMediums = [...mediums];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newMediums.length) return;

        [newMediums[index], newMediums[targetIndex]] = [newMediums[targetIndex], newMediums[index]];
        
        setMediums(newMediums);
    };

    const MediumEditor = ({ medium }: { medium: Medium }) => {
        return (
             <AccordionContent className="bg-secondary/30 p-4 rounded-b-md">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor={`name-${medium.id}`}>Nome do Médium</Label>
                            <Input id={`name-${medium.id}`} value={medium.name} onChange={(e) => handleMediumChange(medium.id, 'name', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`role-${medium.id}`}>Cargo</Label>
                            <Select value={medium.role || ''} onValueChange={(v) => handleMediumChange(medium.id, 'role', v as MediumRole)}>
                                <SelectTrigger id={`role-${medium.id}`}>
                                    <SelectValue placeholder="Nenhum" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">Nenhum</SelectItem>
                                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                         <Label>Entidades</Label>
                        {medium.entities.map((entity) => (
                        <div key={entity.id} className="space-y-3 rounded-md border bg-background p-3 relative">
                            <div className="absolute top-1 right-1 flex items-center">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveEntity(medium.id, entity.id)} className="h-6 w-6 shrink-0 text-destructive/70 hover:text-destructive">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className='pr-12 space-y-1.5'>
                                <Label htmlFor={`entity-name-${entity.id}`}>Nome da Entidade</Label>
                                <Input id={`entity-name-${entity.id}`} value={entity.name} onChange={(e) => handleEntityChange(medium.id, entity.id, 'name', e.target.value)} />
                            </div>
                             <div className="flex flex-col sm:flex-row gap-2">
                                <div className="w-full space-y-1.5">
                                    <Label htmlFor={`entity-category-${entity.id}`}>Categoria</Label>
                                    <Select value={entity.category} onValueChange={(v) => handleEntityChange(medium.id, entity.id, 'category', v as Category)}>
                                        <SelectTrigger id={`entity-category-${entity.id}`}><SelectValue /></SelectTrigger>
                                        <SelectContent>{spiritualCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full space-y-1.5">
                                    <Label htmlFor={`entity-limit-${entity.id}`}>Limite</Label>
                                    <Input id={`entity-limit-${entity.id}`} type="number" value={entity.consulenteLimit} onChange={(e) => handleEntityChange(medium.id, entity.id, 'consulenteLimit', parseInt(e.target.value, 10) || 0)} />
                                </div>
                            </div>
                        </div>
                        ))}
                         <Button variant="outline" size="sm" onClick={() => handleAddEntity(medium.id)} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Entidade
                        </Button>
                    </div>
                </div>
            </AccordionContent>
        );
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={cn("grid w-full h-auto", isSuperAdmin ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4")}>
                        <TabsTrigger value="gira" className="flex-col sm:flex-row gap-2 py-2"><Sparkles />Gira</TabsTrigger>
                        <TabsTrigger value="mediums" className="flex-col sm:flex-row gap-2 py-2"><Users />Médiuns</TabsTrigger>
                        <TabsTrigger value="history" className="flex-col sm:flex-row gap-2 py-2"><History />Históricos</TabsTrigger>
                        <TabsTrigger value="register" className="flex-col sm:flex-row gap-2 py-2"><BookUser />Cadastrar</TabsTrigger>
                        {isSuperAdmin && (
                            <TabsTrigger value="advanced" className="flex-col sm:flex-row gap-2 py-2"><Cog />Avançado</TabsTrigger>
                        )}
                    </TabsList>
                    
                    <div className="pt-6">
                        <TabsContent value="gira">
                            <Card className="border-0 shadow-none">
                                <CardHeader className="p-0 pb-4">
                                    <CardTitle>Seleção da Gira</CardTitle>
                                    <CardDescription>Selecione as linhas de trabalho que estarão ativas hoje.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <CategorySelection
                                        spiritualCategories={spiritualCategories}
                                        selectedCategories={selectedCategories}
                                        onSelectionChange={handleCategorySelectionChange}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="mediums">
                        <Card className="border-0 shadow-none">
                                <CardHeader className="p-0 pb-4">
                                    <CardTitle>Médiuns Cadastrados</CardTitle>
                                    <CardDescription>Altere a presença, ordem ou edite os dados dos médiuns.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Accordion type="single" collapsible value={editingMediumId ?? undefined} onValueChange={(value) => setEditingMediumId(value || null)}>
                                        {mediums.map((medium, index) => (
                                            <AccordionItem value={medium.id} key={medium.id} className="border-b-0 mb-2 last:mb-0">
                                                <div className="flex items-center p-3 rounded-lg border bg-card transition-colors data-[state=open]:rounded-b-none">
                                                    <div className="flex flex-col">
                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveMedium(index, 'up')} disabled={index === 0}>
                                                            <ArrowUp className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveMedium(index, 'down')} disabled={index === mediums.length - 1}>
                                                            <ArrowDown className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-1 ml-2">
                                                        <Switch
                                                            id={`presence-${medium.id}`}
                                                            checked={medium.isPresent}
                                                            onCheckedChange={() => toggleMediumPresenceLocal(medium.id)}
                                                            aria-label={`Marcar presença para ${medium.name}`}
                                                        />
                                                        <div className="flex-1 text-left cursor-pointer p-0" onClick={() => toggleEditing(medium.id)}>
                                                            <Label htmlFor={`presence-${medium.id}`} className="font-medium cursor-pointer flex items-center gap-2 hover:underline">
                                                                {medium.name}
                                                                {medium.role && <Crown className="h-4 w-4 text-amber-500" />}
                                                            </Label>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 pl-2">
                                                        <Badge variant="outline" className={cn("text-xs py-0.5", medium.isPresent ? "text-green-600 border-green-600" : "text-red-600 border-red-600")}>
                                                            {medium.isPresent ? 'Presente' : 'Ausente'}
                                                        </Badge>
                                                        <AccordionTrigger className='p-2 hover:bg-accent rounded-md [&[data-state=open]>svg]:rotate-180'>
                                                            <Pencil className="h-4 w-4" />
                                                        </AccordionTrigger>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive">
                                                                    <Trash2 className="h-4 w-4" />
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
                                                <MediumEditor medium={medium} />
                                            </AccordionItem>
                                        ))}
                                        </Accordion>
                                        {mediums.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic text-center py-4">Nenhum médium cadastrado.</p>
                                        )}
                                </CardContent>
                        </Card>
                        </TabsContent>

                        <TabsContent value="history">
                            <Card className="border-0 shadow-none">
                                <CardHeader className="p-0 pb-4">
                                    <CardTitle>Arquivo de Giras</CardTitle>
                                    <CardDescription>Veja o histórico de giras passadas e arquive a sessão atual para limpar os registros.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 space-y-6">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                <Archive className="mr-2" /> Arquivar Gira Atual e Limpar Atendimentos
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar Arquivamento?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação irá salvar um resumo dos atendimentos da gira atual no histórico e, em seguida, <strong className="text-destructive">limpará TODOS os consulentes de TODOS os médiuns.</strong> 
                                                    <br/><br/>Use isso no final da gira para preparar o sistema para o próximo dia. Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={archiveAndResetGira}>
                                                    Confirmar e Arquivar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <GiraHistory isSuperAdmin={!!isSuperAdmin} deleteGiraHistoryEntry={deleteGiraHistoryEntry} />
                                    {isSuperAdmin && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="w-full">
                                                    <Trash2 className="mr-2" /> Limpar Todo o Histórico de Giras
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Excluir TODO o Histórico?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Você tem certeza que deseja apagar <strong className="text-destructive">TODOS</strong> os registros de giras arquivadas? Esta ação é irreversível e não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={clearAllGiraHistory} variant="destructive">
                                                        Sim, Excluir Tudo
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="register">
                            <MediumRegistration addMedium={addMedium} spiritualCategories={spiritualCategories} />
                        </TabsContent>

                        {isSuperAdmin && (
                            <TabsContent value="advanced">
                                <Accordion type="single" collapsible className="w-full" defaultValue="manage-permissions">
                                    <AccordionItem value="manage-permissions">
                                        <AccordionTrigger className="text-lg font-bold font-headline flex items-center gap-2"><ShieldAlert /> Gerenciar Permissões</AccordionTrigger>
                                        <AccordionContent>
                                            <PermissionsManagement
                                                currentUserEmail={user.email!}
                                                permissions={permissions}
                                                addAdmin={addAdmin}
                                                removeAdmin={removeAdmin}
                                                addSuperAdmin={addSuperAdmin}
                                                removeSuperAdmin={removeSuperAdmin}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="manage-limits">
                                        <AccordionTrigger className="text-lg font-bold font-headline">Gerenciamento Global</AccordionTrigger>
                                        <AccordionContent>
                                            <GlobalSettings updateAllEntityLimits={updateAllEntityLimits} />
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="manage-categories">
                                        <AccordionTrigger className="text-lg font-bold font-headline">Gerenciar Categorias da Gira</AccordionTrigger>
                                        <AccordionContent>
                                            <CategoryManagement 
                                                spiritualCategories={spiritualCategories} 
                                                addSpiritualCategory={addSpiritualCategory} 
                                                removeSpiritualCategory={removeSpiritualCategory} 
                                                updateSpiritualCategoryName={updateSpiritualCategoryName}
                                                onOrderChange={setPendingCategoryOrder}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="login-history">
                                        <AccordionTrigger className="text-lg font-bold font-headline">Histórico de Acesso</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-4">
                                                <LoginHistory />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" className="w-full">
                                                            <History className="mr-2" />
                                                            Limpar Histórico de Acesso
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta ação é irreversível e apagará TODO o histórico de acessos. Apenas super administradores podem realizar esta ação.
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
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </TabsContent>
                        )}
                    </div>
                </Tabs>
            </div>
            <div className="flex-shrink-0 px-6 py-4 border-t bg-background">
                <Button onClick={handleCloseAndSaveChanges} variant="outline" className="w-full">
                    <LogOut className="mr-2"/>
                    Fechar e Salvar
                </Button>
            </div>
        </div>
    );
}
