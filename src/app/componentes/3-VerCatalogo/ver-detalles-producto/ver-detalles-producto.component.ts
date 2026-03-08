import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, ShoppingCart, Heart, AlertCircle } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';
import { AppComponent } from '../../../app.component';
import { Carrito } from '../../../servicio/Clases/Carrito';
import { Resena } from '../../../servicio/Clases/Resena';
import { environment } from '../../../../environments/environment';

/** Componente que muestra el detalle de un producto con resenas, productos relacionados y gestion de carrito. */
@Component({
  selector: 'app-ver-detalles-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './ver-detalles-producto.component.html',
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
export class VerDetallesProductoComponent implements OnInit, OnDestroy {

  /** Icono de carrito de compras. */
  readonly ShoppingCart = ShoppingCart;

  /** Icono de corazon para la lista de deseos. */
  readonly Heart = Heart;

  /** Icono de alerta para estados de error o advertencia. */
  readonly AlertCircle = AlertCircle;

  /** Datos del producto activo obtenidos desde el backend. */
  producto: any = null;

  /** Lista de productos relacionados al producto activo. */
  relacionados: any[] = [];

  /** Lista de resenas asociadas al producto activo. */
  resenas: any[] = [];

  /** URL base de la API para construir rutas de imagenes. */
  readonly URL = environment.fotosUrl;

  /** Controla si la seccion de resenas es visible en el template. */
  mostrarResenas = false;

  /** Indica si el usuario tiene derecho a publicar una resena del producto. */
  poderResenar = false;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /** ID del producto obtenido desde el parametro de ruta. */
  private idProducto = '';

  /** Suscripcion a los parametros de la ruta activa. */
  private routeSub!: Subscription;

  /** Formulario reactivo para capturar el comentario y calificacion de una resena. */
  readonly formularioResena = new FormGroup({
    Comentario:   new FormControl('', [Validators.required, Validators.maxLength(255)]),
    Calificacion: new FormControl('', Validators.required)
  });

  /**
   * @param crudService Servicio para operaciones con la API.
   * @param route       Servicio para leer los parametros de la ruta activa.
   * @param router      Servicio de navegacion entre rutas.
   * @param global      Servicio de estado global de sesion del usuario.
   * @param padre       Referencia al componente raiz para controlar modales globales.
   */
  constructor(
    private readonly crudService: CrudService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly global: GlobalService,
    private readonly padre: AppComponent
  ) { }

  /** Obtiene el ID del producto desde la ruta y dispara la carga inicial de datos. */
  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.idProducto = params.get('id') ?? '';
      this.cargarTodo();
    });
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

  /** Dispara en paralelo la carga del producto, relacionados, resenas y derecho de resena. */
  private cargarTodo(): void {
    this.cargarProducto();
    this.cargarRelacionados();
    this.cargarResenas();
    this.verificarDerechoResena();
  }

  /** Consulta el producto por ID y redirige al catalogo si no existe o hay un error. */
  private cargarProducto(): void {
    this.crudService.RevisarProducto(+this.idProducto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        if (!res) {
          toast.error('No existe este producto.');
          this.irACatalogo();
          return;
        }
        this.producto = Array.isArray(res) ? res[0] : res;
      },
      error: () => {
        toast.error('Error al obtener el producto.');
        this.irACatalogo();
      }
    });
  }

  /** Carga los productos relacionados al producto activo. */
  private cargarRelacionados(): void {
    this.crudService.obtenerRelacionados(+this.idProducto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => this.relacionados = res ?? [],
      error: () => this.relacionados = []
    });
  }

  /** Carga las resenas del producto y controla su visibilidad en el template. */
  private cargarResenas(): void {
    this.crudService.RevisarResena(this.idProducto).pipe(
      takeUntil(this.destroy$)
    ).subscribe(res => {
      if (res.success !== 0) {
        this.resenas        = res;
        this.mostrarResenas = true;
      } else {
        this.resenas        = [];
        this.mostrarResenas = false;
      }
    });
  }

  /** Verifica si el usuario autenticado tiene derecho a publicar una resena del producto. */
  private verificarDerechoResena(): void {
    if (!this.correo) {
      this.poderResenar = false;
      return;
    }
    const payload: Carrito = { email: this.correo, idProducto: this.idProducto };
    this.crudService.Derecho(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.poderResenar = res.success === 1;
    });
  }

  /** Agrega el producto activo al carrito del usuario autenticado. */
  agregarAlCarrito(): void {
    if (!this.verificarSesion()) return;

    const payload: Carrito = { email: this.correo, idProducto: this.idProducto };

    this.crudService.AgregarCarrito(payload).subscribe({
      next: (res: any) => res.success === 1
        ? toast.info('Producto agregado al carrito.')
        : toast.error('Valor fuera de stock.'),
      error: () => toast.error('Error al agregar al carrito.')
    });
  }

  /** Agrega el producto activo a la lista de deseos del usuario autenticado. */
  agregarAListaDeseos(): void {
    if (!this.verificarSesion()) return;

    const payload: Carrito = { email: this.correo, idProducto: this.idProducto };

    this.crudService.AgregarLista(payload).subscribe({
      next: (res: any) => res.success === 1
        ? toast.success('Agregado a lista de deseos.')
        : toast.error('Valor fuera de stock.'),
      error: () => toast.error('Error al agregar a la lista de deseos.')
    });
  }

  /** Valida el formulario y envia la resena del usuario al backend. */
  agregarResena(): void {
    if (!this.verificarSesion()) return;

    this.formularioResena.markAllAsTouched();
    if (this.formularioResena.invalid) {
      toast.error('Completa correctamente todos los campos.');
      return;
    }

    const resena: Resena = {
      Email:        this.correo,
      Comentario:   this.formularioResena.value.Comentario!,
      Calificacion: this.formularioResena.value.Calificacion!,
      producto:     this.idProducto
    };

    this.crudService.MeterResena(resena).subscribe({
      next: () => {
        toast.success('Resena enviada correctamente.');
        this.formularioResena.reset();
        this.cargarResenas();
        this.verificarDerechoResena();
      },
      error: () => toast.error('Error al enviar la resena.')
    });
  }

  /** Navega hacia la vista de detalle del producto indicado. */
  navegarAProducto(productId: string): void {
    this.router.navigate(['/Producto/', productId]);
  }

  /** Redirige al usuario hacia la vista del catalogo de productos. */
  irACatalogo(): void {
    this.router.navigate(['Catalogo']);
  }

  /** Redirige al usuario hacia la vista de login. */
  irALogin(): void {
    this.router.navigate(['Login']);
  }

  /** Abre el modal global del componente raiz con el contenido indicado. */
  abrirModal(cadena: string, razon: string): void {
    this.padre.openModal(cadena, razon);
  }

  /** Reemplaza la imagen del producto por el avatar por defecto si ocurre un error de carga. */
  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = './assets/users/LNathan.png';
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
}