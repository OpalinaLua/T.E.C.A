
/**
 * @fileoverview Define os tipos de dados centrais para a aplicação.
 * Este arquivo exporta as interfaces para Consulente, Entidade e Médium,
 * que são usadas em toda a aplicação para garantir a consistência dos dados.
 */

/**
 * @const spiritualCategories
 * Define as categorias espirituais que podem ser usadas na aplicação.
 */
export const spiritualCategories = [
  "Exu",
  "Pombogira",
  "Malandros",
  "Pretos-Velhos",
  "Caboclos",
  "Boiadeiros",
  "Marinheiros",
  "Erês",
] as const;

/**
 * @type Category
 * Representa um tipo de categoria espiritual a partir da lista `spiritualCategories`.
 */
export type Category = typeof spiritualCategories[number];


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
