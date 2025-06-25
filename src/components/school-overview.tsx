"use client";

import type { Medium } from '@/lib/types';
import { MediumCard } from './teacher-card';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LogIn } from 'lucide-react';

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
