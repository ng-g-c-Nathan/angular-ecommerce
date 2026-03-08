import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { toast } from 'ngx-sonner';
import { GlobalService } from '../../../servicio/global.service';
import { CorreoDevolucion } from '../../../servicio/Clases/CorreoDevolucion';

/** Componente que permite al administrador aceptar o denegar solicitudes de devolucion. */
@Component({
  selector: 'app-aceptar-devolucion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aceptar-devolucion.component.html',
  styleUrls: ['../../../../styles.css']
})
export class AceptarDevolucionComponent implements OnInit, OnDestroy {

  /** Lista de solicitudes de devolucion obtenidas desde el backend. */
  productos: any[] = [];

  /** Correo electronico del usuario autenticado. */
  correo: string = '';

  /** Formulario interno para construir el payload de notificacion por correo al cliente. */
  private readonly enviarCorreo = new FormGroup({
    Correo:        new FormControl(''),
    IdTransaccion: new FormControl('')
  });

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param crudService   Servicio para operaciones con la API.
   * @param router        Servicio de navegacion entre rutas.
   * @param globalService Servicio de estado global de sesion del usuario.
   */
  constructor(
    private readonly crudService:    CrudService,
    private readonly router:         Router,
    private readonly globalService:  GlobalService
  ) {}

  /** Verifica la sesion activa y carga las solicitudes de devolucion pendientes. */
  ngOnInit(): void {
    const usuario = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['Login']);
      return;
    }

    this.correo = usuario.email;
    this.obtenerDevoluciones();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Consulta todas las solicitudes de devolucion pendientes desde el backend. */
  private obtenerDevoluciones(): void {
    this.crudService.ObtenerRembolsos().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (respuesta: any[]) => {
        this.productos = respuesta ?? [];
      },
      error: () => {
        toast.error('Error al cargar las solicitudes de devolucion.');
      }
    });
  }

  /**
   * Autoriza la solicitud de devolucion indicada y notifica al cliente por correo.
   * @param queId   Identificador de la solicitud a autorizar.
   * @param index   Indice del elemento en la lista local.
   * @param destino Correo del cliente a notificar.
   */
  Aceptar(queId: string, index: number, destino: string): void {
    this.crudService.AutorizarRembolso(queId).pipe(
      switchMap(() => {
        this.enviarCorreo.patchValue({ Correo: destino, IdTransaccion: queId });
        return this.crudService.AvisarAutorizacion(this.enviarCorreo.value as CorreoDevolucion);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        toast.success('Se autorizo el reembolso.');
        this.obtenerDevoluciones();
      },
      error: () => {
        toast.error('Error al autorizar el reembolso.');
      }
    });
  }

  /**
   * Deniega la solicitud de devolucion indicada y notifica al cliente por correo.
   * @param queId   Identificador de la solicitud a denegar.
   * @param index   Indice del elemento en la lista local.
   * @param destino Correo del cliente a notificar.
   */
  Denegar(queId: string, index: number, destino: string): void {
    this.crudService.DenegarRembolso(queId).pipe(
      switchMap(() => {
        this.enviarCorreo.patchValue({ Correo: destino, IdTransaccion: queId });
        return this.crudService.AvisarDenegar(this.enviarCorreo.value as CorreoDevolucion);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.productos.splice(index, 1);
        toast.error('No se autorizo el reembolso.');
      },
      error: () => {
        toast.error('Error al denegar el reembolso.');
      }
    });
  }

  /** Redirige al usuario hacia la vista de login. */
  IrHaciaLogin(): void {
    this.router.navigate(['Login']);
  }
}