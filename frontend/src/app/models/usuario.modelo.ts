export interface Usuario {
  id:             number;
  username:       string;
  email:          string;
  role:           'USER' | 'ADMIN';
  is_active:      boolean;
  fecha_registro: string;
}