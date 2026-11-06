import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.scss',
})
export class Marketplace {
  products: any[] = [];
  msg = '';
  prod: any = { name: '', category: 'SUPPLEMENT', price: 0, stock: 0, gym_id: '' };
  order: any = { product_id: '', user_id: '', gym_id: '', quantity: 1 };
  token() { return localStorage.getItem('token') || ''; }
  base = 'http://localhost:3000/api/v1';

  async load() {
    try {
      const res = await fetch(`${this.base}/marketplace/products?gym_id=${this.prod.gym_id || ''}`, { headers: { Authorization: 'Bearer ' + this.token() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.products = data.products || [];
    } catch (e: any) { this.msg = e.message; }
  }

  async create() {
    try {
      const res = await fetch(`${this.base}/marketplace/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() }, body: JSON.stringify(this.prod) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.msg = 'Producto creado: ' + (data.product?.id || '');
      await this.load();
    } catch (e: any) { this.msg = e.message; }
  }

  async orderProduct() {
    try {
      const res = await fetch(`${this.base}/marketplace/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token() }, body: JSON.stringify(this.order) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Error');
      this.msg = 'Pedido creado. Token pickup: ' + (data.order?.token || '');
    } catch (e: any) { this.msg = e.message; }
  }
}
