import { Routes } from '@angular/router';
import { LoginComponent }    from './pages/login/login.component';
import { RegistroComponent } from './pages/register/register.component';
import { authGuarda }        from './guards/auth.guard';
import { FeedComponent } from './pages/feed/feed.component';

export const routes: Routes = [
  { path: '',         redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegistroComponent },
  { path: 'feed', component: FeedComponent, canActivate: [authGuarda] },
];