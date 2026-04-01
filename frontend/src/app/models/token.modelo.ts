import { Usuario } from './usuario.modelo';

export interface RespuestaLogin {
  message: string;
  token:   string;
  user:    Usuario;
}

export interface RespuestaRegistro {
  message: string;
  token:   string;
  user:    Usuario;
}