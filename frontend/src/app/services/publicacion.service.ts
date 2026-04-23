import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Publicacion } from '../models/publicacion.modelo';

@Injectable({ providedIn: 'root' })
export class PublicacionServicio {

  private url = environment.postUrl;

  constructor(private http: HttpClient) {}

  obtenerFeed(page: number = 1) {
    return this.http.get<{ publicaciones: Publicacion[], page: number, limit: number }>(
      `${this.url}/api/posts/feed?page=${page}`
    );
  }

  obtenerPost(id: number) {
    return this.http.get<Publicacion>(
      `${this.url}/api/posts/${id}`
    );
  }

crearPost(description: string, hashtags: string[] = [], image_url: string = '') {
  return this.http.post<{ message: string, publicacion: Publicacion }>(
    `${this.url}/api/posts`,
    { description, hashtags, image_url }
  );
}

  eliminarPost(id: number) {
    return this.http.delete<{ message: string }>(
      `${this.url}/api/posts/${id}`
    );
  }
}