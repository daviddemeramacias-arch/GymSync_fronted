import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

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
  isError = false;
  loading = false;
  categories = ['SUPPLEMENT', 'CLOTHING', 'ACCESSORY', 'OTHER'];
  prod: any = { name: '', category: 'SUPPLEMENT', price: 0, stock: 0, gym_id: '' };
  order: any = { product_id: '', user_id: '', gym_id: '', quantity: 1 };

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {
    const gymId = this.auth.user()?.gym_id || '';
    this.prod.gym_id = gymId;
    this.order.gym_id = gymId;
  }

  ngOnInit() {
    this.load();
  }

  private setMsg(msg: string, isError = false) {
    this.msg = msg;
    this.isError = isError;
  }

  async load() {
    this.loading = true;
    try {
      const data = await firstValueFrom(this.api.products(this.prod.gym_id));
      this.products = data.products || [];
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async create() {
    try {
      const data = await firstValueFrom(this.api.createProduct(this.prod));
      this.setMsg('Producto creado: ' + (data.product?.id || ''));
      await this.load();
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async orderProduct() {
    try {
      const data = await firstValueFrom(this.api.createOrder(this.order));
      this.setMsg('Pedido creado. Token pickup: ' + (data.order?.token || ''));
    } catch (e: any) {
      this.setMsg(errorMessage(e), true);
    } finally {
      this.cdr.detectChanges();
    }
  }

  money(value: any): string {
    return Number(value || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
  }

  categoryLabel(category: string): string {
    const map: Record<string, string> = {
      SUPPLEMENT: 'Suplemento', CLOTHING: 'Ropa', ACCESSORY: 'Accesorio', OTHER: 'Otro',
    };
    return map[category] || category;
  }
}
