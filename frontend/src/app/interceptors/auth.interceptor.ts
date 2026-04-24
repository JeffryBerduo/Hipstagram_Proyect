import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthServicio } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authServicio = inject(AuthServicio);
  const token        = authServicio.obtenerToken();

  if (token) {
    const reqConToken = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(reqConToken);
  }

  return next(req);
};