import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicacionServicio } from '../../services/publicacion.service';

@Component({
  selector: 'app-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear.component.html',
  styleUrl: './crear.component.css',
})
export class CrearComponent {
  descripcion: string = '';
  hashtagInput: string = '';
  enviando: boolean = false;
  error: string = '';
  imagenBase64: string = ''; // ← nuevo
  previewImagen: string = ''; // ← nuevo

  constructor(
    private publicacionServicio: PublicacionServicio,
    private router: Router,
  ) {}

  get hashtags(): string[] {
    return this.hashtagInput
      .split(/[\s,]+/)
      .map((h) => h.replace(/^#/, '').trim())
      .filter((h) => h.length > 0);
  }

  seleccionarImagen(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagenBase64 = reader.result as string;
      this.previewImagen = reader.result as string;
    };
    reader.readAsDataURL(archivo);
  }

  publicar() {
    console.log('imagen base64:', this.imagenBase64?.substring(0, 50));
    if (!this.descripcion.trim()) {
      this.error = 'La descripción es requerida.';
      return;
    }
    if (this.descripcion.length > 128) {
      this.error = 'La descripción no puede superar 128 caracteres.';
      return;
    }
    this.enviando = true;
    this.error = '';

    this.publicacionServicio
      .crearPost(
        this.descripcion.trim(),
        this.hashtags,
        this.imagenBase64,
      )
      .subscribe({
        next: () => this.router.navigate(['/feed']),
        error: () => {
          this.error = 'No se pudo publicar. Inténtalo de nuevo.';
          this.enviando = false;
        },
      });
  }

  volver() {
    this.router.navigate(['/feed']);
  }
}
