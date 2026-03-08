import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormsModule } from '@angular/forms';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { NgxPayPalModule } from 'ngx-paypal';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  LucideAngularModule,
  ShoppingCart, Trash2, Plus, Minus,
  CreditCard, PackageX, ChevronLeft, ChevronRight
} from 'lucide-angular';
import { toast } from 'ngx-sonner';
import { NgxSonnerToaster } from 'ngx-sonner';
import { GlobalService, Usuario } from '../../../servicio/global.service';

/** Componente que gestiona el proceso de compra con control de carrito, cantidades y pago via PayPal. */
@Component({
  selector: 'app-realizar-compra',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    ReactiveFormsModule,
    NgxPayPalModule,
    LucideAngularModule,
    NgxSonnerToaster,
  ],
  templateUrl: './realizar-compra.component.html',
  styleUrls: ['../../../../styles.css', './realizar-compra.component.css']
})
export class RealizarCompraComponent implements OnInit, OnDestroy {

  /** Icono de carrito de compras. */
  readonly ShoppingCart = ShoppingCart;

  /** Icono de papelera para eliminar productos. */
  readonly Trash2 = Trash2;

  /** Icono para incrementar cantidad. */
  readonly Plus = Plus;

  /** Icono para reducir cantidad. */
  readonly Minus = Minus;

  /** Icono de tarjeta de credito para el pago. */
  readonly CreditCard = CreditCard;

  /** Icono para el estado de carrito vacio. */
  readonly PackageX = PackageX;

  /** Icono de flecha izquierda para la paginacion. */
  readonly ChevronLeft = ChevronLeft;

  /** Icono de flecha derecha para la paginacion. */
  readonly ChevronRight = ChevronRight;

/** Almacena el valor previo de cantidad antes de una edicion manual. */
valorAnterior: number = 0;

/** Lista de productos en el carrito del usuario. */
ArregloDeProductos: any[] = [];

/** Correo electronico del usuario autenticado. */
correo: string = '';

/** Formulario interno para operaciones de carrito. */
formularioCarrito: FormGroup;

/** Arreglo de formularios reactivos por producto para control de cantidades. */
formArray: FormGroup[] = [];

/** Cantidad por defecto para nuevos productos. */
cantidad: number = 1;

/** Formulario reactivo auxiliar para control de cantidad individual. */
form: FormGroup;

/** Suma total del precio de todos los productos en el carrito. */
totalCarrito: number = 0;

/** Cantidad actualizada al modificar un producto. */
cantidadUpDate: number = 1;

/** Formulario reactivo con los datos requeridos para procesar el pago. */
FormPagos: FormGroup;

/** Precio total de la compra. Se mantiene en -1 hasta que los productos sean cargados. */
preciototal: number = -1;

/** Controla si las operaciones de carrito estan habilitadas. */
ManejarCarrito: boolean = true;

/** Indica si hay productos en el carrito para calcular el total. */
HayAlgoQueCalcular: boolean = true;

/** Apodo del usuario autenticado. */
Apodito: string | undefined;

/** Objeto completo del usuario autenticado obtenido desde GlobalService. */
usuarioActual: Usuario | null = null;

  /** Controla si el boton de PayPal es visible en el template. */
  public showPayPalButton = false;

  /** Configuracion de la integracion con PayPal. */
  public payPalConfig ?: IPayPalConfig;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /** Referencia al timeout de debounce para la reinicializacion del boton de PayPal. */
  private paypalDebounce: ReturnType<typeof setTimeout> | null = null;

/** Numero de la pagina activa en la paginacion del carrito. */
paginaActual: number = 1;

/** Cantidad de productos visibles por pagina. */
itemsPorPagina: number = 1;

  /** Retorna el total de paginas calculado segun los productos y el limite por pagina. */
  get totalPaginas(): number {
  return Math.ceil(this.ArregloDeProductos.length / this.itemsPorPagina) || 1;
}

  /** Retorna un arreglo con los numeros de pagina disponibles. */
  get paginas(): number[] {
  return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
}

  /** Retorna el subconjunto de productos correspondiente a la pagina activa. */
  get productosPaginados(): any[] {
  const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
  return this.ArregloDeProductos.slice(inicio, inicio + this.itemsPorPagina);
}

/**
 * @param crudService   Servicio para operaciones con la API.
 * @param route         Servicio para leer los parametros de la ruta activa.
 * @param router        Servicio de navegacion entre rutas.
 * @param globalService Servicio de estado global de sesion del usuario.
 */
constructor(
  private crudService: CrudService,
  private route: ActivatedRoute,
  private router: Router,
  private globalService: GlobalService,
) {
  
  this.formularioCarrito = new FormGroup({
    Email: new FormControl(''),
    IdProducto: new FormControl(''),
    cantidad: new FormControl('')
  });

  this.FormPagos = new FormGroup({
    email: new FormControl('', Validators.required),
    forma_pago: new FormControl('', Validators.required),
    total: new FormControl('', Validators.required),
    correoPaypal: new FormControl('', Validators.required),
    direccionClientePaypal: new FormControl('', Validators.required),
    idPaypal: new FormControl('', Validators.required),
    clientePaypal: new FormControl('', Validators.required)
  });

  this.form = new FormGroup({
    cantidad: new FormControl(1)
  });
}

/** Suscribe al usuario autenticado y carga los productos del carrito. Redirige al login si no hay sesion. */
ngOnInit(): void {
  this.globalService.usuario$
    .pipe(takeUntil(this.destroy$))
    .subscribe(usuario => {
      if (!usuario) {
        toast.error('Inicia sesion para disfrutar este servicio');
        this.router.navigate(['Login']);
        return;
      }
      if (environment.demo === 'SI') {
        toast.warning('Esta es una versión demo. El proceso de pago no está disponible.');
        this.router.navigate(['Inicio']);
        return;
      }
      this.usuarioActual = usuario;
      this.correo = usuario.email;
      this.Apodito = usuario.apodo || usuario.email;

      this.obtenerProductosEnCarrito();
    });
}

/** Cancela todas las suscripciones y limpia el debounce de PayPal. */
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  if(this.paypalDebounce) clearTimeout(this.paypalDebounce);
}

/** Redirige al usuario hacia la vista de login. */
IrHaciaLogin(): void {
  this.router.navigate(['Login']);
}

/** Redirige al usuario hacia el catalogo de productos. */
ToCatalogo(): void {
  this.router.navigate(['Catalogo'], { state: { email: this.correo || '' } });
}

/** Navega a la pagina indicada si esta dentro del rango valido. */
irAPagina(pagina: number): void {
  if(pagina < 1 || pagina > this.totalPaginas) return;
this.paginaActual = pagina;
  }

/** Reinicia la paginacion al cambiar la cantidad de items por pagina. */
onItemsPorPaginaChange(): void {
  this.paginaActual = 1;
}

/** Consulta el carrito del usuario en el backend y mapea cada producto con su formulario de cantidad. */
obtenerProductosEnCarrito(): void {
  this.crudService.RevisarCarrito(this.correo).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: (respuesta: any) => {
      if (respuesta && respuesta.length > 0) {
        this.ArregloDeProductos = respuesta;
        this.ArregloDeProductos.forEach(producto => {
          producto.form = new FormGroup({
            cantidad: new FormControl(producto.cantidad)
          });
        });
        this.recalcularYActualizarPayPal();
      } else {
        this.ArregloDeProductos = [];
        this.HayAlgoQueCalcular = false;
      }
    },
    error: () => {
      this.ArregloDeProductos = [];
      this.HayAlgoQueCalcular = false;
    }
  });
}

/** Recalcula el total del carrito sumando precio por cantidad de cada producto. */
calcularTotalCarrito(): void {
  if(!this.HayAlgoQueCalcular) return;
  this.totalCarrito = this.ArregloDeProductos.reduce((total, producto) => {
    return total + (producto.precio * producto.form.get('cantidad').value);
  }, 0);
  this.preciototal = this.totalCarrito;
}

/** Recalcula el total y reinicializa el boton de PayPal con debounce para evitar renders repetidos. */
recalcularYActualizarPayPal(): void {
  this.calcularTotalCarrito();
  if(this.paypalDebounce) clearTimeout(this.paypalDebounce);
  this.paypalDebounce = setTimeout(() => {
    this.showPayPalButton = false;
    setTimeout(() => {
      this.initConfig();
      this.showPayPalButton = true;
    }, 50);
  }, 600);
}

/** Retorna el subtotal de un producto multiplicando su precio por la cantidad actual. */
calcularTotal(producto: any): number {
  return producto.precio * producto.form.get('cantidad').value;
}

/** Guarda el valor actual de cantidad antes de que el usuario lo edite manualmente. */
guardarValorAnterior(event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  this.valorAnterior = +inputElement.value;
}

/** Valida y aplica el cambio manual de cantidad ingresado por el usuario en el input. */
oncantidadChange(event: Event, producto: any, iControl: any): void {
  if(!this.ManejarCarrito) {
  producto.form.get('cantidad').setValue(this.valorAnterior);
  return;
}

this.ManejarCarrito = false;
const inputElement = event.target as HTMLInputElement;
const nuevoValor = inputElement.value;

if (isNaN(Number(nuevoValor)) || Number(nuevoValor) < 0) {
  producto.form.get('cantidad').setValue(this.valorAnterior);
  this.calcularTotalCarrito();
  this.ManejarCarrito = true;
  return;
}

if (Number(nuevoValor) === 0) {
  toast('Eliminar este producto del carrito?', {
    action: {
      label: 'Eliminar',
      onClick: () => this.BorrarDeMiCarrito(producto.id, iControl)
    },
    cancel: {
      label: 'Cancelar',
      onClick: () => {
        producto.form.get('cantidad').setValue(this.valorAnterior);
        this.calcularTotalCarrito();
      }
    },
    duration: 6000
  });
  this.ManejarCarrito = true;
  return;
}

const payload = { email: this.correo, producto: producto.id, valorNuevo: nuevoValor };

this.crudService.ActualizarCarrito(payload).pipe(
  takeUntil(this.destroy$)
).subscribe({
  next: (respuesta: any) => {
    if (respuesta.success === 1) {
      producto.form.get('cantidad').setValue(nuevoValor);
      this.recalcularYActualizarPayPal();
    } else {
      toast.error('Valor fuera de stock');
      producto.form.get('cantidad').setValue(this.valorAnterior);
      this.calcularTotalCarrito();
    }
    this.ManejarCarrito = true;
  },
  error: () => {
    producto.form.get('cantidad').setValue(this.valorAnterior);
    this.calcularTotalCarrito();
    this.ManejarCarrito = true;
  }
});
  }

/** Incrementa en uno la cantidad del producto y envia la actualizacion al backend. */
Aumentarcantidad(producto: any): void {
  if(!this.ManejarCarrito) return;
  this.ManejarCarrito = false;
  const cantidad = +producto.form.get('cantidad').value;
  this.actualizarCarrito(producto.id, cantidad + 1, producto);
}

/** Reduce en uno la cantidad del producto o solicita confirmacion para eliminarlo si llega a cero. */
Disminuircantidad(producto: any, iControl: any): void {
  if(!this.ManejarCarrito) return;
  this.ManejarCarrito = false;
  const cantidad = +producto.form.get('cantidad').value;

  if(cantidad - 1 === 0) {
  toast('Eliminar este producto del carrito?', {
    action: {
      label: 'Eliminar',
      onClick: () => this.BorrarDeMiCarrito(producto.id, iControl)
    },
    cancel: {
      label: 'Cancelar',
      onClick: () => {
        producto.form.get('cantidad').setValue(cantidad);
        this.calcularTotalCarrito();
      }
    },
    duration: 6000
  });
  this.ManejarCarrito = true;
  return;
}

if (cantidad > 1) {
  this.actualizarCarrito(producto.id, cantidad - 1, producto);
} else {
  this.ManejarCarrito = true;
}
  }

/** Envia al backend la nueva cantidad de un producto y actualiza el formulario si es exitoso. */
actualizarCarrito(idProducto: any, nuevacantidad: any, producto: any): void {
  const payload = { email: this.correo, producto: idProducto, valorNuevo: nuevacantidad };

  this.crudService.ActualizarCarrito(payload).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: (respuesta: any) => {
      if (respuesta.success === 1) {
        producto.form.get('cantidad').setValue(nuevacantidad);
        this.recalcularYActualizarPayPal();
      } else {
        toast.error('Valor fuera de stock');
        this.calcularTotalCarrito();
      }
      this.ManejarCarrito = true;
    },
    error: () => {
      toast.error('Error al actualizar el carrito. Intenta de nuevo.');
      producto.form.get('cantidad').setValue(0);
      this.calcularTotalCarrito();
      this.ManejarCarrito = true;
    }
  });
}

/** Elimina un producto del carrito en el backend y actualiza la lista local. */
BorrarDeMiCarrito(idProducto: string, index: number): void {
  const payload = { email: this.correo, idProducto };

  this.crudService.BorrarCarrito(payload).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: () => {
      this.ArregloDeProductos.splice(index, 1);
      if (this.paginaActual > this.totalPaginas) {
        this.paginaActual = this.totalPaginas;
      }
      if (this.ArregloDeProductos.length === 0) {
        this.HayAlgoQueCalcular = false;
      } else {
        this.recalcularYActualizarPayPal();
      }
      toast.success('Producto eliminado del carrito');
    },
    error: () => toast.error('Error al eliminar el producto. Intenta de nuevo.')
  });
}

/** Formatea el numero de tarjeta ingresado agrupando los digitos en bloques de cuatro. */
formatNumeroTarjeta(event: any): void {
  const input = event.target as HTMLInputElement;
  const trimmedValue = (input.value || '').replace(/\s+/g, '');
  const numericValue = trimmedValue.replace(/\D/g, '');
  const formattedValue = numericValue.length > 0 ? numericValue : '0';
  input.value = formattedValue.match(new RegExp('.{1,4}', 'g'))?.join(' ') || '';
}

/** Formatea la fecha de vencimiento de la tarjeta en formato MM/AA con validaciones de rango. */
formatFechaVencimiento(event: any): void {
  const input = event.target as HTMLInputElement;
  let value   = input.value.replace(/\D/g, '').substring(0, 4);
  const month = value.substring(0, 2);
  const year = value.substring(2);

  if(parseInt(month) > 12) value = '12' + value.substring(2);
if (parseInt(year) > 30) value = value.substring(0, 2) + '30';
if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);

input.value = value;
  }

/** Formatea el codigo de seguridad de la tarjeta permitiendo solo digitos numericos. */
formatCodigoSeguridad(event: any): void {
  const input = event.target as HTMLInputElement;
  const trimmedValue = (input.value || '').replace(/\s+/g, '');
  const numericValue = trimmedValue.replace(/\D/g, '');
  input.value = numericValue.length > 0 ? numericValue : '0';
}

/** Verifica que todos los campos del formulario de pago esten completos. */
checkValues(): boolean {
  return Object.values(this.FormPagos.value).every(value => value !== '');
}

/** Verifica que el numero de tarjeta tenga al menos 19 caracteres incluyendo espacios. */
checkNumeroLength(): boolean {
  return this.FormPagos.value.Numero?.length >= 19;
}

  /** Inicializa la configuracion de PayPal con el total actual y los productos del carrito. */
  private initConfig(): void {
  const totalCarritoString = this.preciototal.toFixed(2);

  this.payPalConfig = {
    currency: 'MXN',
    clientId: environment.paypalClientId,
    createOrderOnClient: (data) => <ICreateOrderRequest>{
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'MXN',
          value: totalCarritoString,
          breakdown: {
            item_total: { currency_code: 'MXN', value: totalCarritoString }
          }
        },
        items: this.ArregloDeProductos.map(producto => ({
          name: producto.nombre,
          quantity: producto.form.get('cantidad').value.toString(),
          category: 'DIGITAL_GOODS',
          unit_amount: { currency_code: 'MXN', value: producto.precio.toString() }
        }))
      }]
    },
    advanced: { commit: 'true' },
    style: { label: 'paypal', layout: 'vertical' },

    onApprove: (data, actions) => {
      this.ManejarCarrito = false;
      toast.loading('Cargando...');
      actions.order.get().then((_details: any) => { });
    },

    onClientAuthorization: (data) => {
      toast.loading('Cargando...');
      this.FormPagos.patchValue({
        email: this.correo,
        forma_pago: 'Tarjeta de credito',
        total: data.purchase_units[0].amount.value,
        correoPaypal: data.payer.email_address,
        direccionClientePaypal: [
          data.purchase_units[0]?.shipping?.address?.address_line_1 || '',
          data.purchase_units[0]?.shipping?.address?.address_line_2 || '',
          data.purchase_units[0]?.shipping?.address?.admin_area_2 || '',
          data.purchase_units[0]?.shipping?.address?.admin_area_1 || '',
          data.purchase_units[0]?.shipping?.address?.postal_code || '',
          data.purchase_units[0]?.shipping?.address?.country_code || '',
        ].join(', '),
        clientePaypal: `${data.payer?.name?.given_name || ''} ${data.payer?.name?.surname || ''}`,
        idPaypal: data.payer.payer_id
      });

      this.crudService.Pagar(this.FormPagos.value).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          toast.success('Se realizo la compra!');
          this.router.navigate(['GenerarPedido'], {
            state: { email: this.correo, idCompra: response }
          });
        },
        error: () => {
          toast.error('Error al procesar el pago. Intenta de nuevo.');
        }
      });
    },

    onCancel: (_data, _actions) => {
      toast.warning('Se cancelo el pago');
    },

    onError: (_err) => {
      toast.error('Hubo un error con PayPal. Intenta de nuevo.');
    },

    onClick: (_data, _actions) => {
      toast.loading('Cargando...');
      this.ManejarCarrito = false;
    },
  };
}
}