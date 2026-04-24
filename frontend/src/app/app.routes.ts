import { Routes } from '@angular/router';
import { LoginComponent }    from './pages/login/login.component';
import { RegistroComponent } from './pages/register/register.component';
import { authGuarda }        from './guards/auth.guard';
import { FeedComponent }     from './pages/feed/feed.component';
import { CrearComponent }    from './pages/crear/crear.component';
import { SearchComponent }   from './pages/search/search.component';
import { AdminComponent }    from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '',         redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegistroComponent },
  { path: 'feed',     component: FeedComponent,  canActivate: [authGuarda] },
  { path: 'crear',    component: CrearComponent, canActivate: [authGuarda] },
  { path: 'buscar',   component: SearchComponent, canActivate: [authGuarda] },
  { path: 'admin',    component: AdminComponent, canActivate: [authGuarda] },
];