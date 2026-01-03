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
 * @const ROLES
 * Define os cargos que um médium pode ter.
 */
export const ROLES = ["Pai de Santo", "Pai Pequeno", "Mãe Pequena"] as const;

/**
 * @type MediumRole
 * Representa um dos cargos definidos em ROLES.
 */
export type MediumRole = typeof ROLES[number];


/**
 * @type ConsulenteStatus
 * Representa o status de um consulente agendado.
 */
export type ConsulenteStatus = 'agendado' | 'atendido' | 'ausente';

/**
* @interface Consulente
* Representa um consulente (aluno/paciente) agendado para um atendimento.
*/
export interface Consulente {
  id: string;
  name: string;
  status: ConsulenteStatus;
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
  order: number;
}

/**
 * @interface Medium
 * Representa um médium, que é o canal para as entidades.
 * Contém as informações do médium e a lista de entidades associadas a ele.
 */
export interface Medium {
  id: string;
  name: string;
  role?: MediumRole;
  entities: Entity[];
  isPresent: boolean;
  createdAt: any; 
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
