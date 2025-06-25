export interface Consulente {
  id: string;
  name: string;
}

export interface Entity {
  id: string;
  name: string;
  consulentes: Consulente[];
  isAvailable: boolean;
}

export interface Medium {
  id: string;
  name: string;
  entities: Entity[];
  isPresent: boolean;
  createdAt: any; 
}
