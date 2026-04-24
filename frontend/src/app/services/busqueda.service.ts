import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BusquedaService {

  private url = environment.busquedaUrl;

  constructor(private http: HttpClient) {}

  // Buscar por texto (hashtags o descripción)
  buscarPorTexto(termino: string) {
    const params = { q: termino };
    return this.http.get<any>(`${this.url}/api/search`, { params });
  }

  // Buscar por hashtag
  buscarPorHashtag(hashtag: string) {
    const params = { hashtag: hashtag };
    return this.http.get<any>(`${this.url}/api/search`, { params });
  }

  // Buscar por nombre de usuario
  buscarPorUsuario(username: string) {
    const params = { user: username };
    return this.http.get<any>(`${this.url}/api/search`, { params });
  }

  // Obtener posts populares (explore)
  obtenerPostsPopulares() {
    return this.http.get<any>(`${this.url}/api/search/explore`);
  }
}
