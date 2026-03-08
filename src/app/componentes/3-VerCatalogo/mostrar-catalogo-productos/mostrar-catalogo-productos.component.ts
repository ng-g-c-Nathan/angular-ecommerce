import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { Observable } from 'rxjs';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { environment } from '../../../../environments/environment';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, switchMap, forkJoin, takeUntil } from 'rxjs';
import { Carrito } from '../../../servicio/Clases/Carrito';

/** Componente que muestra el catalogo de productos con filtros, busqueda y gestion de carrito. */
@Component({
  selector: 'app-mostrar-catalogo-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    FlexLayoutModule
  ],
  templateUrl: './mostrar-catalogo-productos.component.html',
  styleUrls: [
    '../../../../styles.css',
    './mostrar-catalogo-productos.component.css'
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('700ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class MostrarCatalogoProductosComponent implements OnInit, OnDestroy {

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /** Productos agrupados por categoria para la vista de categorias. */
  productosPorCategoria: Record<string, any[]> = {};

  /** Lista de productos del catalogo activo. */
  productos: any[] = [];

  /** Lista de productos obtenidos mediante busqueda semantica VSM. */
  productosVSM: any[] = [];

  /** Lista de categorias disponibles en el catalogo. */
  categorias: any[] = [];

  /** URL base de la API para construir rutas de imagenes. */
  readonly URL = environment.fotosUrl;

  /** Controla si se muestra la vista de categorias. */
  mostrarCategorias = false;

  /** Controla si se muestra la vista de ofertas. */
  mostrarOfertas = false;

  /** Indica si el resultado actual proviene de una busqueda VSM. */
  busquedaConVSM = false;

  /** Etiqueta descriptiva del filtro o vista activa. */
  nombreAccion = '';

  /** Formulario reactivo para la busqueda de productos por palabra clave. */
  readonly formBusqueda = new FormGroup({
    IDCOMMUN: new FormControl('')
  });

  /** Formulario interno para construir el payload de agregar al carrito. */
  private readonly formCarrito = new FormGroup({
    email: new FormControl(''),
    idProducto: new FormControl('')
  });

  /**
   * @param crudService Servicio para operaciones con la API.
   * @param router      Servicio de navegacion entre rutas.
   * @param global      Servicio de estado global de sesion del usuario.
   */
  constructor(
    private readonly crudService: CrudService,
    private readonly router: Router,
    private readonly global: GlobalService
  ) { }

  /** Carga el catalogo general al inicializar el componente. */
  ngOnInit(): void {
    this.nombreAccion = 'Catalogo general';
    this.verCatalogoNormal();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Retorna el correo del usuario autenticado o una cadena vacia si no hay sesion. */
  private get correo(): string {
    return this.global.getUsuario()?.email ?? '';
  }

  /** Agrega un producto al carrito del usuario autenticado. */
  agregarAlCarrito(idProducto: string): void {
    if (!this.verificarSesion()) return;

    const payload: Carrito = { email: this.correo, idProducto };

    this.crudService.AgregarCarrito(payload).subscribe({
      next: (res: any) => {
        res.success === 1
          ? toast.info('Producto agregado al carrito.')
          : toast.error('Valor fuera de stock.');
      },
      error: () => toast.error('Error al agregar al carrito.')
    });
  }

  /** Agrega un producto a la lista de deseos del usuario autenticado. */
  agregarAListaDeseos(idProducto: string): void {
    if (!this.verificarSesion()) return;

    const payload: Carrito = { email: this.correo, idProducto };

    this.crudService.AgregarLista(payload).subscribe({
      next: (res: any) => {
        res.success === 1
          ? toast.success('Producto agregado a la lista de deseos.')
          : toast.error('Valor fuera de stock.');
      },
      error: () => toast.error('Error al agregar a la lista de deseos.')
    });
  }

  /** Navega hacia la vista de detalle del producto indicado. */
  verDetalleProducto(productId: string): void {
    this.router.navigate(['/Producto/', productId]);
  }

  /** Redirige al usuario hacia la vista de login. */
  irALogin(): void {
    this.router.navigate(['Login']);
  }

  /** Restablece los filtros y carga el catalogo general. */
  catalogoNormal(): void {
    this.busquedaConVSM    = false;
    this.mostrarCategorias = false;
    this.mostrarOfertas    = false;
    this.nombreAccion      = 'Catálogo general';
    this.verCatalogoNormal();
  }

  /** Activa la vista de categorias y dispara la carga de sus productos. */
  catalogoEspecial(): void {
    this.mostrarOfertas    = false;
    this.mostrarCategorias = true;
    this.cargarCategorias();
  }

  /** Carga y muestra los diez productos mas vendidos. */
  obtenerMasVendidos(): void {
    this.resetFlags('Top diez');
    this.crudService.TopDiez().subscribe(res => this.productos = res);
  }

  /** Carga y muestra los productos ordenados de mayor a menor precio. */
  obtenerMasCaros(): void {
    this.resetFlags('Mas Caros');
    this.crudService.Caro().subscribe(res => this.productos = res);
  }

  /** Carga y muestra los productos ordenados de menor a mayor precio. */
  obtenerMasBaratos(): void {
    this.resetFlags('Mas Baratos');
    this.crudService.Barato().subscribe(res => this.productos = res);
  }


  /** Ejecuta una busqueda semantica VSM con el termino ingresado en el formulario. */
  buscarPorPalabra(): void {
    const termino          = this.formBusqueda.value.IDCOMMUN ?? '';
    this.nombreAccion      = `Busqueda de '${termino}'`;
    this.mostrarCategorias = false;
    this.mostrarOfertas    = false;
    this.busquedaConVSM    = true;

    this.crudService.VSM(termino).subscribe({
      next: (res: any) => this.productosVSM = res,
      error: () => this.productosVSM = []
    });
  }

  /** Consulta el catalogo general desde el backend y actualiza la lista de productos. */
  private verCatalogoNormal(): void {
    this.crudService.ObtenerProductos().subscribe(res => this.productos = res);
  }

  /** Consulta las categorias y carga sus productos en paralelo usando forkJoin. */
  private cargarCategorias(): void {
    this.crudService.ConsultarCategorias().pipe(
      switchMap((categorias: any[]) => {
        this.categorias = categorias;

        const peticiones: Record<string, Observable<any[]>> = Object.fromEntries(
          categorias.map(cat => [
            cat,
            this.crudService.ProductosXCategoria(cat.toString())
          ])
        );

        return forkJoin(peticiones);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resultado: Record<string, any[]>) => {
        this.productosPorCategoria = resultado;
      },
      error: () => toast.error('Error al cargar categorias.')
    });
  }

  /** Verifica que haya una sesion activa y muestra un toast con acceso al login si no la hay. */
  private verificarSesion(): boolean {
    if (!this.correo) {
      toast.error('Necesitas iniciar sesion para continuar.', {
        action: {
          label: 'Ir al login',
          onClick: () => this.irALogin()
        }
      });
      return false;
    }
    return true;
  }

  /** Resetea los flags de vista y actualiza la etiqueta de la accion activa. */
  private resetFlags(accion: string): void {
    this.mostrarCategorias = false;
    this.mostrarOfertas    = false;
    this.busquedaConVSM    = false;
    this.nombreAccion      = accion;
  }
}