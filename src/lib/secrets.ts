
/**
 * @fileoverview Armazena segredos e chaves da aplicação.
 * ATENÇÃO: Estes valores são incluídos no código final enviado ao navegador.
 * A lista de administradores e super administradores agora é gerenciada no banco de dados.
 * Este arquivo mantém o e-mail de "bootstrap" para recuperação e os valores legados para migração.
 */

// Lista de e-mails com permissão de administrador geral (acesso ao painel).
// **DEPRECADO**: Usado apenas para a migração inicial para o Firestore.
export const ADMIN_EMAILS: string[] = [
    "contato@casa-das-almas.com",
    "amandrabello@gmail.com",
    "paola.f.mesquita@gmail.com"
];

// E-mail de "bootstrap" que SEMPRE terá permissão de super administrador.
// Use para recuperar o acesso caso o documento de permissões seja corrompido ou excluído.
export const BOOTSTRAP_SUPER_ADMINS = [
    "luamdarabello@gmail.com",
];

// **DEPRECADO**: Usado apenas para a migração inicial para o Firestore.
export const SUPER_ADMINS: string[] = [
    "marcelobellodev@gmail.com"
];

    