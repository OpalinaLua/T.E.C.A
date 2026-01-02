
"use client";

import { useMemo } from 'react';
import type { Medium } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';

interface ConsulenteHistoryListProps {
    mediums: Medium[];
}

interface AttendanceSummary {
    entityName: string;
    entityCategory: string;
    attendedCount: number;
}

export function ConsulenteHistoryList({ mediums }: ConsulenteHistoryListProps) {

    const { mediumsWithAttendance, totalAttended } = useMemo(() => {
        let totalAttended = 0;
        const mediumsWithAttendance = mediums
            .map(medium => {
                const attendance: AttendanceSummary[] = [];
                medium.entities.forEach(entity => {
                    // Conta apenas consulentes marcados como 'atendido'
                    const attendedCount = entity.consulentes.filter(c => c.status === 'atendido').length;
                    if (attendedCount > 0) {
                        attendance.push({
                            entityName: entity.name,
                            entityCategory: entity.category,
                            attendedCount: attendedCount,
                        });
                        totalAttended += attendedCount;
                    }
                });
                return { ...medium, attendance };
            })
            .filter(m => m.attendance.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));
        
        return { mediumsWithAttendance, totalAttended };
    }, [mediums]);


    return (
        <div className="space-y-4">
            <ScrollArea className="h-96">
                 {mediumsWithAttendance.length > 0 ? (
                    <Accordion type="multiple" className="w-full space-y-2">
                        {mediumsWithAttendance.map(medium => (
                            <AccordionItem value={medium.id} key={medium.id} className="border rounded-lg bg-card">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <span className="font-medium">{medium.name}</span>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-3">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Entidade</TableHead>
                                                <TableHead className="text-right">Atendidos</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {medium.attendance.map((record, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <div className="font-medium">{record.entityName}</div>
                                                        <div className="text-xs text-muted-foreground">{record.entityCategory}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-lg">{record.attendedCount}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-6">
                        Nenhum atendimento com status "atendido" foi registrado para a gira atual.
                    </p>
                )}
            </ScrollArea>
             {totalAttended > 0 && (
                <div className="pt-4">
                    <Separator />
                    <div className="flex justify-between items-center mt-4 px-2">
                        <span className="text-lg font-bold">Total da Gira:</span>
                        <span className="text-2xl font-extrabold text-primary">{totalAttended}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

