import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { LucideAngularModule, PackageSearch, RotateCcw, AlertCircle, CheckCircle } from 'lucide-angular';
import { CorreoDevolucion } from '../../../servicio/Clases/CorreoDevolucion';
import { toast } from 'ngx-sonner';
import { NgxSonnerToaster } from 'ngx-sonner';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';
import { environment } from '../../../../environments/environment';
import { Rembolso } from '../../../servicio/Clases/Rembolso';

/** Componente que permite al usuario solicitar la devolucion de productos de sus compras. */
@Component({
  selector: 'app-realizar-devolucion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    NgxSonnerToaster,
  ],
  templateUrl: './realizar-devolucion.component.html',
  styleUrls: ['../../../../styles.css', './realizar-devolucion.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('700ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RealizarDevolucionComponent implements OnInit, OnDestroy {

  /** Icono de busqueda de paquete para el estado de carga. */
  readonly PackageSearch = PackageSearch;

  /** Icono de flecha circular para representar devoluciones. */
  readonly RotateCcw = RotateCcw;

  /** Icono de alerta para estados de error o advertencia. */
  readonly AlertCircle = AlertCircle;

  /** Icono de confirmacion para estados exitosos. */
  readonly CheckCircle = CheckCircle;

  /** URL base de la API para construir rutas de imagenes. */
  readonly URL = environment.fotosUrl;

  /** Nombre del producto actualmente seleccionado para devolucion. */
  Texto: string = ' ';

  /** Correo electronico del usuario autenticado. */
  correo: string = '';

  /** Apodo del usuario autenticado. */
  Apodito: string = '';

  /** Controla si el formulario de solicitud de devolucion es visible. */
  Mostrar: boolean = false;

  /** Indica si hay productos disponibles para mostrar en la vista. */
  HayAlgoQue: boolean = false;

  /** Lista de productos que ya tienen una solicitud de devolucion activa. */
  productosConDevolucion: any[] = [];

  /** Lista de productos elegibles para solicitar devolucion. */
  productosSinDevolucion: any[] = [];

  /** Cantidad de productos visibles por pagina en ambas listas. */
  readonly itemsPorPagina = 3;

  /** Pagina activa en la lista de productos con devolucion. */
  paginaActualCon = 1;

  /** Pagina activa en la lista de productos sin devolucion. */
  paginaActualSin = 1;

  /** Retorna el total de paginas para la lista de productos con devolucion. */
  get totalPaginasCon(): number {
    return Math.ceil(this.productosConDevolucion.length / this.itemsPorPagina);
  }

  /** Retorna el total de paginas para la lista de productos sin devolucion. */
  get totalPaginasSin(): number {
    return Math.ceil(this.productosSinDevolucion.length / this.itemsPorPagina);
  }

  /** Retorna el subconjunto de productos con devolucion correspondiente a la pagina activa. */
  get paginaConDevolucion(): any[] {
    const start = (this.paginaActualCon - 1) * this.itemsPorPagina;
    return this.productosConDevolucion.slice(start, start + this.itemsPorPagina);
  }

  /** Retorna el subconjunto de productos sin devolucion correspondiente a la pagina activa. */
  get paginaSinDevolucion(): any[] {
    const start = (this.paginaActualSin - 1) * this.itemsPorPagina;
    return this.productosSinDevolucion.slice(start, start + this.itemsPorPagina);
  }

  /** Retrocede una pagina en la lista de productos con devolucion. */
  paginaAnteriorCon(): void { if (this.paginaActualCon > 1) this.paginaActualCon--; }

  /** Avanza una pagina en la lista de productos con devolucion. */
  paginaSiguienteCon(): void { if (this.paginaActualCon < this.totalPaginasCon) this.paginaActualCon++; }

  /** Retrocede una pagina en la lista de productos sin devolucion. */
  paginaAnteriorSin(): void { if (this.paginaActualSin > 1) this.paginaActualSin--; }

  /** Avanza una pagina en la lista de productos sin devolucion. */
  paginaSiguienteSin(): void { if (this.paginaActualSin < this.totalPaginasSin) this.paginaActualSin++; }

  /** ID del producto seleccionado para la solicitud activa. */
  private idProducto: number = 0;

  /** ID de la transaccion asociada al producto seleccionado. */
  private idTransaccion: number = 0;

  /** ID de la compra asociada al producto seleccionado. */
  private idCompra: number = 0;

  /** Monto del producto seleccionado para calcular el reembolso. */
  private monto: number = 0;

  /** Formulario reactivo con los datos necesarios para registrar la solicitud de devolucion. */
  readonly formularioDevolucion = new FormGroup({
    idProducto:    new FormControl(''),
    idTransaccion: new FormControl(''),
    idCompra:      new FormControl(''),
    monto:         new FormControl(''),
    razon:         new FormControl('', [Validators.required, Validators.maxLength(255)]),
    correo:        new FormControl('')
  });

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param crudService   Servicio para operaciones con la API.
   * @param router        Servicio de navegacion entre rutas.
   * @param globalService Servicio de estado global de sesion del usuario.
   */
  constructor(
    private readonly crudService:   CrudService,
    private readonly router:        Router,
    private readonly globalService: GlobalService
  ) { }

  /** Verifica la sesion activa y carga los productos del usuario clasificados por estado de devolucion. */
  ngOnInit(): void {
    const usuario = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['Login']);
      return;
    }

    this.correo  = usuario.email;
    this.Apodito = usuario.apodo;
    this.cargarProductos();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Almacena los datos del producto seleccionado y muestra el formulario de devolucion. */
  EnviarSolicitud(
    item: string,
    idTransaccion: number,
    idCompra: number,
    productId: number,
    total: number
  ): void {
    this.idProducto    = productId;
    this.idTransaccion = idTransaccion;
    this.idCompra      = idCompra;
    this.monto         = total;
    this.Mostrar       = true;
    this.Texto         = item;
  }

  /** Valida el formulario, registra la solicitud de devolucion y notifica al usuario por correo. */
  MostrarDatos(): void {
    const razon = this.formularioDevolucion.value.razon as string;

    if (!razon || razon.length >= 256) {
      toast.error('Ingresa un motivo valido (maximo 255 caracteres).');
      return;
    }

    if (!this.idProducto) {
      toast.error('Selecciona un producto antes de continuar.');
      return;
    }

    const payload: Rembolso = {
      idProducto:    String(this.idProducto),
      idTransaccion: String(this.idTransaccion),
      idCompra:      String(this.idCompra),
      correo:        this.correo,
      monto:         String(this.monto),
      razon:         razon
    };

    this.crudService.Rembolso(payload).pipe(
      switchMap((response: any) => {
        if (!response.success) {
          throw new Error('Ha ocurrido un error al procesar la solicitud.');
        }
        toast.success(`Solicitud enviada con ID ${response.success}`);

        const correoPayload: CorreoDevolucion = {
          Email:         this.correo,
          IdTransaccion: String(response.success)
        };

        return this.crudService.AvisarRembolso(correoPayload);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        toast.success('Tu solicitud esta siendo revisada. Revisa tu correo.');
        this.cargarProductos();
      },
      error: (err: Error) => {
        toast.error(err?.message || 'Error al enviar la solicitud. Intenta de nuevo.');
      }
    });
  }

  /** Consulta las compras del usuario y clasifica cada producto segun si ya tiene devolucion activa. */
  private cargarProductos(): void {
    this.productosConDevolucion = [];
    this.productosSinDevolucion = [];
    this.paginaActualCon        = 1;
    this.paginaActualSin        = 1;

    this.crudService.ObtenerCompras(this.correo).pipe(
      switchMap((respuesta: any[]) => {
        if (!respuesta?.length) return of([]);

        const peticiones = respuesta.map(producto =>
          this.crudService.VerCompras({
            idProducto:    producto.idProducto,
            idTransaccion: producto.idTransaccion,
            idCompra:      producto.idCompra
          }).pipe(
            map(resultado => ({ producto, resultado }))
          )
        );

        return forkJoin(peticiones);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resultados: any[]) => {
        this.HayAlgoQue = resultados.length > 0;

        resultados.forEach(({ producto, resultado }) => {
          if (resultado === 1) {
            this.productosConDevolucion.push(producto);
          } else {
            this.productosSinDevolucion.push(producto);
          }
        });
      },
      error: () => {
        toast.error('Error al cargar los productos. Intenta de nuevo.');
      }
    });
  }
}