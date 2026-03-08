import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Usuario {
  id: number;
  email: string;
  apodo: string;
  admin: 'SI' | 'NO';
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private get storage(): Storage | null {
    return typeof window !== 'undefined' ? localStorage : null;
  }

  get(key: string): string | null {
    return this.storage?.getItem(key) ?? null;
  }

  set(key: string, value: string): boolean {
    try {
      this.storage?.setItem(key, value);
      return true;
    } catch {
      console.warn(`No se pudo persistir "${key}" en localStorage.`);
      return false;
    }
  }

  remove(key: string): void {
    this.storage?.removeItem(key);
  }
}

@Injectable({ providedIn: 'root' })
export class GlobalService {
  private readonly STORAGE_KEY = 'usuario';

  private readonly usuarioSubject = new BehaviorSubject<Usuario | null>(
    this.cargarDesdeStorage()
  );

  /** Observable público para que los componentes se suscriban. */
  readonly usuario$ = this.usuarioSubject.asObservable();

  constructor(private readonly storageService: StorageService) {}

  /**
   * Guarda el usuario en memoria y en localStorage.
   * Emite el nuevo valor a todos los suscriptores.
   */
  setUsuario(user: Usuario): void {
    if (!user?.id || !user?.email) {
      throw new Error('Usuario inválido: se requiere id y email.');
    }
    if (!user.apodo?.trim()) {
      throw new Error('Usuario inválido: se requiere apodo.');
    }
    if (user.admin !== 'SI' && user.admin !== 'NO') {
      throw new Error('Campo admin inválido: debe ser "SI" o "NO".');
    }

    this.storageService.set(this.STORAGE_KEY, JSON.stringify(user));
    this.usuarioSubject.next(user);
  }

  /**
   * Retorna el usuario actual.
   */
  getUsuario(): Usuario | null {
    return this.usuarioSubject.getValue();
  }

  /**
   * Cierra sesión: limpia memoria, storage y notifica a suscriptores.
   */
  cerrarSesion(): void {
    this.storageService.remove(this.STORAGE_KEY);
    this.usuarioSubject.next(null);
  }

  /**
   * Indica si el usuario actual tiene rol de administrador.
   */
  esAdmin(): boolean {
    return this.getUsuario()?.admin === 'SI';
  }

  /**
   * Carga el usuario desde localStorage al inicializar el servicio.
   * Si el JSON está corrupto, lo elimina y retorna null.
   */
  private cargarDesdeStorage(): Usuario | null {
    try {
      const data = this.storageService?.get(this.STORAGE_KEY);
      return data ? (JSON.parse(data) as Usuario) : null;
    } catch {
      this.storageService?.remove(this.STORAGE_KEY);
      return null;
    }
  }
} 