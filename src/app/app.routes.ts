import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Socios } from './pages/socios/socios';
import { Pagos } from './pages/pagos/pagos';
import { Marketplace } from './pages/marketplace/marketplace';
import { Rutinas } from './pages/rutinas/rutinas';
import { Notificaciones } from './pages/notificaciones/notificaciones';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'socios', component: Socios },
  { path: 'pagos', component: Pagos },
  { path: 'marketplace', component: Marketplace },
  { path: 'rutinas', component: Rutinas },
  { path: 'notificaciones', component: Notificaciones },
  { path: '**', redirectTo: '' },
];
