import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VotoServicio {

  private url = environment.votoUrl;

  constructor(private http: HttpClient) {}

  votar(post_id: number, tipo_voto: 1 | -1) {
    return this.http.post<{ message: string, voto: any }>(
      `${this.url}/api/votes`,
      { post_id, tipo_voto }
    );
  }

  obtenerVotos(post_id: number) {
    return this.http.get<{ likes: number, dislikes: number }>(
      `${this.url}/api/votes/${post_id}`
    );
  }

  obtenerMiVoto(post_id: number) {
    return this.http.get<{ voto: any }>(
      `${this.url}/api/votes/${post_id}/me`
    );
  }
}