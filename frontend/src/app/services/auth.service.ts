import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { RespuestaLogin, RespuestaRegistro } from '../models/token.modelo';

@Injectable({ providedIn: 'root' })
export class AuthServicio {

  private url = environment.authUrl;

  constructor(private http: HttpClient) {}

  login(email: string, contrasena: string) {
    return this.http.post<RespuestaLogin>(
      `${this.url}/api/auth/login`,
      { email, password: contrasena }
    );
  }

  registro(username: string, email: string, contrasena: string) {
    return this.http.post<RespuestaRegistro>(
      `${this.url}/api/auth/register`,
      { username, email, password: contrasena }
    );
  }

  guardarSesion(token: string, usuario: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  obtenerUsuario() {
    const datos = localStorage.getItem('usuario');
    return datos ? JSON.parse(datos) : null;
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  estaLogueado(): boolean {
    return !!this.obtenerToken();
  }
}