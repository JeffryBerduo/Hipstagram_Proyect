import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BusquedaService } from '../../services/busqueda.service';
import { VotoServicio } from '../../services/voto.service';
import { AuthServicio } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
  termino: string = '';
  resultados: any[] = [];
  cargando: boolean = false;
  error: string = '';
  tipo: string = 'texto'; // tipo, hashtag o usuario
  votos: { [postId: number]: { likes: number; dislikes: number } } = {};
  postLiked: { [postId: number]: boolean } = {};
  postDisliked: { [postId: number]: boolean } = {};

  constructor(
    private busquedaService: BusquedaService,
    private votoServicio: VotoServicio,
    private authServicio: AuthServicio,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Obtener parámetro de búsqueda de la URL
    this.route.queryParams.subscribe((params) => {
      this.termino = params['q'] || '';
      this.tipo = params['tipo'] || 'texto';

      if (this.termino.trim()) {
        this.realizarBusqueda();
      }
    });
  }

  realizarBusqueda() {
    if (!this.termino.trim()) {
      this.error = 'Ingresa un término de búsqueda';
      return;
    }

    this.cargando = true;
    this.error = '';
    this.resultados = [];

    let busqueda;

    if (this.tipo === 'hashtag') {
      busqueda = this.busquedaService.buscarPorHashtag(this.termino);
    } else if (this.tipo === 'usuario') {
      busqueda = this.busquedaService.buscarPorUsuario(this.termino);
    } else {
      busqueda = this.busquedaService.buscarPorTexto(this.termino);
    }

    busqueda.subscribe({
      next: (respuesta) => {
        this.resultados = respuesta?.resultados || [];
        this.cargando = false;

        // Cargar votos para cada resultado
        this.resultados.forEach((post) => {
          this.cargarVotos(post.id);
        });
          this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        if (err?.status === 401 || err?.status === 403) {
          this.authServicio.cerrarSesion();
          this.router.navigate(['/login']);
        } else {
          this.error = 'No se encontraron resultados o hubo un error en la búsqueda';
        }
      },
    });
  }

  cargarVotos(postId: number) {
    this.votoServicio.obtenerVotos(postId).subscribe({
      next: (v) => {
        this.votos[postId] = {
          likes: v.likes,
          dislikes: v.dislikes,
        };
      },
    });
  }

  toggleLike(postId: number) {
    if (this.postLiked[postId]) {
      this.postLiked[postId] = false;
    } else {
      this.postLiked[postId] = true;
      this.postDisliked[postId] = false;
      this.votoServicio.votar(postId, 1).subscribe({
        next: () => this.cargarVotos(postId),
      });
    }
  }

  toggleDislike(postId: number) {
    if (this.postDisliked[postId]) {
      this.postDisliked[postId] = false;
    } else {
      this.postDisliked[postId] = true;
      this.postLiked[postId] = false;
      this.votoServicio.votar(postId, -1).subscribe({
        next: () => this.cargarVotos(postId),
      });
    }
  }

  volverAlFeed() {
    this.router.navigate(['/feed']);
  }
}
