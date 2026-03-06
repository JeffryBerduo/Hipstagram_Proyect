import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private apiUrl = 'http://localhost:4000/api/auth/login';

  login(correo: string, password: string) {
    // Enviamos 'correo' y 'password' tal cual los pide el Backend de Node.js
    return this.http.post(this.apiUrl, { correo, password });
  }
}