"use client";

import { useGiraHistory } from "@/hooks/use-gira-history";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

export function GiraHistory() {
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
                    <Card key={entry.id} className="bg-card">
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
