import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthServicio } from '../../services/auth.service';
import { Usuario } from '../../models/usuario.modelo';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html'
})
export class InicioComponent implements OnInit {

  usuario: Usuario | null = null;

  constructor(
    private authServicio: AuthServicio,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuario = this.authServicio.obtenerUsuario();
  }

  cerrarSesion() {
    this.authServicio.cerrarSesion();
    this.router.navigate(['/login']);
  }
}