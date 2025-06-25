"use client";

import { useState, useMemo } from 'react';
import type { Teacher } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

interface StudentRegistrationProps {
  teachers: Teacher[];
  addStudent: (studentName: string, teacherId: string, subjectId: string) => void;
}

export function StudentRegistration({ teachers, addStudent }: StudentRegistrationProps) {
  const [name, setName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const { toast } = useToast();

  const availableTeachers = useMemo(() => teachers.filter(t => t.isPresent && t.subjects.length > 0), [teachers]);
  
  const availableSubjects = useMemo(() => {
    const teacher = availableTeachers.find(t => t.id === selectedTeacherId);
    return teacher ? teacher.subjects : [];
  }, [availableTeachers, selectedTeacherId]);

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setSelectedSubjectId('');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedTeacherId && selectedSubjectId) {
      addStudent(name.trim(), selectedTeacherId, selectedSubjectId);
      setName('');
      setSelectedTeacherId('');
      setSelectedSubjectId('');
      toast({
        title: "Sucesso",
        description: `Aluno(a) ${name.trim()} foi matriculado(a).`,
      });
    } else {
        toast({
            title: "Erro",
            description: "Por favor, preencha todos os campos para matricular um aluno.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Matrícula de Aluno</CardTitle>
        <CardDescription>Matricule um aluno com um professor e matéria disponíveis.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="student-name" className="text-sm font-medium">Nome do Aluno</label>
            <Input
              id="student-name"
              placeholder="ex: Maria da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Professor(a)</label>
            <Select onValueChange={handleTeacherChange} value={selectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um(a) professor(a)" />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Matéria</label>
            <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId} disabled={!selectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma matéria" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={availableTeachers.length === 0}>
            {availableTeachers.length > 0 ? 'Matricular Aluno' : 'Nenhum Professor Disponível'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
