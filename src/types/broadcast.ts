export interface BroadcastMessage {
  type: 'UPDATE' | 'CREATE' | 'DELETE';
  data: unknown;
}
