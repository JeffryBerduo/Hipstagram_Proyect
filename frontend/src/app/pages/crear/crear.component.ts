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
  styleUrl: './crear.component.css'
})
export class CrearComponent {

  descripcion:  string = '';
  hashtagInput: string = '';
  enviando:     boolean = false;
  error:        string = '';

  constructor(
    private publicacionServicio: PublicacionServicio,
    private router: Router
  ) {}

  get hashtags(): string[] {
    return this.hashtagInput
      .split(/[\s,]+/)
      .map(h => h.replace(/^#/, '').trim())
      .filter(h => h.length > 0);
  }

  publicar() {
    if (!this.descripcion.trim()) return;
    this.enviando = true;
    this.error = '';

    this.publicacionServicio.crearPost(this.descripcion.trim(), this.hashtags).subscribe({
      next: () => this.router.navigate(['/feed']),
      error: () => {
        this.error = 'No se pudo publicar. Inténtalo de nuevo.';
        this.enviando = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/feed']);
  }
}
