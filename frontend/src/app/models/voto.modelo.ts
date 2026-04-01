export interface Voto {
  id:        number;
  user_id:   number;
  post_id:   number;
  tipo_voto: 1 | -1;
  created_at: string;
}