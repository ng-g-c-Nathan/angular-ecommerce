import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, ShoppingBag, RotateCcw, LogIn, PackageX } from 'lucide-angular';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { GlobalService } from '../../../servicio/global.service';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

/** Componente que muestra el historial de compras del usuario autenticado. */
@Component({
    selector: 'app-historial-de-compras',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule,
        NgxSonnerToaster,
    ],
    templateUrl: './historial-de-compras.component.html',
    styleUrls: ['../../../../styles.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('700ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class HistorialDeComprasComponent implements OnInit, OnDestroy {

  /** Icono de bolsa para representar compras. */
  readonly iconoCompras = ShoppingBag;

  /** Icono de flecha circular para representar devoluciones. */
  readonly iconoDevolucion = RotateCcw;

  /** Icono de inicio de sesion. */
  readonly iconoLogin = LogIn;

  /** Icono para el estado de historial vacio. */
  readonly iconoVacio = PackageX;

  /** Lista de productos comprados por el usuario, obtenida desde el backend. */
  Productos: any[] = [];

  /** Correo electronico del usuario autenticado. */
  correo: string | undefined;

  /** URL base para construir las rutas de imagenes de productos. */
  URL: string = environment.fotosUrl;

  /** Apodo del usuario autenticado. */
  Apodito: string | undefined;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param crudService   Servicio para operaciones con la API.
   * @param router        Servicio de navegacion entre rutas.
   * @param globalService Servicio de estado global de sesion del usuario.
   */
  constructor(
    private readonly crudService: CrudService,
    private readonly router: Router,
    private readonly globalService: GlobalService,
  ) {}

  /** Obtiene el usuario autenticado y carga su historial de compras. Redirige al login si no hay sesion activa. */
  ngOnInit(): void {

    const usuario = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('No deberias estar aqui..', {
        description: 'Sesion no encontrada. Redirigiendo al login...',
      });
      this.IrHaciaLogin();
      return;
    }

    this.correo  = usuario.email;
    this.Apodito = usuario.apodo;

    this.crudService.ObtenerCompras(this.correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: any) => {
          this.Productos = respuesta;

          if (!respuesta?.length) {
            toast.info('Sin compras registradas', {
              description: 'Aun no tienes productos en tu historial.',
            });
          }
        },
        error: () => {
          toast.error('Error al cargar compras', {
            description: 'No se pudo obtener el historial. Intenta mas tarde.',
          });
        }
      });

  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Redirige al usuario hacia la vista de login. */
  IrHaciaLogin(): void {
    this.router.navigate(['Login']);
  }

  /** Redirige al usuario hacia la vista de devoluciones si el correo esta disponible. */
  IrHaciaDevolucion(): void {
    if (this.correo) {
      this.router.navigate(['Devolucion'], { state: { email: this.correo } });
    }
  }

}