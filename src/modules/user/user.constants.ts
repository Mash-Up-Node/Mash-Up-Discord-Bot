export enum Department {
  Node = '노드',
  Spring = '스프링',
  Design = '디자인',
  iOS = '아오스',
  Android = '안드',
  Web = '웹',
  Unknown = 'Unknown',
}

export const DEPARTMENT_REGEX = /^\[(노드|스프링|디자인|아오스|안드|웹)\]/;

export const ADMIN_PASSWORD = 'mashup1234';

export interface SyncResult {
  synced: number;
  failed: { discordId: string; displayName: string }[];
}
