// --- Arquivo de Definição de Tipos ---
// Este arquivo centraliza as "formas" (interfaces) dos dados utilizados em todo o aplicativo.
// Usar interfaces ajuda a garantir consistência e a evitar erros de digitação.

/**
 * @interface Consulente
 * @description Representa uma pessoa que será atendida.
 * @property {string} id - Identificador único do consulente.
 * @property {string} name - Nome do consulente.
 */
export interface Consulente {
  id: string;
  name: string;
}

/**
 * @interface Entity
 * @description Representa uma entidade espiritual que atua através de um médium.
 * @property {string} id - Identificador único da entidade.
 * @property {string} name - Nome da entidade (ex: "Pombagira", "Caboclo").
 * @property {Consulente[]} consulentes - Lista de consulentes agendados para esta entidade.
 * @property {boolean} isAvailable - Indica se a entidade está disponível para atendimento.
 */
export interface Entity {
  id: string;
  name: string;
  consulentes: Consulente[];
  isAvailable: boolean;
}

/**
 * @interface Medium
 * @description Representa um médium do terreiro.
 * @property {string} id - Identificador único do médium no banco de dados.
 * @property {string} name - Nome do médium.
 * @property {Entity[]} entities - Lista de entidades que o médium incorpora.
 * @property {boolean} isPresent - Indica se o médium está presente no dia.
 * @property {any} createdAt - Data de criação do registro, usado para ordenação. 
 */
export interface Medium {
  id: string;
  name: string;
  entities: Entity[];
  isPresent: boolean;
  createdAt: any; 
}
