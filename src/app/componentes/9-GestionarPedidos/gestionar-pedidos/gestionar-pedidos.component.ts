import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CambiarEstado } from '../../../servicio/Clases/CambiarEstado';
import {
  LucideAngularModule,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-angular';
import { toast } from 'ngx-sonner';
import { GlobalService, Usuario } from '../../../servicio/global.service';

/** Estructura de datos del cliente asociado a un pedido. */
interface ClientePedido {
  id: number;
  apodo: string;
  email: string;
  nombre?: string;
}

/** Estructura de datos de una solicitud de reembolso. */
interface Reembolso {
  id: number;
  motivo?: string;
  fechaReembolso: string;
  autorizada: string;
}

/** Estructura de datos de un pedido con informacion de cliente y direccion de envio. */
interface Pedido {
  id: number;
  estado: string;
  estadoOrigen?: string;
  fechaPedido: string;
  fechaEntrega?: string | null;
  calle?: string;
  ciudad?: string;
  codigoPostal?: number | string;
  numeroExterior?: number | string;
  numeroInterior?: number | string;
  cliente: ClientePedido;
}

/** Componente de administracion que permite gestionar pedidos y solicitudes de reembolso. */
@Component({
  selector: 'app-gestionar-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
  ],
  templateUrl: './gestionar-pedidos.component.html',
  styleUrls: ['../../../../styles.css', './gestionar-pedidos.component.css'],
})
export class GestionarPedidosComponent implements OnInit, OnDestroy {

  /** Icono de confirmacion para acciones de aceptar. */
  readonly CheckCircle = CheckCircle;

  /** Icono de cancelacion para acciones de denegar. */
  readonly XCircle = XCircle;

  /** Icono de ojo para ver detalles. */
  readonly Eye = Eye;

  /** Icono de refresco para actualizar datos. */
  readonly RefreshCw = RefreshCw;

  /** Icono de flecha izquierda para la paginacion. */
  readonly ChevronLeft = ChevronLeft;

  /** Icono de flecha derecha para la paginacion. */
  readonly ChevronRight = ChevronRight;

  /** Lista completa de pedidos cargada desde el backend sin modificar. */
  TipoBAll: Pedido[] = [];

  /** Vista filtrada de pedidos que se pagina y se muestra en el template. */
  TipoB: Pedido[] = [];

  /** Estado actualmente seleccionado para filtrar la lista de pedidos. */
  filtroEstado: string = 'Todos';

  /** Lista de solicitudes de reembolso obtenidas desde el backend. */
  productos: Reembolso[] = [];

  /** Objeto completo del usuario administrador autenticado. */
  usuarioActual: Usuario | null = null;

  /** Controla si el modal de motivo de reembolso esta visible. */
  modalAbierto: boolean = false;

  /** Texto del motivo de reembolso mostrado en el modal activo. */
  selectedMotivo: string = '';

  /** Cantidad de pedidos visibles por pagina. */
  itemsPorPaginaPedidos: number = 5;

  /** Numero de la pagina activa en la paginacion de pedidos. */
  paginaActualPedidos: number = 1;

  /** Retorna el total de paginas para la lista de pedidos. */
  get totalPaginasPedidos(): number {
    return Math.max(1, Math.ceil(this.TipoB.length / this.itemsPorPaginaPedidos));
  }

  /** Retorna un arreglo con los numeros de pagina disponibles para pedidos. */
  get paginasPedidos(): number[] {
    return Array.from({ length: this.totalPaginasPedidos }, (_, i) => i + 1);
  }

  /** Retorna el subconjunto de pedidos correspondiente a la pagina activa. */
  get pedidosPaginados(): Pedido[] {
    const inicio = (this.paginaActualPedidos - 1) * this.itemsPorPaginaPedidos;
    return this.TipoB.slice(inicio, inicio + this.itemsPorPaginaPedidos);
  }

  /** Navega a la pagina indicada en la lista de pedidos si esta dentro del rango valido. */
  irAPaginaPedidos(p: number): void {
    if (p >= 1 && p <= this.totalPaginasPedidos) this.paginaActualPedidos = p;
  }

  /** Reinicia la paginacion de pedidos al cambiar la cantidad de items por pagina. */
  onItemsPorPaginaPedidosChange(): void {
    this.paginaActualPedidos = 1;
  }

  /** Cantidad de reembolsos visibles por pagina. */
  itemsPorPaginaReembolsos: number = 5;

  /** Numero de la pagina activa en la paginacion de reembolsos. */
  paginaActualReembolsos: number = 1;

  /** Retorna el total de paginas para la lista de reembolsos. */
  get totalPaginasReembolsos(): number {
    return Math.max(1, Math.ceil(this.productos.length / this.itemsPorPaginaReembolsos));
  }

  /** Retorna un arreglo con los numeros de pagina disponibles para reembolsos. */
  get paginasReembolsos(): number[] {
    return Array.from({ length: this.totalPaginasReembolsos }, (_, i) => i + 1);
  }

  /** Retorna el subconjunto de reembolsos correspondiente a la pagina activa. */
  get reembolsosPaginados(): Reembolso[] {
    const inicio = (this.paginaActualReembolsos - 1) * this.itemsPorPaginaReembolsos;
    return this.productos.slice(inicio, inicio + this.itemsPorPaginaReembolsos);
  }

  /** Navega a la pagina indicada en la lista de reembolsos si esta dentro del rango valido. */
  irAPaginaReembolsos(p: number): void {
    if (p >= 1 && p <= this.totalPaginasReembolsos) this.paginaActualReembolsos = p;
  }

  /** Reinicia la paginacion de reembolsos al cambiar la cantidad de items por pagina. */
  onItemsPorPaginaReembolsosChange(): void {
    this.paginaActualReembolsos = 1;
  }

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param router        Servicio de navegacion entre rutas.
   * @param crudService   Servicio para operaciones con la API.
   * @param globalService Servicio de estado global de sesion del usuario.
   */
  constructor(
    private readonly router:        Router,
    private readonly crudService:   CrudService,
    private readonly globalService: GlobalService,
  ) { }

  /** Verifica que el usuario sea administrador y carga los pedidos y devoluciones. */
  ngOnInit(): void {
    this.globalService.usuario$
      .pipe(takeUntil(this.destroy$))
      .subscribe((usuario) => {
        this.usuarioActual = usuario;

        if (!usuario) {
          toast.error('Inicia sesion para disfrutar este servicio.');
          this.irHaciaLogin();
          return;
        }

        if (!this.globalService.esAdmin()) {
          toast.error('No tienes permisos de administrador.');
          this.irHaciaLogin();
          return;
        }

        this.obtenerPedidos();
        this.obtenerDevoluciones();
      });
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Redirige al usuario hacia la vista de login. */
  irHaciaLogin(): void {
    this.router.navigate(['Login']);
  }

  /** Actualiza el filtro de estado segun la opcion seleccionada y aplica el filtro a la lista. */
  CambioDeEstado(event: Event): void {
    this.filtroEstado = (event.target as HTMLSelectElement).value;
    this.aplicarFiltro();
  }

  /** Filtra la lista completa de pedidos segun el estado activo y reinicia la paginacion. */
  private aplicarFiltro(): void {
    this.paginaActualPedidos = 1;
    this.TipoB = this.filtroEstado === 'Todos'
      ? [...this.TipoBAll]
      : this.TipoBAll.filter(p => p.estado === this.filtroEstado);
  }

  /** Envia el nuevo estado del pedido al backend y recarga la lista si el cambio es exitoso. */
  CambioDeEstadoPedido(event: Event, IDPedido: number): void {
    const nuevoEstado = (event.target as HTMLSelectElement).value;
    if (nuevoEstado === 'NO') return;

    const payload: CambiarEstado = {
      Estado:    nuevoEstado,
      ID_Pedido: String(IDPedido)
    };

    this.crudService.CambiarEstado(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp.success) {
            toast.success(resp.message);
            this.obtenerPedidos();
          } else {
            toast.error('No se pudo cambiar el estado del pedido.');
          }
        },
        error: () => toast.error('Error al cambiar el estado del pedido.')
      });
  }

  /** Consulta todos los pedidos desde el backend y aplica el filtro activo. */
  obtenerPedidos(): void {
    this.crudService.RevisarPedidos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: any) => {
          const lista   = (Array.isArray(respuesta) ? respuesta : []) as Pedido[];
          this.TipoBAll = lista;
          this.aplicarFiltro();
        },
        error: () => toast.error('No se pudieron cargar los pedidos.'),
      });
  }

  /** Consulta todas las solicitudes de reembolso desde el backend y reinicia la paginacion. */
  obtenerDevoluciones(): void {
    this.crudService.ObtenerRembolsos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: any) => {
          this.productos              = respuesta ?? [];
          this.paginaActualReembolsos = 1;
        },
        error: () => toast.error('No se pudieron cargar las devoluciones.'),
      });
  }

  /** Solicita confirmacion y autoriza el reembolso indicado en el backend. */
  Aceptar(reembolso: Reembolso): void {
    toast('Aceptar este reembolso?', {
      description: 'Esta accion es irreversible.',
      duration: 10000,
      action: {
        label: 'Si, aceptar',
        onClick: () => {
          this.crudService.AutorizarRembolso(String(reembolso.id))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                toast.success('Reembolso autorizado.');
                this.obtenerDevoluciones();
              },
              error: () => toast.error('Error al autorizar el reembolso.'),
            });
        },
      },
      cancel: { label: 'Cancelar', onClick: () => { } },
    });
  }

  /** Solicita confirmacion y deniega el reembolso indicado, eliminandolo de la lista local. */
  Denegar(reembolso: Reembolso, indexGlobal: number): void {
    toast('Denegar este reembolso?', {
      description: 'Esta accion es irreversible.',
      duration: 10000,
      action: {
        label: 'Si, denegar',
        onClick: () => {
          this.crudService.DenegarRembolso(String(reembolso.id))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                toast.error('Reembolso denegado.');
                this.productos.splice(indexGlobal, 1);
                if (this.paginaActualReembolsos > this.totalPaginasReembolsos) {
                  this.paginaActualReembolsos = this.totalPaginasReembolsos;
                }
              },
              error: () => toast.error('Error al denegar el reembolso.'),
            });
        },
      },
      cancel: { label: 'Cancelar', onClick: () => { } },
    });
  }

  /** Abre el modal con el motivo de reembolso del elemento seleccionado. */
  openModal(motivo: string): void {
    this.selectedMotivo = motivo;
    this.modalAbierto   = true;
  }

  /** Cierra el modal de motivo de reembolso y limpia el texto almacenado. */
  closeMotivoModal(): void {
    this.modalAbierto   = false;
    this.selectedMotivo = '';
  }

  /** Construye una cadena legible con la direccion de envio del pedido indicado. */
  getDireccion(pedido: Pedido): string {
    const partes: string[] = [];

    if (pedido.calle) {
      let linea = pedido.calle;
      if (pedido.numeroExterior) linea += ` #${pedido.numeroExterior}`;
      if (pedido.numeroInterior) linea += ` Int.${pedido.numeroInterior}`;
      partes.push(linea);
    }

    if (pedido.ciudad)       partes.push(pedido.ciudad);
    if (pedido.estadoOrigen) partes.push(pedido.estadoOrigen);
    if (pedido.codigoPostal) partes.push(`CP ${pedido.codigoPostal}`);

    return partes.join(', ') || 'Sin direccion';
  }
}