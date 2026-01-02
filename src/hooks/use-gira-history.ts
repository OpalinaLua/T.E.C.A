"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from './use-toast';

export interface GiraHistoryEntry {
  id: string;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  summary: {
    mediumName: string;
    attendedCount: number;
  }[];
  totalAttended: number;
}

export function useGiraHistory() {
  const [history, setHistory] = useState<GiraHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      console.error("Firebase db is not available.");
      setIsLoading(false);
      return;
    }

    const historyCollection = collection(db, 'giraHistory');
    const q = query(historyCollection, orderBy('date', 'desc'), limit(50)); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GiraHistoryEntry[];
      setHistory(historyData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase connection error (giraHistory):", error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar o histórico de giras.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  return { history, isLoading };
}
