"use client";

import type { Medium } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "./ui/scroll-area";

interface MediumPresenceProps {
  mediums: Medium[];
  toggleMediumPresence: (mediumId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function MediumPresence({ mediums, toggleMediumPresence, nextStep, prevStep }: MediumPresenceProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Passo 2: Controle de Presença</CardTitle>
          <CardDescription className="text-lg">Marque os médiuns que estão presentes para o trabalho de hoje.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4 pr-6">
              {mediums.map(medium => (
                <div key={medium.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/50 transition-colors">
                  <Label htmlFor={`presence-${medium.id}`} className="text-lg font-medium cursor-pointer">
                    {medium.name}
                  </Label>
                  <Switch
                    id={`presence-${medium.id}`}
                    checked={medium.isPresent}
                    onCheckedChange={() => toggleMediumPresence(medium.id)}
                    aria-label={`Marcar presença para ${medium.name}`}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>
            Voltar (Passo 1)
          </Button>
          <Button onClick={nextStep}>
            Avançar (Passo 3)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}