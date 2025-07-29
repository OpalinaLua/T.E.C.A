"use client";

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/secrets';

interface LoginClientProps {
  onLoginSuccess: (user: User) => void;
  showDisclaimer?: boolean;
}

export function LoginClient({ onLoginSuccess, showDisclaimer }: LoginClientProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        onLoginSuccess(user);
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo(a), ${user.displayName || user.email}!`,
        });
      } else {
        await auth.signOut();
        toast({
          title: "Acesso Negado",
          description: "Este e-mail não tem permissão para acessar o painel.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Erro no login com Google:", error);
        toast({
          title: "Erro de Autenticação",
          description: "Não foi possível completar o login. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 h-full">
      {showDisclaimer && (
         <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso Negado</AlertTitle>
            <AlertDescription>
                O e-mail com o qual você está autenticado não tem permissão para acessar esta área. Por favor, tente com outra conta.
            </AlertDescription>
         </Alert>
      )}
      <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full max-w-xs">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7C337 97.4 297.9 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 431 248 431c97.2 0 130.2-72.2 132.9-110.5H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.6z"></path></svg>
        )}
        {isLoading ? 'Aguarde...' : 'Login com Google'}
      </Button>
    </div>
  );
}
