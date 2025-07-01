
/**
 * @fileoverview Armazena segredos e chaves da aplicação.
 * ATENÇÃO: Estes valores são incluídos no código final enviado ao navegador.
 * Para adicionar mais administradores, basta adicionar os e-mails deles à lista ADMIN_EMAILS.
 */

// Lista de e-mails com permissão de administrador geral (acesso ao painel).
export const ADMIN_EMAILS = [
    "luamdarabello@gmail.com",
    "castilholuisfelipi@gmail.com",
    // "outro.admin@email.com", // Exemplo de como adicionar outro e-mail
];

// Lista de e-mails com permissão para ações destrutivas (como limpar histórico).
// Apenas os e-mails nesta lista poderão ver e usar o botão de limpar histórico.
export const SUPER_ADMINS = [
    "luamdarabello@gmail.com",
];
