# T.E.C.A - Templo Escola de Caridade e Amor

Bem-vindo ao repositório do **T.E.C.A**, um sistema de gerenciamento de consulência espiritual projetado para ser simples, intuitivo e eficiente. A aplicação foi desenvolvida para otimizar a organização dos atendimentos, a gestão dos médiuns e o controle das giras, tudo em tempo real e com foco na experiência móvel.

## ✨ Visão Geral

O T.E.C.A foi criado para substituir métodos manuais e demorados de agendamento, como o uso de papel e caneta ou planilhas. Com ele, a equipe de recepção pode agendar consulentes, marcar a presença dos médiuns e visualizar o fluxo de atendimentos de forma clara e organizada, diretamente de um celular, tablet ou computador.

A aplicação utiliza o **Firebase Firestore** como banco de dados, garantindo que todas as informações sejam sincronizadas em tempo real entre todos os dispositivos conectados.

## 🚀 Funcionalidades Principais

- **Agendamento de Consulentes**: Um formulário simples permite agendar um novo consulente, selecionando um médium e uma entidade que estejam disponíveis e com vagas.
- **Controle de Presença dos Médiuns**: Administradores podem marcar quais médiuns estão presentes para o trabalho do dia. Médiuns ausentes não aparecem como opção para agendamento.
- **Gestão de Entidades**: Cada médium possui suas entidades, com limites de atendimento personalizáveis. É possível ativar ou desativar uma entidade a qualquer momento.
- **Gerenciamento da Gira**: Administradores podem selecionar quais "linhas de trabalho" (categorias espirituais, como Exu, Pombogira, Caboclos, etc.) estão ativas na gira do dia. Apenas entidades pertencentes às categorias selecionadas estarão disponíveis para agendamento.
- **Visualização em Tempo Real**: A tela principal exibe cards de todos os médiuns, mostrando suas entidades ativas, os consulentes agendados e as vagas restantes. A lista é atualizada instantaneamente para todos os usuários.
- **Autenticação Segura**: O acesso à área de gerenciamento é protegido por login com o Google, garantindo que apenas usuários autorizados possam realizar alterações.
- **Design Responsivo (Mobile-First)**: A interface foi projetada para ser usada primariamente em celulares, garantindo uma experiência de uso fluida e acessível durante o trabalho.

## 🔑 Para Administradores

A área de gerenciamento é o centro de controle do sistema. Para acessá-la, é necessário fazer login com um e-mail previamente autorizado no arquivo `src/lib/secrets.ts`.

### Funcionalidades do Painel de Gerenciamento:

1.  **Gira**: Selecione as categorias de trabalho que estarão ativas. Isso filtra quais entidades podem receber agendamentos.
2.  **Médiuns**:
    - **Controle de Presença**: Ative ou desative a presença de um médium com um simples interruptor.
    - **Editar Médium**: Altere o nome, as entidades, suas categorias e os limites de atendimento.
    - **Remover Médium**: Exclua o cadastro de um médium. *Atenção: esta ação é irreversível e remove todos os consulentes associados.*
3.  **Cadastrar**: Adicione novos médiuns ao sistema, especificando suas entidades, categorias e limites de vaga.
4.  **Avançado**:
    - **Histórico de Acesso**: Visualize um registro dos últimos logins realizados na área de gerenciamento.

### 👑 Para Super Administradores

Super administradores (definidos no arquivo `src/lib/secrets.ts`) possuem permissões adicionais:

1.  **Gerenciar Categorias da Gira**: Na aba "Avançado", é possível adicionar novas categorias de trabalho (ex: "Ciganos", "Baianos") ou remover categorias existentes. Esta funcionalidade oferece total flexibilidade para adaptar o sistema às necessidades do templo.
2.  **Limpar Histórico de Acesso**: Também na aba "Avançado", super administradores podem limpar permanentemente todo o histórico de logins do sistema.

## 🛠️ Detalhes Técnicos

- **Frontend**: Next.js (React) com TypeScript.
- **Banco de Dados**: Firebase Firestore para persistência e sincronização de dados em tempo real.
- **Autenticação**: Firebase Authentication (Google Provider).
- **UI/Componentes**: ShadCN UI, Tailwind CSS para estilização.
- **Hooks**: Hooks personalizados do React para gerenciamento de estado e lógica de negócio (`useSchoolData`, `useLoginHistory`, etc.).
