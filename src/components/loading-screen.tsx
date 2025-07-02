import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary">
      <Loader2 className="h-16 w-16 animate-spin mb-4" />
      <h1 className="text-2xl font-bold font-headline">Carregando Dados...</h1>
      <p className="text-muted-foreground mt-2">Por favor, aguarde enquanto preparamos tudo para você.</p>
    </div>
  );
}
