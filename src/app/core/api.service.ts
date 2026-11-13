import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

export const API_BASE = 'http://localhost:3000/api/v1';

/** Extrae el mensaje que devuelve el backend, con fallback al error HTTP. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.message || err.error?.error || err.message;
  }
  return err instanceof Error ? err.message : 'Error inesperado';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = API_BASE;

  constructor(private http: HttpClient) {}

  // ── M2: Socios y membresías ─────────────────────────────────────
  createUser(user: any) {
    return this.http.post<any>(`${this.base}/members/users`, user);
  }
  createPlan(plan: any) {
    return this.http.post<any>(`${this.base}/members/plans`, plan);
  }
  assignMembership(mem: any) {
    return this.http.post<any>(`${this.base}/members/memberships`, mem);
  }

  // ── M3: Pagos ───────────────────────────────────────────────────
  pendingPayments(gymId?: string) {
    return this.http.get<any>(`${this.base}/finance/payments/pending`, {
      params: this.params({ gym_id: gymId }),
    });
  }
  approvePayment(id: string) {
    return this.http.patch<any>(`${this.base}/finance/payments/${id}/approve`, {});
  }
  rejectPayment(id: string, reason: string) {
    return this.http.patch<any>(`${this.base}/finance/payments/${id}/reject`, { reason });
  }

  // ── M4: Marketplace ─────────────────────────────────────────────
  products(gymId?: string) {
    return this.http.get<any>(`${this.base}/marketplace/products`, {
      params: this.params({ gym_id: gymId }),
    });
  }
  createProduct(prod: any) {
    return this.http.post<any>(`${this.base}/marketplace/products`, prod);
  }
  createOrder(order: any) {
    return this.http.post<any>(`${this.base}/marketplace/orders`, order);
  }

  // ── M5: Rutinas ─────────────────────────────────────────────────
  // El router del backend ya está montado en /routines, por lo que sus
  // rutas internas ('/routines', '/logs') cuelgan de ese prefijo.
  routines(gymId?: string) {
    return this.http.get<any>(`${this.base}/routines/routines`, {
      params: this.params({ gym_id: gymId }),
    });
  }
  createRoutine(routine: any) {
    return this.http.post<any>(`${this.base}/routines/routines`, routine);
  }
  addRoutineLog(log: any) {
    return this.http.post<any>(`${this.base}/routines/logs`, log);
  }
  routineSuggestion(userId: string) {
    return this.http.get<any>(`${this.base}/routines/suggestions`, {
      params: this.params({ user_id: userId }),
    });
  }

  // ── M6: Notificaciones ──────────────────────────────────────────
  sendNotification(form: any) {
    return this.http.post<any>(`${this.base}/notifications/send`, form);
  }
  notificationLogs(gymId?: string) {
    return this.http.get<any>(`${this.base}/notifications/logs`, {
      params: this.params({ gym_id: gymId }),
    });
  }

  private params(values: Record<string, string | undefined | null>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value) params = params.set(key, value);
    }
    return params;
  }
}
