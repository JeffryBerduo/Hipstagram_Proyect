import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthServicio } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  email:             string  = '';
  contrasena:        string  = '';
  error:             string  = '';
  cargando:          boolean = false;
  mostrarContrasena: boolean = false;

  constructor(
    private authServicio: AuthServicio,
    private router: Router
  ) {}

  iniciarSesion() {
    this.error    = '';
    this.cargando = true;

    this.authServicio.login(this.email, this.contrasena).subscribe({
      next: (respuesta) => {
        this.authServicio.guardarSesion(respuesta.token, respuesta.user);
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.error    = err.error?.message || 'Error al iniciar sesión';
        this.cargando = false;
      }
    });
  }

}