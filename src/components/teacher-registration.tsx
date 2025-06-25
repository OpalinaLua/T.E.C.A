"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeacherRegistrationProps {
  addTeacher: (name: string, subjects: string[]) => void;
}

export function TeacherRegistration({ addTeacher }: TeacherRegistrationProps) {
  const [name, setName] = useState('');
  const [currentSubject, setCurrentSubject] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAddSubject = () => {
    if (currentSubject.trim() && !subjects.includes(currentSubject.trim())) {
      setSubjects([...subjects, currentSubject.trim()]);
      setCurrentSubject('');
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setSubjects(subjects.filter(s => s !== subjectToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && subjects.length > 0) {
      addTeacher(name.trim(), subjects);
      setName('');
      setSubjects([]);
      setCurrentSubject('');
      toast({
        title: "Sucesso",
        description: `Professor(a) ${name.trim()} foi cadastrado(a).`,
      });
    } else {
        toast({
            title: "Erro",
            description: "Por favor, forneça um nome para o professor e pelo menos uma matéria.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastro de Professor</CardTitle>
        <CardDescription>Adicione um novo professor e suas matérias ao sistema.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="teacher-name" className="text-sm font-medium">Nome do Professor</label>
            <Input
              id="teacher-name"
              placeholder="ex: Prof. João"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="subject-name" className="text-sm font-medium">Matérias</label>
            <div className="flex gap-2">
              <Input
                id="subject-name"
                placeholder="ex: Matemática"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                    }
                }}
              />
              <Button type="button" onClick={handleAddSubject} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Adicionar Matéria</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {subject}
                <button type="button" onClick={() => handleRemoveSubject(subject)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remover {subject}</span>
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Cadastrar Professor</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
