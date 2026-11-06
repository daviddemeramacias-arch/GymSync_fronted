import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Socios } from './pages/socios/socios';
import { Pagos } from './pages/pagos/pagos';
import { Marketplace } from './pages/marketplace/marketplace';
import { Rutinas } from './pages/rutinas/rutinas';
import { Notificaciones } from './pages/notificaciones/notificaciones';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'socios', component: Socios, canActivate: [authGuard] },
  { path: 'pagos', component: Pagos, canActivate: [authGuard] },
  { path: 'marketplace', component: Marketplace, canActivate: [authGuard] },
  { path: 'rutinas', component: Rutinas, canActivate: [authGuard] },
  { path: 'notificaciones', component: Notificaciones, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
