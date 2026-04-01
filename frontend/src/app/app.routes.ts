import { Routes } from '@angular/router';
import { LoginComponent }    from './pages/login/login.component';
import { RegistroComponent } from './pages/register/register.component';
import { InicioComponent }   from './pages/inicio/inicio.component';
import { authGuarda }        from './guards/auth.guard';

export const routes: Routes = [
  { path: '',         redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegistroComponent },
  { path: 'inicio',   component: InicioComponent, canActivate: [authGuarda] },
];