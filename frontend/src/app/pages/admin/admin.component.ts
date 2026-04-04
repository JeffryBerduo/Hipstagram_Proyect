import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthServicio } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  usuario: any = null;
  palabrasProhibidas: { id: number; palabra: string }[] = [];
  nuevaPalabra: string = '';
  cargando: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  publicacionesPendientes: any[] = [];
  cargandoPendientes: boolean = false;

  constructor(
    private authServicio: AuthServicio,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.usuario = this.authServicio.obtenerUsuario();

    if (this.usuario.role !== 'ADMIN') {
      this.router.navigate(['/feed']);
      return;
    }

    this.cargarPalabrasProhibidas();
    this.cargarPendientes();
  }

  cargarPalabrasProhibidas() {
    this.cargando = true;
    this.http.get<any>(`${environment.postUrl}/api/posts/palabras-prohibidas`).subscribe({
      next: (respuesta) => {
        this.palabrasProhibidas = respuesta?.palabras || [];
        this.cargando = false;
      },
      error: () => {
        this.palabrasProhibidas = [];
        this.cargando = false;
      },
    });
  }

  agregarPalabra() {
    if (!this.nuevaPalabra.trim()) {
      this.mostrarMensaje('Por favor ingresa una palabra', 'error');
      return;
    }

    this.http
      .post<any>(`${environment.postUrl}/api/posts/palabras-prohibidas`, {
        palabra: this.nuevaPalabra.toLowerCase().trim(),
      })
      .subscribe({
        next: () => {
          this.nuevaPalabra = '';
          this.mostrarMensaje('Palabra agregada correctamente', 'success');
          this.cargarPalabrasProhibidas(); // ← recarga la lista
        },
        error: (err) => {
          this.mostrarMensaje(err.error?.message || 'Error al agregar palabra', 'error');
        },
      });
  }

  eliminarPalabra(id: number) {
    if (!confirm('¿Deseas eliminar esta palabra?')) return;

    this.http.delete<any>(`${environment.postUrl}/api/posts/palabras-prohibidas/${id}`).subscribe({
      next: () => {
        this.mostrarMensaje('Palabra eliminada correctamente', 'success');
        this.cargarPalabrasProhibidas(); // ← recarga la lista
      },
      error: () => {
        this.mostrarMensaje('Error al eliminar palabra', 'error');
      },
    });
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
      this.tipoMensaje = '';
    }, 3000);
  }

  volverAlFeed() {
    this.router.navigate(['/feed']);
  }

  cerrarSesion() {
    this.authServicio.cerrarSesion();
    this.router.navigate(['/login']);
  }

  cargarPendientes() {
  this.cargandoPendientes = true;
  this.http.get<any>(`${environment.postUrl}/api/posts/admin/all?status=PENDING`).subscribe({
    next: (respuesta) => {
      console.log('respuesta pendientes:', respuesta);
      this.publicacionesPendientes = respuesta?.publicaciones || [];
      console.log('publicaciones:', this.publicacionesPendientes);
      console.log('antes de false:', this.cargandoPendientes);
      this.cargandoPendientes = false;
      console.log('despues de false:', this.cargandoPendientes);
    },
    error: (err) => {
      console.log('error pendientes:', err);
      this.cargandoPendientes = false;
    },
  });
}

  aprobarPost(id: number) {
    this.http.patch(`${environment.postUrl}/api/posts/admin/${id}/approve`, {}).subscribe({
      next: () => {
        this.mostrarMensaje('Publicación aprobada', 'success');
        this.cargarPendientes();
      },
      error: () => this.mostrarMensaje('Error al aprobar', 'error'),
    });
  }

  rechazarPost(id: number) {
    this.http.patch(`${environment.postUrl}/api/posts/admin/${id}/reject`, {}).subscribe({
      next: () => {
        this.mostrarMensaje('Publicación rechazada', 'success');
        this.cargarPendientes();
      },
      error: () => this.mostrarMensaje('Error al rechazar', 'error'),
    });
  }

  actualizarTodo() {
  this.cargarPalabrasProhibidas();
  this.cargarPendientes();
}
}
