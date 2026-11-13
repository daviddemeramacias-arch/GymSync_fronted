import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.scss',
})
export class Marketplace implements OnInit {
  products: any[] = [];
  msg = '';
  prod: any = { name: '', category: 'SUPPLEMENT', price: 0, stock: 0, gym_id: '' };
  order: any = { product_id: '', user_id: '', gym_id: '', quantity: 1 };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      const data = await firstValueFrom(this.api.products(this.prod.gym_id));
      this.products = data.products || [];
      this.msg = '';
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async create() {
    try {
      const data = await firstValueFrom(this.api.createProduct(this.prod));
      this.msg = 'Producto creado: ' + (data.product?.id || '');
      await this.load();
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }

  async orderProduct() {
    try {
      const data = await firstValueFrom(this.api.createOrder(this.order));
      this.msg = 'Pedido creado. Token pickup: ' + (data.order?.token || '');
    } catch (e: any) {
      this.msg = errorMessage(e);
    }
  }
}
