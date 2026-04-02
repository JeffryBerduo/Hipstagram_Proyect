import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthServicio } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegistroComponent {

  username:          string  = '';
  email:             string  = '';
  contrasena:        string  = '';
  error:             string  = '';
  cargando:          boolean = false;
  mostrarContrasena: boolean = true;

  constructor(
    private authServicio: AuthServicio,
    private router: Router
  ) {}

  registrarse() {
    this.error    = '';
    this.cargando = true;

    this.authServicio.registro(this.username, this.email, this.contrasena).subscribe({
      next: (respuesta) => {
        this.authServicio.guardarSesion(respuesta.token, respuesta.user);
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.error    = err.error?.message || 'Error al registrarse';
        this.cargando = false;
      }
    });
  }
}