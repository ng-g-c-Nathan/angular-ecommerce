import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Rembolso } from '../../../servicio/Clases/Rembolso';
import { CorreoDevolucion } from '../../../servicio/Clases/CorreoDevolucion';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { environment } from '../../../../environments/environment';
import { LucideAngularModule, PackageSearch, RotateCcw, AlertCircle, CheckCircle, X } from 'lucide-angular';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';

/** Componente que muestra los pedidos del usuario y permite solicitar devoluciones. */
@Component({
  selector: 'app-ver-mis-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    NgxSonnerToaster,
  ],
  templateUrl: './ver-mis-pedidos.component.html',
  styleUrl: '../../../../styles.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('700ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class VerMisPedidosComponent implements OnInit, OnDestroy {

  /** Icono de busqueda de paquete para el estado de carga. */
  readonly PackageSearch = PackageSearch;

  /** Icono de flecha circular para representar devoluciones. */
  readonly RotateCcw = RotateCcw;

  /** Icono de alerta para estados de error o advertencia. */
  readonly AlertCircle = AlertCircle;

  /** Icono de confirmacion para estados exitosos. */
  readonly CheckCircle = CheckCircle;

  /** Icono de cierre para el panel de solicitud. */
  readonly X = X;

  /** URL base de la API para construir rutas de imagenes. */
  readonly URL = environment.fotosUrl;

  /** Correo electronico del usuario autenticado. */
  correo = '';

  /** Apodo del usuario autenticado. */
  apodito = '';

  /** Lista de pedidos que ya tienen una solicitud de devolucion activa. */
  productosConDevolucion: any[] = [];

  /** Lista de pedidos elegibles para solicitar devolucion. */
  productosSinDevolucion: any[] = [];

  /** Controla si el panel de solicitud de devolucion es visible. */
  mostrarPanel = false;

  /** Indica si la carga de pedidos esta en curso. */
  cargando = false;

  /** Datos del pedido actualmente seleccionado para solicitar devolucion. */
  private seleccion = {
    texto: '', idProducto: 0, idTransaccion: 0, idCompra: 0, monto: 0
  };

  /** Retorna el nombre del producto seleccionado para mostrar en el panel. */
  get textoSeleccionado() { return this.seleccion.texto; }

  /** Formulario reactivo para capturar la razon de la solicitud de devolucion. */
  readonly formularioDevolucion = new FormGroup({
    Razon: new FormControl('', [Validators.required, Validators.maxLength(255)])
  });

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param crudService   Servicio para operaciones con la API.
   * @param globalService Servicio de estado global de sesion del usuario.
   * @param router        Servicio de navegacion entre rutas.
   */
  constructor(
    private readonly crudService:   CrudService,
    private readonly globalService: GlobalService,
    private readonly router:        Router,
  ) {}

  /** Verifica la sesion activa y carga los pedidos del usuario clasificados por estado de devolucion. */
  ngOnInit(): void {
    const usuario = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['Login']);
      return;
    }

    this.correo  = usuario.email;
    this.apodito = usuario.apodo ?? usuario.email;
    this.cargarPedidos();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Consulta las compras del usuario y las clasifica segun si ya tienen devolucion solicitada. */
  private cargarPedidos(): void {
    this.cargando               = true;
    this.productosConDevolucion = [];
    this.productosSinDevolucion = [];

    this.crudService.ObtenerCompras(this.correo).pipe(
      switchMap((productos: any[]) => {
        if (!productos?.length) return of([]);

        const peticiones = productos.map(producto =>
          this.crudService.ExisteRembolso({
            idProducto:    producto.idProducto,
            idTransaccion: producto.idTransaccion,
            idCompra:      producto.idCompra,
          }).pipe(
            map(resultado => ({ producto, resultado }))
          )
        );

        return forkJoin(peticiones);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resultados: any[]) => {
        this.cargando = false;

        resultados.forEach(({ producto, resultado }) => {
          if (resultado == 1) {
            this.productosSinDevolucion.push(producto);
          } else {
            this.productosConDevolucion.push(producto);
          }
        });
      },
      error: () => {
        this.cargando = false;
        toast.error('Error al cargar los pedidos.');
      }
    });
  }

  /** Almacena los datos del pedido seleccionado, limpia el formulario y muestra el panel de solicitud. */
  abrirSolicitud(
    item:          any,
    idTransaccion: number,
    idCompra:      number,
    idProducto:    number,
    monto:         number
  ): void {
    this.seleccion = { texto: item, idProducto, idTransaccion, idCompra, monto };
    this.formularioDevolucion.reset();
    this.mostrarPanel = true;
  }

  /** Oculta el panel de solicitud de devolucion. */
  cerrarPanel(): void {
    this.mostrarPanel = false;
  }

  /** Valida el formulario, registra la solicitud de devolucion y notifica al usuario por correo. */
  enviarSolicitud(): void {
    if (this.formularioDevolucion.invalid) {
      toast.error('Ingresa una razon valida (1-255 caracteres).');
      return;
    }

    const payload: Rembolso = {
      idProducto:    String(this.seleccion.idProducto),
      idTransaccion: String(this.seleccion.idTransaccion),
      idCompra:      String(this.seleccion.idCompra),
      monto:         String(this.seleccion.monto),
      razon:         this.formularioDevolucion.value.Razon ?? '',
      correo:        this.correo,
    };

    this.crudService.Rembolso(payload).pipe(
      switchMap((response: any) => {
        if (!response.success) {
          throw new Error('Ha ocurrido un error al procesar la solicitud.');
        }

        toast.success(`Solicitud creada con ID ${response.success}. Revisa tu correo.`);
        this.mostrarPanel = false;

        const correoPayload: CorreoDevolucion = {
          Email:         this.correo,
          IdTransaccion: String(response.success)
        };

        return this.crudService.AvisarRembolso(correoPayload);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.cargarPedidos();
      },
      error: (err: Error) => {
        toast.error(err?.message || 'Error al enviar la solicitud. Intenta de nuevo.');
      }
    });
  }
}