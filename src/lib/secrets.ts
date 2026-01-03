
/**
 * @fileoverview Armazena segredos e chaves da aplicação.
 * ATENÇÃO: Estes valores são incluídos no código final enviado ao navegador.
 * A lista de administradores e super administradores agora é gerenciada no banco de dados.
 * Este arquivo mantém apenas o e-mail de "bootstrap" para recuperação.
 */

// Lista de e-mails com permissão de administrador geral (acesso ao painel).
// **DEPRECADO**: A lista de administradores agora é gerenciada no painel de controle.
export const ADMIN_EMAILS: string[] = [];

// E-mail de "bootstrap" que SEMPRE terá permissão de super administrador.
// Use para recuperar o acesso caso o documento de permissões seja corrompido ou excluído.
export const BOOTSTRAP_SUPER_ADMINS = [
    "luamdarabello@gmail.com",
];

// **DEPRECADO**: A lista de super administradores agora é gerenciada no painel de controle.
// A verificação agora usa `BOOTSTRAP_SUPER_ADMINS` e a lista do Firestore.
export const SUPER_ADMINS: string[] = [];
