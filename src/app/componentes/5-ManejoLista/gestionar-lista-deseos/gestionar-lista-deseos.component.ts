import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, LucideIconData, BookmarkX, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-angular';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';
import { AppComponent } from '../../../app.component';
import { environment } from '../../../../environments/environment';
import { Subject, switchMap, takeUntil } from 'rxjs';

/** Componente que gestiona la lista de deseos del usuario con control de cantidades, eliminacion y paginacion. */
@Component({
  selector: 'app-gestionar-lista-deseos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './gestionar-lista-deseos.component.html',
  styleUrls: [
    '../../../../styles.css',
    './gestionar-lista-deseos.component.css'
  ]
})
export class GestionarListaDeseosComponent implements OnInit, OnDestroy {

  /** Icono para eliminar un producto de la lista de deseos. */
  readonly BookmarkX: LucideIconData = BookmarkX;

  /** Icono de carrito para mover productos al carrito de compras. */
  readonly ShoppingCart: LucideIconData = ShoppingCart;

  /** Icono de flecha izquierda para la paginacion. */
  readonly ChevronLeft: LucideIconData = ChevronLeft;

  /** Icono de flecha derecha para la paginacion. */
  readonly ChevronRight: LucideIconData = ChevronRight;

  /** URL base de la API para construir rutas de imagenes. */
  readonly URL = environment.fotosUrl;

  /** Lista de productos guardados en la lista de deseos del usuario. */
  productos: any[] = [];

  /** Suma total del precio de todos los productos en la lista. */
  totalCarrito: number = 0;

  /** Indica si la lista de deseos contiene al menos un producto. */
  hayProductos: boolean = false;

  /** Almacena el valor previo de cantidad antes de una edicion manual. */
  valorAnterior: number = 0;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /** Bloquea operaciones concurrentes de actualizacion de cantidad. */
  private bloqueado = false;

  /** Numero de la pagina activa en la paginacion de la lista. */
  paginaActual: number = 1;

  /** Cantidad de productos visibles por pagina. */
  itemsPorPagina: number = 2;

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

  /** Verifica la sesion activa y carga la lista de deseos del usuario. */
  ngOnInit(): void {
    if (!this.correo) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['Login']);
      return;
    }
    this.cargarLista();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Consulta la lista de deseos del usuario en el backend y mapea cada producto con su formulario de cantidad. */
  private cargarLista(): void {
    this.crudService.RevisarLista(this.correo).pipe(
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

  /** Recalcula el total de la lista sumando precio por cantidad de cada producto. */
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
      this.confirmarAccion(
        'Eliminar este producto de tu lista de deseos?',
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

    this.bloqueado   = true;
    const nuevoValor = (event.target as HTMLInputElement).value;
    const numero     = Number(nuevoValor);

    if (isNaN(numero) || numero < 0) {
      producto.form.get('cantidad')!.setValue(this.valorAnterior);
      this.recalcularTotal();
      this.bloqueado = false;
      return;
    }

    if (numero === 0) {
      this.confirmarAccion(
        'Eliminar este producto de tu lista de deseos?',
        () => this.eliminarProducto(producto.id, index),
        () => {
          producto.form.get('cantidad')!.setValue(this.valorAnterior);
          this.recalcularTotal();
        }
      );
      this.bloqueado = false;
      return;
    }

    const payload = {
      email:      this.correo,
      producto:   producto.id,
      valorNuevo: nuevoValor
    };

    this.crudService.ActualizarLista(payload).pipe(
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

  /** Muestra un toast de confirmacion con acciones de confirmar o cancelar antes de ejecutar la accion. */
  private confirmarAccion(
    mensaje: string,
    onConfirm: () => void,
    onCancel: () => void
  ): void {
    toast(mensaje, {
      action: {
        label: 'Confirmar',
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
    const payload = {
      email:      this.correo,
      producto:   producto.id,
      valorNuevo: String(nuevaCantidad)
    };

    this.crudService.ActualizarLista(payload).pipe(
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
        toast.error('Error al actualizar la lista.');
        this.recalcularTotal();
        this.bloqueado = false;
      }
    });
  }

  /** Solicita confirmacion y elimina el producto de la lista de deseos al confirmar. */
  borrarDeLaLista(idProducto: string, index: number): void {
    this.confirmarAccion(
      'Eliminar este producto de tu lista de deseos?',
      () => this.eliminarProducto(idProducto, index),
      () => { }
    );
  }

  /** Elimina el producto de la lista en el backend y actualiza la lista local. */
  private eliminarProducto(idProducto: string, index: number): void {
    const payload = { email: this.correo, idProducto };

    this.crudService.BorrarLista(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.productos.splice(index, 1);
        this.hayProductos = this.productos.length > 0;
        if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
        this.recalcularTotal();
        toast.success('Producto eliminado de la lista de deseos.');
      },
      error: () => toast.error('Error al eliminar el producto.')
    });
  }

  /** Solicita confirmacion y mueve el producto al carrito de compras al confirmar. */
  moverAlCarrito(idProducto: string, index: number): void {
    if (!this.correo) return;

    this.confirmarAccion(
      'Mover este producto a tu carrito de compras?',
      () => this.ejecutarMoverAlCarrito(idProducto, index),
      () => { }
    );
  }

  /** Agrega el producto al carrito y lo elimina de la lista de deseos en el backend. */
  private ejecutarMoverAlCarrito(idProducto: string, index: number): void {
    const producto = this.productos[index];
    const cantidad = producto.form.get('cantidad')!.value;

    const payloadCarrito = {
      email:      this.correo,
      idProducto: producto.id,
      cantidad
    };
    const payloadBorrar = {
      email: this.correo,
      idProducto
    };

    this.crudService.PasarCarrito(payloadCarrito).pipe(
      switchMap((res: any) => {
        if (res.success !== 1) throw new Error('No se pudo mover el producto al carrito.');
        return this.crudService.BorrarLista(payloadBorrar);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.productos.splice(index, 1);
        this.hayProductos = this.productos.length > 0;
        if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
        this.recalcularTotal();
        toast.success('Producto movido al carrito de compras.');
      },
      error: (err: Error) => toast.error(err.message || 'Error al mover al carrito.')
    });
  }

  /** Abre el modal global del componente raiz con el contenido indicado. */
  abrirModal(cadena: string, razon: string): void {
    this.padre.openModal(cadena, razon);
  }
}