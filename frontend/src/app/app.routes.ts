import { Routes } from '@angular/router';
import { authGuard, guestGuard, noProfileGuard } from './core/guards/auth.guard';

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
  {
    path: 'daily',
    loadComponent: () => import('./pages/daily/daily.component').then(m => m.DailyComponent),
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./pages/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'setup-profile',
    canActivate: [noProfileGuard],
    loadComponent: () => import('./pages/setup-profile/setup-profile.component').then(m => m.SetupProfileComponent),
  },
  {
    path: 'join/:code',
    loadComponent: () => import('./pages/join/join.component').then(m => m.JoinComponent),
  },
  { path: '**', redirectTo: '' },
];
