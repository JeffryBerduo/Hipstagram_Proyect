import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
 
  private authService = inject(AuthService); 
  
  email = signal('');
  password = signal('');

  onLogin() {
    
    this.authService.login(this.email(), this.password()).subscribe({
      next: (respuesta: any) => {
        console.log('Backend dice:', respuesta);
        alert('¡Bienvenida!');
      },
      error: (fallo: any) => {
        console.error('Error de conexión:', fallo);
        alert('No se pudo conectar: ' + (fallo.error?.message || 'Servidor apagado'));
      }
    });
  }
}