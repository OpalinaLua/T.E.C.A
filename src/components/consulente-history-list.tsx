
"use client";

import { useState, useMemo } from 'react';
import type { Medium, Consulente } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from './ui/scroll-area';

interface ConsulenteHistoryListProps {
    mediums: Medium[];
}

export function ConsulenteHistoryList({ mediums }: ConsulenteHistoryListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const consulentesWithHistory = useMemo(() => {
        const allConsulentes: Consulente[] = [];
        const seenNames = new Set<string>();

        // Percorre todos os médiuns e entidades para coletar consulentes com histórico
        mediums.forEach(medium => {
            medium.entities.forEach(entity => {
                entity.consulentes.forEach(consulente => {
                    // Adiciona apenas se tiver histórico e se o nome não tiver sido visto ainda
                    if (consulente.history && consulente.history.length > 0 && !seenNames.has(consulente.name.toLowerCase())) {
                        allConsulentes.push(consulente);
                        seenNames.add(consulente.name.toLowerCase());
                    }
                });
            });
        });
        
        // Ordena por nome
        allConsulentes.sort((a, b) => a.name.localeCompare(b.name));
        
        return allConsulentes;

    }, [mediums]);

    const filteredConsulentes = useMemo(() => {
        if (!searchQuery.trim()) {
            return consulentesWithHistory;
        }
        const query = searchQuery.toLowerCase().trim();
        return consulentesWithHistory.filter(c => c.name.toLowerCase().includes(query));
    }, [consulentesWithHistory, searchQuery]);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar consulente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                />
            </div>
            <ScrollArea className="h-96">
                 {filteredConsulentes.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {filteredConsulentes.map(consulente => (
                            <AccordionItem value={consulente.id} key={consulente.id}>
                                <AccordionTrigger>{consulente.name}</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-3 pl-2">
                                        {consulente.history!.map((h, i) => (
                                             <li key={i} className="text-sm border-l-2 pl-4">
                                                <p><span className="font-semibold">Data:</span> {format(new Date(h.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                                <p><span className="font-semibold">Entidade:</span> {h.entityName}</p>
                                                <p><span className="font-semibold">Linhas:</span> {h.categories.join(', ')}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-6">
                        {searchQuery ? `Nenhum consulente encontrado para "${searchQuery}".` : "Nenhum consulente com histórico encontrado."}
                    </p>
                )}
            </ScrollArea>
        </div>
    );
}

    