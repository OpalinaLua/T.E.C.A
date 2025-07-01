"use client";

import { useState, useEffect } from 'react';
import type { LoginEntry } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from './use-toast';

export function useLoginHistory() {
  const [history, setHistory] = useState<LoginEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      console.error("Firebase db is not available.");
      setIsLoading(false);
      return;
    }

    const historyCollection = collection(db, 'loginHistory');
    const q = query(historyCollection, orderBy('timestamp', 'desc'), limit(20)); // Get last 20 logins

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LoginEntry[];
      setHistory(historyData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase connection error (loginHistory):", error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível carregar o histórico de acessos.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  return { history, isLoading };
}
