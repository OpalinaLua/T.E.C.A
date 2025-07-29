
"use client";

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/secrets';
import { useSchoolData } from '@/hooks/use-school-data'; // Importar para usar a função de log

export function LoginClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const { logLoginEvent } = useSchoolData(); // Obter a função de log

  // Efeito para verificar o resultado do redirecionamento quando a página carrega
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // Usuário foi redirecionado de volta do Google
          const user = result.user;
          if (user.email && ADMIN_EMAILS.includes(user.email)) {
            // Se for admin, registra o login e redireciona para a página principal
            // com um parâmetro para abrir o painel
            await logLoginEvent(user.email);
            router.push('/?openManagement=true');
          } else {
            // Se não for admin, desloga e mostra erro
            await auth.signOut();
            toast({
              title: "Acesso Negado",
              description: "Este e-mail não tem permissão para acessar a área de gerenciamento.",
              variant: "destructive",
            });
            setIsLoading(false); // Permite que o botão de login apareça novamente
          }
        } else {
          // Não há resultado de redirecionamento, então apenas para de carregar
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Erro no redirecionamento de login:", error);
        toast({
          title: "Erro de Autenticação",
          description: "Ocorreu um erro durante o processo de login. Tente novamente.",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, [router, toast, logLoginEvent]);

  // Função para iniciar o fluxo de login
  const handleGoogleLogin = () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider); // Inicia o redirecionamento
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary">
        <Loader2 className="h-16 w-16 animate-spin mb-4" />
        <h1 className="text-2xl font-bold font-headline">Verificando autenticação...</h1>
        <p className="text-muted-foreground mt-2">Aguarde, estamos te redirecionando.</p>
      </div>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold font-headline text-primary mb-2">T.E.C.A</h1>
        <p className="text-muted-foreground mb-6">Acesse o painel de gerenciamento.</p>
        <Button onClick={handleGoogleLogin} className="w-full">
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7C337 97.4 297.9 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 431 248 431c97.2 0 130.2-72.2 132.9-110.5H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.6z"></path></svg>
          Login com Google
        </Button>
      </div>
    </main>
  );
}
