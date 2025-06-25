"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Teacher, Subject, Student } from '@/lib/types';

const SCHOOL_DATA_KEY = 'schoolSyncData';

export function useSchoolData() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(SCHOOL_DATA_KEY);
      if (item) {
        setTeachers(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${SCHOOL_DATA_KEY}”:`, error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem(SCHOOL_DATA_KEY, JSON.stringify(teachers));
      } catch (error) {
        console.warn(`Error setting localStorage key “${SCHOOL_DATA_KEY}”:`, error);
      }
    }
  }, [teachers, isLoaded]);

  const addTeacher = useCallback((name: string, subjects: string[]) => {
    const newTeacher: Teacher = {
      id: `teacher-${Date.now()}`,
      name,
      isPresent: true,
      subjects: subjects.map((sub, index) => ({
        id: `subject-${Date.now()}-${index}`,
        name: sub,
        students: [],
      })),
    };
    setTeachers(prev => [...prev, newTeacher]);
  }, []);

  const addStudent = useCallback((studentName: string, teacherId: string, subjectId: string) => {
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      name: studentName,
    };
    setTeachers(prev =>
      prev.map(teacher => {
        if (teacher.id === teacherId) {
          return {
            ...teacher,
            subjects: teacher.subjects.map(subject => {
              if (subject.id === subjectId) {
                return {
                  ...subject,
                  students: [...subject.students, newStudent],
                };
              }
              return subject;
            }),
          };
        }
        return teacher;
      })
    );
  }, []);

  const removeStudent = useCallback((teacherId: string, subjectId: string, studentId: string) => {
    setTeachers(prev =>
      prev.map(teacher => {
        if (teacher.id === teacherId) {
          return {
            ...teacher,
            subjects: teacher.subjects.map(subject => {
              if (subject.id === subjectId) {
                return {
                  ...subject,
                  students: subject.students.filter(s => s.id !== studentId),
                };
              }
              return subject;
            }),
          };
        }
        return teacher;
      })
    );
  }, []);
  
  const toggleTeacherPresence = useCallback((teacherId: string) => {
    setTeachers(prev =>
      prev.map(teacher =>
        teacher.id === teacherId ? { ...teacher, isPresent: !teacher.isPresent } : teacher
      )
    );
  }, []);

  const removeSubjectFromTeacher = useCallback((teacherId: string, subjectId: string) => {
    setTeachers(prev =>
      prev.map(teacher => {
        if (teacher.id === teacherId) {
          return {
            ...teacher,
            subjects: teacher.subjects.filter(s => s.id !== subjectId),
          };
        }
        return teacher;
      }).filter(teacher => teacher.subjects.length > 0)
    );
  }, []);

  return {
    teachers,
    isLoaded,
    addTeacher,
    addStudent,
    removeStudent,
    toggleTeacherPresence,
    removeSubjectFromTeacher,
  };
}
