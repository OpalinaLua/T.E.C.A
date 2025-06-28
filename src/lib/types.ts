/**
 * @fileoverview Define os tipos de dados centrais para a aplicação.
 * Este arquivo exporta as interfaces para Consulente, Entidade e Médium,
 * que são usadas em toda a aplicação para garantir a consistência dos dados.
 */

import type { Timestamp } from 'firebase/firestore';

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
  createdAt: Timestamp; // Usado pelo Firebase para ordenação
}
