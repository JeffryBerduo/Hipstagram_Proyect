import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicacionServicio } from '../../services/publicacion.service';
import { VotoServicio } from '../../services/voto.service';
import { ComentarioServicio } from '../../services/comentario.service';
import { AuthServicio } from '../../services/auth.service';
import { Publicacion } from '../../models/publicacion.modelo';
import { Comentario } from '../../models/comentario.modelo';
import { Usuario } from '../../models/usuario.modelo';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit {

  publicaciones: Publicacion[] = [];
  cargando:      boolean = false;
  paginaActual:  number  = 1;
  usuario:       Usuario | null = null;

  postAbierto:  number | null = null;
  comentarios:  { [postId: number]: Comentario[] } = {};
  votos:        { [postId: number]: { likes: number, dislikes: number } } = {};
  postLiked:    { [postId: number]: boolean } = {};
  postDisliked: { [postId: number]: boolean } = {};
  comentarioNuevo: { [postId: number]: string } = {};

  constructor(
    private publicacionServicio: PublicacionServicio,
    private votoServicio:        VotoServicio,
    private comentarioServicio:  ComentarioServicio,
    private authServicio:        AuthServicio,
    private router:              Router
  ) {}

  ngOnInit() {
    this.usuario = this.authServicio.obtenerUsuario();
    this.cargarFeed();
  }

  cargarFeed() {
    this.cargando = true;
    this.publicacionServicio.obtenerFeed(this.paginaActual).subscribe({
      next: (respuesta) => {
        this.publicaciones = [...this.publicaciones, ...respuesta.publicaciones];
        respuesta.publicaciones.forEach(p => this.cargarVotos(p.id));
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  cargarVotos(postId: number) {
    this.votoServicio.obtenerVotos(postId).subscribe({
      next: (v) => { this.votos[postId] = { likes: v.likes, dislikes: v.dislikes }; }
    });
  }

  toggleLike(postId: number) {
    if (this.postLiked[postId]) {
      this.postLiked[postId] = false;
    } else {
      this.postLiked[postId] = true;
      this.postDisliked[postId] = false;
      this.votoServicio.votar(postId, 1).subscribe({
        next: () => this.cargarVotos(postId)
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
        next: () => this.cargarVotos(postId)
      });
    }
  }

  votar(postId: number, tipo: 1 | -1) {
    this.votoServicio.votar(postId, tipo).subscribe({
      next: () => this.cargarVotos(postId)
    });
  }

  verComentarios(postId: number) {
    if (this.postAbierto === postId) {
      this.postAbierto = null;
      return;
    }
    this.postAbierto = postId;
    if (!this.comentarios[postId]) {
      this.comentarioServicio.obtenerComentarios(postId).subscribe({
        next: (r) => { this.comentarios[postId] = r.comentarios; }
      });
    }
  }

  agregarComentario(postId: number) {
    const texto = this.comentarioNuevo[postId]?.trim();
    if (!texto) return;

    this.comentarioServicio.crearComentario(postId, texto).subscribe({
      next: (r) => {
        if (!this.comentarios[postId]) this.comentarios[postId] = [];
        this.comentarios[postId] = [...this.comentarios[postId], r.comentario];
        this.comentarioNuevo[postId] = '';
        this.postAbierto = postId;
      }
    });
  }

  cargarMas() {
    this.paginaActual++;
    this.cargarFeed();
  }

  irAFeed()   { this.router.navigate(['/feed']);   }
  irACrear()  { this.router.navigate(['/crear']);  }
  irAPerfil() { this.router.navigate(['/perfil']); }
}
