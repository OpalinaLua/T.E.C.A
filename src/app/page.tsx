"use client";

import { useSchoolData } from '@/hooks/use-school-data';
import { TeacherRegistration } from '@/components/teacher-registration';
import { StudentRegistration } from '@/components/student-registration';
import { SchoolOverview } from '@/components/school-overview';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const {
    teachers,
    isLoaded,
    addTeacher,
    addStudent,
    removeStudent,
    toggleTeacherPresence,
    removeSubjectFromTeacher,
  } = useSchoolData();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-16 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-12 w-1/4 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-5xl font-bold font-headline text-primary">
            SchoolSync
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            A simple way to manage school attendance.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <aside className="lg:col-span-1 space-y-8 lg:sticky lg:top-8">
            <TeacherRegistration addTeacher={addTeacher} />
            <StudentRegistration teachers={teachers} addStudent={addStudent} />
          </aside>
          
          <div className="lg:col-span-2">
            <SchoolOverview
              teachers={teachers}
              removeStudent={removeStudent}
              toggleTeacherPresence={toggleTeacherPresence}
              removeSubjectFromTeacher={removeSubjectFromTeacher}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
