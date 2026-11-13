import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './core/auth.service';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/socios': 'Socios y membresías',
  '/acceso': 'Control de acceso',
  '/pagos': 'Pagos',
  '/marketplace': 'Marketplace',
  '/rutinas': 'Rutinas',
  '/notificaciones': 'Notificaciones',
};

const ROLES: Record<number, string> = {
  1: 'Dueño',
  2: 'Administrador',
  3: 'Recepción',
  4: 'Socio',
};

@Component({
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private router = inject(Router);
  auth = inject(AuthService);

  showShell = false;
  pageTitle = 'Dashboard';
  today = new Date().toLocaleDateString('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e: any) => this.syncShell(e.urlAfterRedirects));
    this.syncShell(this.router.url);
  }

  private syncShell(url: string) {
    const path = (url || '/').split('?')[0];
    this.showShell = path !== '/' && path !== '';
    this.pageTitle = TITLES[path] || 'GymSync';
  }

  get userName(): string {
    const u = this.auth.user();
    if (!u) return 'Invitado';
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || 'Usuario';
  }

  get initials(): string {
    const u = this.auth.user();
    if (!u) return 'GS';
    return `${(u.first_name || 'G')[0]}${(u.last_name || '')[0] || ''}`.toUpperCase();
  }

  get roleLabel(): string {
    const u = this.auth.user();
    return u ? ROLES[u.role_id] || 'Staff' : 'Sin sesión';
  }

  get gymId(): string {
    const u = this.auth.user();
    return u?.gym_id ? String(u.gym_id).slice(0, 8) : '—';
  }

  logout() {
    this.auth.logout();
  }
}
