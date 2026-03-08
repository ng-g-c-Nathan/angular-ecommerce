import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, LucideIconData, Trash2, BookmarkPlus, CreditCard, ChevronLeft, ChevronRight } from 'lucide-angular';
import { Carrito } from '../../../servicio/Clases/Carrito';
import { CarritoPasar } from '../../../servicio/Clases/CarritoPasar';
import { NuevoCarrito } from '../../../servicio/Clases/CarritoNuevo';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';
import { AppComponent } from '../../../app.component';
import { environment } from '../../../../environments/environment';
import { Subject, switchMap, takeUntil } from 'rxjs';

/** Componente que gestiona el carrito de compras del usuario con control de cantidades, eliminacion y paginacion. */
@Component({
  selector: 'app-gestionar-carrito-compras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './gestionar-carrito-compras.component.html',
  styleUrls: [
    '../../../../styles.css',
    './gestionar-carrito-compras.component.css'
  ]
})
export class GestionarCarritoComprasComponent implements OnInit, OnDestroy {

  /** Icono de papelera para eliminar productos del carrito. */
  readonly Trash2: LucideIconData = Trash2;

  /** Icono para mover productos a la lista de deseos. */
  readonly BookmarkPlus: LucideIconData = BookmarkPlus;

  /** Icono de tarjeta de credito para proceder al pago. */
  readonly CreditCard: LucideIconData = CreditCard;

  /** Icono de flecha izquierda para la paginacion. */
  readonly ChevronLeft: LucideIconData = ChevronLeft;

  /** Icono de flecha derecha para la paginacion. */
  readonly ChevronRight: LucideIconData = ChevronRight;

  /** URL base de la API para construir rutas de imagenes. */
  readonly URL = environment.fotosUrl;

  /** Lista de productos en el carrito del usuario. */
  productos: any[] = [];

  /** Suma total del precio de todos los productos en el carrito. */
  totalCarrito: number = 0;

  /** Indica si el carrito contiene al menos un producto. */
  hayProductos: boolean = false;

  /** Almacena el valor previo de cantidad antes de una edicion manual. */
  valorAnterior: number = 0;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /** Bloquea operaciones concurrentes de actualizacion de cantidad. */
  private bloqueado = false;

  /** Numero de la pagina activa en la paginacion del carrito. */
  paginaActual: number = 1;

  /** Cantidad de productos visibles por pagina. */
  itemsPorPagina: number = 2;

  /** Opciones disponibles para la cantidad de items por pagina. */
  opcionesItemsPorPagina: number[] = [2, 5, 10, 20];

  /** Retorna el total de paginas calculado segun los productos y el limite por pagina. */
  get totalPaginas(): number {
    return Math.ceil(this.productos.length / this.itemsPorPagina) || 1;
  }

  /** Retorna el subconjunto de productos correspondiente a la pagina activa. */
  get productosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.productos.slice(inicio, inicio + this.itemsPorPagina);
  }

  /** Retorna un arreglo con los numeros de pagina disponibles. */
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /** Navega a la pagina indicada si esta dentro del rango valido. */
  irAPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p;
  }

  /** Reinicia la paginacion al cambiar la cantidad de items por pagina. */
  onItemsPorPaginaChange(): void {
    this.paginaActual = 1;
  }

  /**
   * @param crudService Servicio para operaciones con la API.
   * @param router      Servicio de navegacion entre rutas.
   * @param global      Servicio de estado global de sesion del usuario.
   * @param padre       Referencia al componente raiz para controlar modales globales.
   */
  constructor(
    private readonly crudService: CrudService,
    private readonly router: Router,
    private readonly global: GlobalService,
    private readonly padre: AppComponent
  ) { }

  /** Retorna el correo del usuario autenticado o una cadena vacia si no hay sesion. */
  private get correo(): string {
    return this.global.getUsuario()?.email ?? '';
  }

  /** Retorna el apodo del usuario autenticado o su correo como fallback. */
  get apodito(): string {
    return this.global.getUsuario()?.apodo ?? this.correo;
  }

  /** Verifica la sesion activa y carga el carrito del usuario. */
  ngOnInit(): void {
    if (!this.correo) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['Login']);
      return;
    }
    this.cargarCarrito();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Consulta el carrito del usuario en el backend y mapea cada producto con su formulario de cantidad. */
  private cargarCarrito(): void {
    this.crudService.RevisarCarrito(this.correo).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res?.length > 0) {
          this.productos = res.map((p: any) => ({
            ...p,
            form: new FormGroup({ cantidad: new FormControl(p.cantidad) })
          }));
          this.hayProductos = true;
          this.recalcularTotal();
        } else {
          this.productos   = [];
          this.hayProductos = false;
        }
      },
      error: () => {
        this.productos   = [];
        this.hayProductos = false;
      }
    });
  }

  /** Recalcula el total del carrito sumando precio por cantidad de cada producto. */
  recalcularTotal(): void {
    this.totalCarrito = this.productos.reduce((total, p) => {
      return total + p.precio * +p.form.get('cantidad')!.value;
    }, 0);
  }

  /** Retorna el subtotal de un producto multiplicando su precio por la cantidad actual. */
  calcularTotal(producto: any): number {
    return producto.precio * +producto.form.get('cantidad')!.value;
  }

  /** Guarda el valor actual de cantidad antes de que el usuario lo edite manualmente. */
  guardarValorAnterior(event: Event): void {
    this.valorAnterior = +(event.target as HTMLInputElement).value;
  }

  /** Incrementa en uno la cantidad del producto y actualiza el backend. */
  aumentarCantidad(producto: any): void {
    if (this.bloqueado) return;
    this.bloqueado = true;

    const cantidad = +producto.form.get('cantidad')!.value;
    this.actualizarEnBackend(producto, cantidad + 1);
  }

  /** Reduce en uno la cantidad del producto o solicita confirmacion para eliminarlo si llega a cero. */
  disminuirCantidad(producto: any, index: number): void {
    if (this.bloqueado) return;
    this.bloqueado = true;

    const cantidad = +producto.form.get('cantidad')!.value;

    if (cantidad - 1 === 0) {
      this.confirmarEliminacion(
        'Eliminar este producto del carrito?',
        () => this.eliminarProducto(producto.id, index),
        () => {
          producto.form.get('cantidad')!.setValue(cantidad);
          this.recalcularTotal();
        }
      );
      this.bloqueado = false;
      return;
    }

    this.actualizarEnBackend(producto, cantidad - 1);
  }

  /** Valida y aplica el cambio manual de cantidad ingresado por el usuario en el input. */
  onCantidadChange(event: Event, producto: any, index: number): void {
    if (this.bloqueado) {
      producto.form.get('cantidad')!.setValue(this.valorAnterior);
      return;
    }

    this.bloqueado = true;
    const nuevoValor = (event.target as HTMLInputElement).value;
    const numero     = Number(nuevoValor);

    if (isNaN(numero) || numero < 0) {
      producto.form.get('cantidad')!.setValue(this.valorAnterior);
      this.recalcularTotal();
      this.bloqueado = false;
      return;
    }

    if (numero === 0) {
      this.confirmarEliminacion(
        'Eliminar este producto del carrito?',
        () => this.eliminarProducto(producto.id, index),
        () => {
          producto.form.get('cantidad')!.setValue(this.valorAnterior);
          this.recalcularTotal();
        }
      );
      this.bloqueado = false;
      return;
    }

    const payload: NuevoCarrito = {
      email:      this.correo,
      producto:   producto.id,
      valorNuevo: nuevoValor
    };

    this.crudService.ActualizarCarrito(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res.success === 1) {
          producto.form.get('cantidad')!.setValue(nuevoValor);
        } else {
          toast.error('Valor fuera de stock.');
          producto.form.get('cantidad')!.setValue(this.valorAnterior);
        }
        this.recalcularTotal();
        this.bloqueado = false;
      },
      error: () => {
        producto.form.get('cantidad')!.setValue(this.valorAnterior);
        this.recalcularTotal();
        this.bloqueado = false;
      }
    });
  }

  /** Muestra un toast de confirmacion con acciones de confirmar o cancelar antes de eliminar. */
  private confirmarEliminacion(
    mensaje: string,
    onConfirm: () => void,
    onCancel: () => void
  ): void {
    toast(mensaje, {
      action: {
        label: 'Eliminar',
        onClick: () => onConfirm()
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => onCancel()
      },
      duration: 6000
    });
  }

  /** Envia al backend la nueva cantidad de un producto y actualiza el formulario si es exitoso. */
  private actualizarEnBackend(producto: any, nuevaCantidad: number): void {
    const payload: NuevoCarrito = {
      email:      this.correo,
      producto:   producto.id,
      valorNuevo: String(nuevaCantidad)
    };

    this.crudService.ActualizarCarrito(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        if (res.success === 1) {
          producto.form.get('cantidad')!.setValue(nuevaCantidad);
        } else {
          toast.error('Valor fuera de stock.');
        }
        this.recalcularTotal();
        this.bloqueado = false;
      },
      error: () => {
        toast.error('Error al actualizar el carrito.');
        this.recalcularTotal();
        this.bloqueado = false;
      }
    });
  }

  /** Solicita confirmacion y elimina el producto del carrito al confirmar. */
  borrarDelCarrito(idProducto: string, index: number): void {
    this.confirmarEliminacion(
      'Eliminar este producto del carrito?',
      () => this.eliminarProducto(idProducto, index),
      () => { }
    );
  }

  /** Elimina el producto del carrito en el backend y actualiza la lista local. */
  private eliminarProducto(idProducto: string, index: number): void {
    const payload: Carrito = { email: this.correo, idProducto };

    this.crudService.BorrarCarrito(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.productos.splice(index, 1);
        this.hayProductos = this.productos.length > 0;
        if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
        this.recalcularTotal();
        toast.success('Producto eliminado del carrito.');
      },
      error: () => toast.error('Error al eliminar el producto.')
    });
  }

  /** Solicita confirmacion y mueve el producto a la lista de deseos al confirmar. */
  moverAListaDeseos(idProducto: string, index: number): void {
    if (!this.correo) return;

    this.confirmarEliminacion(
      'Mover este producto a tu lista de deseos?',
      () => this.ejecutarMoverALista(idProducto, index),
      () => { }
    );
  }

  /** Agrega el producto a la lista de deseos y lo elimina del carrito en el backend. */
  private ejecutarMoverALista(idProducto: string, index: number): void {
    const producto = this.productos[index];
    const cantidad = producto.form.get('cantidad')!.value;

    const payloadLista: CarritoPasar = {
      email:      this.correo,
      idProducto: producto.id,
      cantidad
    };
    const payloadBorrar: Carrito = {
      email: this.correo,
      idProducto
    };

    this.crudService.PasarLista(payloadLista).pipe(
      switchMap(() => this.crudService.BorrarCarrito(payloadBorrar)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.productos.splice(index, 1);
        this.hayProductos = this.productos.length > 0;
        if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
        this.recalcularTotal();
        toast.success('Producto movido a la lista de deseos.');
      },
      error: () => toast.error('Error al mover a lista de deseos.')
    });
  }

  /** Redirige al usuario hacia la vista de checkout con el correo en el estado de navegacion. */
  irAPagar(): void {
  if (environment.demo === 'SI') {
    toast.warning('Esta es una versión demo. El proceso de pago no está disponible.');
    return;
  }
  if (this.correo) {
    this.router.navigate(['Checkout'], { state: { email: this.correo } });
  }
}

  /** Abre el modal global del componente raiz con el contenido indicado. */
  abrirModal(cadena: string, razon: string): void {
    this.padre.openModal(cadena, razon);
  }
}