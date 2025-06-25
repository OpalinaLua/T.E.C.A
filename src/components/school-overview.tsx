"use client";

import type { Medium } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { LogIn, UserX, Eye, EyeOff, LogOut, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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

// --- Component: MediumCard ---
interface MediumCardProps {
  medium: Medium;
  removeMedium: (mediumId: string) => void;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
}

function MediumCard({ medium, removeMedium, removeConsulente, toggleMediumPresence, toggleEntityAvailability }: MediumCardProps) {
  const { toast } = useToast();

  const handleRemoveMedium = () => {
    removeMedium(medium.id);
    toast({
        title: "Médium Removido",
        description: `O médium ${medium.name} foi removido com sucesso.`,
    })
  };

  const handleRemoveConsulente = (entityId: string, consulenteId: string, consulenteName: string) => {
    removeConsulente(medium.id, entityId, consulenteId);
    toast({
        title: "Consulente Removido",
        description: `${consulenteName} foi removido(a).`,
    })
  };

  const handleToggleAvailability = (entityId: string, entityName: string, isAvailable: boolean) => {
    toggleEntityAvailability(medium.id, entityId);
    toast({
        title: "Disponibilidade Alterada",
        description: `A entidade ${entityName} foi marcada como ${!isAvailable ? 'disponível' : 'indisponível'}.`,
    })
  };

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
        <div className="flex items-center">
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
      <CardContent className="flex-grow space-y-4">
        {medium.entities && medium.entities.map((entity, index) => (
          <div key={entity.id} className={cn(!entity.isAvailable && "opacity-60")}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex justify-between items-center mb-2">
              <h3 className={cn("font-semibold text-lg", !entity.isAvailable && "line-through")}>{entity.name}</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    {entity.isAvailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">Alterar Disponibilidade da Entidade</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alterar Disponibilidade?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso marcará a entidade "{entity.name}" como {entity.isAvailable ? 'indisponível' : 'disponível'}. Os consulentes permanecerão agendados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleToggleAvailability(entity.id, entity.name, entity.isAvailable)}>
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
                          <AlertDialogAction onClick={() => handleRemoveConsulente(entity.id, consulente.id, consulente.name)} className="bg-destructive text-destructive-foreground">
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


// --- Component: SchoolOverview ---
interface SchoolOverviewProps {
  mediums: Medium[];
  removeMedium: (mediumId: string) => void;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
}

export function SchoolOverview({ mediums, removeMedium, removeConsulente, toggleMediumPresence, toggleEntityAvailability }: SchoolOverviewProps) {
  const presentMediums = mediums.filter(m => m.isPresent);
  const absentMediums = mediums.filter(m => !m.isPresent);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-headline mb-4">Médiuns Presentes</h2>
        {presentMediums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentMediums.map(medium => (
              <MediumCard
                key={medium.id}
                medium={medium}
                removeMedium={removeMedium}
                removeConsulente={removeConsulente}
                toggleMediumPresence={toggleMediumPresence}
                toggleEntityAvailability={toggleEntityAvailability}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum médium está marcado como presente no momento.</h3>
          </div>
        )}
      </div>

      {absentMediums.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold font-headline mb-4">Médiuns Ausentes</h2>
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {absentMediums.map(medium => (
                  <li key={medium.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 group">
                    <span className="text-secondary-foreground">{medium.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => toggleMediumPresence(medium.id)}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Marcar como Presente
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
