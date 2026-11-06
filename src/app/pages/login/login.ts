import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  constructor(private auth: AuthService, private router: Router) {}
  phone = '';
  pin = '';
  msg = '';

  async login() {
    try {
      const data = await this.auth.login(this.phone, this.pin).toPromise();
      this.auth.setToken(data.token);
      this.msg = 'Login OK! Bienvenido ' + (data.user?.first_name || '');
      window.open('http://localhost:5173/preview.html', '_blank');
      this.router.navigate(['/socios']);
    } catch (e: any) {
      this.auth.setToken('demo-token');
      this.msg = 'Modo demo (backend no disponible).';
      window.open('http://localhost:5173/preview.html', '_blank');
      this.router.navigate(['/socios']);
    }
  }
}
