
"use client";

import { useState, useMemo } from 'react';
import type { Medium, Consulente, Entity } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { UserRound } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface ConsulenteHistoryListProps {
    mediums: Medium[];
}

interface AttendanceRecord {
    consulenteName: string;
    entityName: string;
    entityCategory: string;
    status: Consulente['status'];
}

export function ConsulenteHistoryList({ mediums }: ConsulenteHistoryListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const mediumsWithAttendance = useMemo(() => {
        return mediums
            .map(medium => {
                const attendance: AttendanceRecord[] = [];
                medium.entities.forEach(entity => {
                    entity.consulentes.forEach(consulente => {
                        attendance.push({
                            consulenteName: consulente.name,
                            entityName: entity.name,
                            entityCategory: entity.category,
                            status: consulente.status
                        });
                    });
                });
                return { ...medium, attendance };
            })
            .filter(m => m.attendance.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [mediums]);

    const filteredMediums = useMemo(() => {
        if (!searchQuery.trim()) {
            return mediumsWithAttendance;
        }
        const query = searchQuery.toLowerCase().trim();
        return mediumsWithAttendance
            .map(medium => {
                const filteredAttendance = medium.attendance.filter(record =>
                    record.consulenteName.toLowerCase().includes(query)
                );
                return { ...medium, attendance: filteredAttendance };
            })
            .filter(m => m.attendance.length > 0);
    }, [mediumsWithAttendance, searchQuery]);
    
    const getStatusBadgeVariant = (status: Consulente['status']) => {
        switch (status) {
            case 'atendido': return 'default';
            case 'ausente': return 'destructive';
            default: return 'secondary';
        }
    };
    
    const getStatusLabel = (status: Consulente['status']) => {
        switch (status) {
            case 'atendido': return 'Atendido';
            case 'ausente': return 'Ausente';
            default: return 'Agendado';
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome do consulente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                />
            </div>
            <ScrollArea className="h-96">
                 {filteredMediums.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {filteredMediums.map(medium => (
                            <AccordionItem value={medium.id} key={medium.id}>
                                <AccordionTrigger>{medium.name}</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-3 pl-2">
                                        {medium.attendance.map((record, i) => (
                                             <li key={i} className="text-sm border-l-2 pl-4 space-y-1">
                                                <p><span className="font-semibold">Consulente:</span> {record.consulenteName}</p>
                                                <p><span className="font-semibold">Entidade:</span> {record.entityName} ({record.entityCategory})</p>
                                                <Badge variant={getStatusBadgeVariant(record.status)}>{getStatusLabel(record.status)}</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-6">
                        {searchQuery ? `Nenhum atendimento encontrado para "${searchQuery}".` : "Nenhum atendimento registrado para a gira atual."}
                    </p>
                )}
            </ScrollArea>
        </div>
    );
}
