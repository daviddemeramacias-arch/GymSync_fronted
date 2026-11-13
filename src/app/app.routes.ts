import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Socios } from './pages/socios/socios';
import { Acceso } from './pages/acceso/acceso';
import { Pagos } from './pages/pagos/pagos';
import { Marketplace } from './pages/marketplace/marketplace';
import { Rutinas } from './pages/rutinas/rutinas';
import { Notificaciones } from './pages/notificaciones/notificaciones';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'socios', component: Socios, canActivate: [authGuard] },
  { path: 'acceso', component: Acceso, canActivate: [authGuard] },
  { path: 'pagos', component: Pagos, canActivate: [authGuard] },
  { path: 'marketplace', component: Marketplace, canActivate: [authGuard] },
  { path: 'rutinas', component: Rutinas, canActivate: [authGuard] },
  { path: 'notificaciones', component: Notificaciones, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
