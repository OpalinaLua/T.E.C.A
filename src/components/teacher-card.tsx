"use client";

import type { Teacher } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { UserX, Eye, EyeOff, LogOut, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TeacherCardProps {
  teacher: Teacher;
  removeStudent: (teacherId: string, subjectId: string, studentId: string) => void;
  toggleTeacherPresence: (teacherId: string) => void;
  toggleSubjectAvailability: (teacherId: string, subjectId: string) => void;
}

export function TeacherCard({ teacher, removeStudent, toggleTeacherPresence, toggleSubjectAvailability }: TeacherCardProps) {
  const { toast } = useToast();

  const handleRemoveStudent = (subjectId: string, studentId: string, studentName: string) => {
    removeStudent(teacher.id, subjectId, studentId);
    toast({
        title: "Aluno Removido",
        description: `${studentName} foi removido(a).`,
    })
  };

  const handleToggleAvailability = (subjectId: string, subjectName: string, isAvailable: boolean) => {
    toggleSubjectAvailability(teacher.id, subjectId);
    toast({
        title: "Disponibilidade Alterada",
        description: `A matéria ${subjectName} foi marcada como ${!isAvailable ? 'disponível' : 'indisponível'}.`,
    })
  };

  return (
    <Card className="flex flex-col h-full transition-all duration-300 ease-in-out">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="font-headline text-2xl">{teacher.name}</CardTitle>
          <CardDescription>
            <Badge variant="outline" className={teacher.isPresent ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}>
              {teacher.isPresent ? 'Presente' : 'Ausente'}
            </Badge>
          </CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              {teacher.isPresent ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              <span className="sr-only">Alternar Presença</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso marcará o(a) professor(a) como {teacher.isPresent ? 'ausente' : 'presente'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => toggleTeacherPresence(teacher.id)}>
                Continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {teacher.subjects.map((subject, index) => (
          <div key={subject.id} className={cn(!subject.isAvailable && "opacity-60")}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex justify-between items-center mb-2">
              <h3 className={cn("font-semibold text-lg", !subject.isAvailable && "line-through")}>{subject.name}</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    {subject.isAvailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">Alterar Disponibilidade da Matéria</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alterar Disponibilidade?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso marcará a matéria "{subject.name}" como {subject.isAvailable ? 'indisponível' : 'disponível'}. Os alunos permanecerão matriculados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleToggleAvailability(subject.id, subject.name, subject.isAvailable)}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {subject.students.length > 0 ? (
              <ul className="space-y-2">
                {subject.students.map(student => (
                  <li key={student.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 group">
                    <span className="text-secondary-foreground">{student.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" disabled={!subject.isAvailable}>
                            <UserX className="h-4 w-4" />
                            <span className="sr-only">Excluir aluno</span>
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Aluno?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza de que deseja remover {student.name} desta turma?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveStudent(subject.id, student.id, student.name)} className="bg-destructive text-destructive-foreground">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum aluno matriculado.</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
