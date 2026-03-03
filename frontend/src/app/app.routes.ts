import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'lobby/:code',
    loadComponent: () => import('./pages/lobby/lobby.component').then(m => m.LobbyComponent),
  },
  {
    path: 'game/:code',
    loadComponent: () => import('./pages/game/game.component').then(m => m.GameComponent),
  },
  { path: '**', redirectTo: '' },
];
