import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { from } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Protege rutas que requieren estar autenticado (ej: /setup-profile)
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    filter(user => user !== undefined),
    take(1),
    map(user => user ? true : router.createUrlTree(['/auth'])),
  );
};

// Protege rutas para no autenticados (ej: /auth)
// Si ya tienes perfil → /, si estás logueado sin perfil → /setup-profile
export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    filter(user => user !== undefined),
    take(1),
    switchMap(async user => {
      if (!user) return true;
      const profile = await authService.getProfile();
      return profile
        ? router.createUrlTree(['/'])
        : router.createUrlTree(['/setup-profile']);
    }),
  );
};

// Para /setup-profile: si ya tienes perfil → /
export const noProfileGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    filter(user => user !== undefined),
    take(1),
    switchMap(async user => {
      if (!user) return router.createUrlTree(['/auth']);
      const profile = await authService.getProfile();
      return profile ? router.createUrlTree(['/']) : true;
    }),
  );
};
