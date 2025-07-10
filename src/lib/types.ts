
/**
 * @fileoverview Define os tipos de dados centrais para a aplicação.
 * Este arquivo exporta as interfaces para Consulente, Entidade e Médium,
 * que são usadas em toda a aplicação para garantir a consistência dos dados.
 */

/**
 * @type Category
 * Representa um tipo de categoria espiritual. O valor é uma string,
 * e a lista de categorias válidas é gerenciada no Firestore.
 */
export type Category = string;


/**
 * @interface Consulente
 * Representa um consulente (aluno/paciente) agendado para um atendimento.
 */
export interface Consulente {
  id: string;
  name: string;
}

/**
 * @interface Entity
 * Representa uma entidade espiritual que atua através de um médium.
 * Contém informações sobre os consulentes agendados para ela.
 */
export interface Entity {
  id: string;
  name: string;
  category: Category;
  consulentes: Consulente[];
  isAvailable: boolean;
  consulenteLimit: number;
}

/**
 * @interface Medium
 * Representa um médium, que é o canal para as entidades.
 * Contém as informações do médium e a lista de entidades associadas a ele.
 */
export interface Medium {
  id: string;
  name: string;
  entities: Entity[];
  isPresent: boolean;
  createdAt: string; // Usado para ordenação local
}

/**
 * @interface LoginEntry
 * Representa um registro de login na área administrativa.
 */
export interface LoginEntry {
  id: string;
  email: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  };
}
