export interface Student {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  students: Student[];
  isAvailable: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  subjects: Subject[];
  isPresent: boolean;
}
