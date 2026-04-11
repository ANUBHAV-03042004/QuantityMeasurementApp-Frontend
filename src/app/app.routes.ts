import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'operations', loadComponent: () => import('./pages/operations/operations.component').then(m => m.OperationsComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'oauth2-callback', loadComponent: () => import('./pages/oauth-callback/oauth-callback.component').then(m => m.OauthCallbackComponent) },
  { path: '**', redirectTo: '' }
];
