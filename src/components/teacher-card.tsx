"use client";

import type { Medium } from '@/lib/types';
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
import { UserX, Eye, EyeOff, LogOut, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MediumCardProps {
  medium: Medium;
  removeConsulente: (mediumId: string, entityId: string, consulenteId: string) => void;
  toggleMediumPresence: (mediumId: string) => void;
  toggleEntityAvailability: (mediumId: string, entityId: string) => void;
}

export function MediumCard({ medium, removeConsulente, toggleMediumPresence, toggleEntityAvailability }: MediumCardProps) {
  const { toast } = useToast();

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
