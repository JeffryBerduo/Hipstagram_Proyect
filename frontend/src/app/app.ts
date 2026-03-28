import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  
  private baseUrl = 'http://localhost:4000/api/auth';

  // Login
  login(correo: string, password: string) {
    return this.http.post(`${this.baseUrl}/login`, { correo, password });
  }

  // Registro
  register(userData: { nombre: string, correo: string, password: string }) {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }
}