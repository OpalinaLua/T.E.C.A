"use client";

import { useGiraHistory } from "@/hooks/use-gira-history";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Trash2 } from "lucide-react";
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

interface GiraHistoryProps {
  isSuperAdmin: boolean;
  deleteGiraHistoryEntry: (entryId: string) => Promise<void>;
}

export function GiraHistory({ isSuperAdmin, deleteGiraHistoryEntry }: GiraHistoryProps) {
  const { history, isLoading } = useGiraHistory();

  const formatDate = (timestamp: { seconds: number; nanoseconds: number; }) => {
    if (!timestamp) return 'Data indisponível';
    const date = new Date(timestamp.seconds * 1000);
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Histórico de Giras Arquivadas</h3>
      <ScrollArea className="h-96 border rounded-lg">
        <div className="p-4 space-y-4">
            {isLoading ? (
                <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </>
            ) : history.length > 0 ? (
                history.map(entry => (
                    <Card key={entry.id} className="bg-card relative group">
                        {isSuperAdmin && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação removerá permanentemente o registro da gira de <strong>{formatDate(entry.date)}</strong>. Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteGiraHistoryEntry(entry.id)} variant="destructive">
                                            Excluir Registro
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{formatDate(entry.date)}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <ul className="space-y-1">
                                {entry.summary.map((item, index) => (
                                    <li key={index} className="flex justify-between">
                                        <span>{item.mediumName}</span>
                                        <span className="font-mono">{item.attendedCount} {item.attendedCount === 1 ? 'consulente' : 'consulentes'}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-2 mt-2 border-t">
                            <div className="flex justify-between w-full font-bold">
                                <span>Total da Gira</span>
                                <span>{entry.totalAttended}</span>
                            </div>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <p className="text-sm text-muted-foreground italic text-center py-10">
                    Nenhuma gira foi arquivada ainda.
                </p>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
