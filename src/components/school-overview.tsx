"use client";

import type { Teacher } from '@/lib/types';
import { TeacherCard } from './teacher-card';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LogIn } from 'lucide-react';

interface SchoolOverviewProps {
  teachers: Teacher[];
  removeStudent: (teacherId: string, subjectId: string, studentId: string) => void;
  toggleTeacherPresence: (teacherId: string) => void;
  removeSubjectFromTeacher: (teacherId: string, subjectId: string) => void;
}

export function SchoolOverview({ teachers, removeStudent, toggleTeacherPresence, removeSubjectFromTeacher }: SchoolOverviewProps) {
  const presentTeachers = teachers.filter(t => t.isPresent);
  const absentTeachers = teachers.filter(t => !t.isPresent);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-headline mb-4">Professores Presentes</h2>
        {presentTeachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentTeachers.map(teacher => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                removeStudent={removeStudent}
                toggleTeacherPresence={toggleTeacherPresence}
                removeSubjectFromTeacher={removeSubjectFromTeacher}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum professor está marcado como presente no momento.</h3>
          </div>
        )}
      </div>

      {absentTeachers.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold font-headline mb-4">Professores Ausentes</h2>
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-2">
                {absentTeachers.map(teacher => (
                  <li key={teacher.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 group">
                    <span className="text-secondary-foreground">{teacher.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => toggleTeacherPresence(teacher.id)}>
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
