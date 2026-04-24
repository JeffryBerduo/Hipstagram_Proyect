import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Comentario } from '../models/comentario.modelo';

@Injectable({ providedIn: 'root' })
export class ComentarioServicio {

  private url = environment.comentarioUrl;

  constructor(private http: HttpClient) {}

  obtenerComentarios(post_id: number, page: number = 1) {
    return this.http.get<{ comentarios: Comentario[], total: number }>(
      `${this.url}/api/comments/${post_id}?page=${page}`
    );
  }

  crearComentario(post_id: number, contenido: string) {
    return this.http.post<{ message: string, comentario: Comentario }>(
      `${this.url}/api/comments/${post_id}`,
      { contenido }
    );
  }

  eliminarComentario(id: number) {
    return this.http.delete<{ message: string }>(
      `${this.url}/api/comments/${id}`
    );
  }
}