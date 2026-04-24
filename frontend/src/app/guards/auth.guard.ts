import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServicio } from '../services/auth.service';

export const authGuarda: CanActivateFn = () => {
  const authServicio = inject(AuthServicio);
  const router       = inject(Router);

  if (authServicio.estaLogueado()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};