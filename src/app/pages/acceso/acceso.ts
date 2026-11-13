import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

type Method = 'QR' | 'PIN' | 'BIOMETRIC' | 'MANUAL';

@Component({
  selector: 'app-acceso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acceso.html',
  styleUrl: './acceso.scss',
})
export class Acceso implements OnInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  gymId = '';
  aforo: number | null = null;
  method: Method = 'QR';
  raw = '';
  result: any = null;
  msg = '';
  isError = false;
  validating = false;
  scanning = false;

  private stream?: MediaStream;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {
    this.gymId = this.auth.user()?.gym_id || '00000000-0000-0000-0000-000000000001';
  }

  ngOnInit() {
    this.loadAforo();
  }

  ngOnDestroy() {
    this.stopScan();
  }

  async loadAforo() {
    try {
      const data = await firstValueFrom(this.api.aforo());
      this.aforo = data.aforo ?? 0;
    } catch {
      this.aforo = null;
    } finally {
      this.cdr.detectChanges();
    }
  }

  async validate() {
    const raw = this.raw.trim();
    if (!raw) {
      this.msg = 'Pegá el contenido del QR o el código de 4 dígitos.';
      this.isError = true;
      return;
    }
    if (this.validating) return;

    const parsed = this.parse(raw);
    const body: any = { gym_id: this.gymId, method: this.method };
    if (parsed.code) body.code_4digit = parsed.code;
    else body.user_id = parsed.user_id;

    this.validating = true;
    this.msg = '';
    this.result = null;
    try {
      const data = await firstValueFrom(this.api.validateAccess(body));
      this.result = data;
      this.loadAforo();
    } catch (e: any) {
      if (e?.status === 403 && e?.error?.result) {
        this.result = e.error;
      } else {
        this.msg = errorMessage(e);
        this.isError = true;
      }
    } finally {
      this.validating = false;
      this.cdr.detectChanges();
    }
  }

  private parse(raw: string): { user_id?: string; code?: string } {
    if (raw.startsWith('gymsync://')) {
      const query = raw.split('?')[1] || '';
      const params = new URLSearchParams(query);
      return {
        user_id: params.get('user_id') || undefined,
        code: params.get('code') || undefined,
      };
    }
    if (raw.startsWith('{')) {
      try {
        const json = JSON.parse(raw);
        return { user_id: json.user_id, code: json.code_4digit || json.code };
      } catch {
        /* sigue como texto plano */
      }
    }
    if (/^\d{4}$/.test(raw)) return { code: raw };
    return { user_id: raw };
  }

  async startScan() {
    this.msg = '';
    this.isError = false;
    const BarcodeDetector = (window as any).BarcodeDetector;
    if (!BarcodeDetector) {
      this.msg = 'Este navegador no soporta escaneo con cámara. Pegá el contenido del QR o el código de 4 dígitos.';
      this.isError = true;
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.scanning = true;
      this.cdr.detectChanges();
      setTimeout(async () => {
        const video = this.videoRef?.nativeElement;
        if (!video || !this.stream) return;
        video.srcObject = this.stream;
        await video.play();
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        this.timer = setInterval(async () => {
          try {
            const codes = await detector.detect(video);
            if (codes?.length) {
              this.raw = codes[0].rawValue;
              this.stopScan();
              this.validate();
            }
          } catch {
            /* frame sin QR */
          }
        }, 400);
      });
    } catch {
      this.msg = 'No se pudo acceder a la cámara.';
      this.isError = true;
      this.scanning = false;
      this.cdr.detectChanges();
    }
  }

  stopScan() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    this.scanning = false;
    this.cdr.detectChanges();
  }

  clear() {
    this.raw = '';
    this.result = null;
    this.msg = '';
    this.isError = false;
    this.cdr.detectChanges();
  }
}
