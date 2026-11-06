import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  phone = '';
  pin = '';
  msg = '';

  async login() {
    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/login-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.phone, pin: this.pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error de login');
      localStorage.setItem('token', data.token);
      this.msg = '¡Login OK! Bienvenido ' + data.user?.first_name;
    } catch (e: any) {
      this.msg = e.message || 'Error';
    }
  }
}
