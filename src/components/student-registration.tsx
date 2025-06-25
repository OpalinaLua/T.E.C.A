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
        title: "Success",
        description: `Student ${name.trim()} has been registered.`,
      });
    } else {
        toast({
            title: "Error",
            description: "Please fill out all fields to register a student.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Student Registration</CardTitle>
        <CardDescription>Enroll a student with an available teacher and subject.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="student-name" className="text-sm font-medium">Student Name</label>
            <Input
              id="student-name"
              placeholder="e.g., Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Teacher</label>
            <Select onValueChange={handleTeacherChange} value={selectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId} disabled={!selectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
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
            {availableTeachers.length > 0 ? 'Enroll Student' : 'No Teachers Available'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
