
"use client";

import { useLoginHistory } from "@/hooks/use-login-history";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


export function LoginHistory() {
  const { history, isLoading } = useLoginHistory();

  const formatDate = (timestamp: { seconds: number; nanoseconds: number; }) => {
    if (!timestamp) return 'Data indisponível';
    const date = new Date(timestamp.seconds * 1000);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  return (
    <ScrollArea className="h-60 border rounded-lg p-4">
        {isLoading ? (
        <div className="space-y-4 pr-4">
            {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            ))}
        </div>
        ) : (
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Data do Acesso</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {history.length > 0 ? (
                history.map((entry) => (
                <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell className="text-right">{formatDate(entry.timestamp)}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={2} className="text-center italic text-muted-foreground">
                    Nenhum registro de acesso encontrado.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        )}
    </ScrollArea>
  );
}
