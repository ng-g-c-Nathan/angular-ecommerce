import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import Chart from 'chart.js/auto';
import {
  LucideAngularModule,
  LucideIconData,
  BarChart2,
  ShoppingCart,
  Star,
  List,
  Eye,
  Package,
  TrendingUp,
  RefreshCw,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
} from 'lucide-angular';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { GlobalService } from '../../../servicio/global.service';

/** Componente de administracion que muestra metricas, reportes de ventas y un grafico de vistas. */
@Component({
  selector: 'app-generar-analisis-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxSonnerToaster,
    LucideAngularModule,
  ],
  templateUrl: './generar-analisis-reportes.component.html',
  styleUrl: '../../../../styles.css'
})
export class GenerarAnalisisReportesComponent implements OnInit, OnDestroy {

  /** Icono de grafico de barras para la seccion de analisis. */
  readonly iconBarChart: LucideIconData = BarChart2;

  /** Icono de carrito para la metrica de carritos activos. */
  readonly iconCart: LucideIconData = ShoppingCart;

  /** Icono de estrella para la metrica de resenas. */
  readonly iconStar: LucideIconData = Star;

  /** Icono de lista para la metrica de listas de deseos. */
  readonly iconList: LucideIconData = List;

  /** Icono de ojo para la metrica de vistas. */
  readonly iconEye: LucideIconData = Eye;

  /** Icono de paquete para la metrica de productos. */
  readonly iconPackage: LucideIconData = Package;

  /** Icono de tendencia para indicadores de crecimiento. */
  readonly iconTrending: LucideIconData = TrendingUp;

  /** Icono de refresco para actualizar datos. */
  readonly iconRefresh: LucideIconData = RefreshCw;

  /** Icono de calendario para el selector de rango de fechas. */
  readonly iconCalendar: LucideIconData = CalendarRange;

  /** Icono de flecha izquierda para la paginacion. */
  readonly iconChevLeft: LucideIconData = ChevronLeft;

  /** Icono de flecha derecha para la paginacion. */
  readonly iconChevRight: LucideIconData = ChevronRight;

  /** Lista completa de registros de pagos obtenidos desde el backend. */
  tipoB: any[] = [];

  /** Lista filtrada de pagos que se pagina y se muestra en el template. */
  tipoBFiltrado: any[] = [];

  /** Numero de la pagina activa en la paginacion del reporte. */
  paginaActual: number = 1;

  /** Cantidad de registros visibles por pagina. */
  itemsPorPagina: number = 10;

  /** Opciones disponibles para la cantidad de items por pagina. */
  opcionesItemsPorPagina: number[] = [5, 10, 20, 50];

  /** Retorna el total de paginas calculado segun los registros filtrados y el limite por pagina. */
  get totalPaginas(): number {
    return Math.ceil(this.tipoBFiltrado.length / this.itemsPorPagina) || 1;
  }

  /** Retorna el subconjunto de registros correspondiente a la pagina activa. */
  get paginaData(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.tipoBFiltrado.slice(inicio, inicio + this.itemsPorPagina);
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

  /** Correo electronico del usuario autenticado. */
  correo: string = '';

  /** Fecha de inicio del filtro de rango para el reporte de pagos. */
  fechaInicio: string = '';

  /** Fecha de fin del filtro de rango para el reporte de pagos. */
  fechaFin: string = '';

  /** Total de vistas registradas en el dia actual. */
  totalVistasHoy: number = 0;

  /** Total de vistas registradas en la semana actual. */
  totalVistasSemana: number = 0;

  /** Total de vistas registradas en el mes actual. */
  totalVistasMes: number | undefined;

  /** Datos del proveedor con mayor cantidad de productos. */
  proveedorGrande: any;

  /** Producto con mayor numero de agregados al carrito. */
  productoMasAgregado: any;

  /** Total de carritos activos en la plataforma. */
  carritos: any;

  /** Total de listas de deseos activas en la plataforma. */
  listitas: any;

  /** Total de resenas publicadas en la plataforma. */
  resenas: any;

  /** Total de productos registrados en el catalogo. */
  totalProductos: any;

  /** Instancia del grafico de dona de vistas, destruida al salir del componente. */
  private chart: Chart<'doughnut', (number | null)[], string> | null = null;

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
  ) {}

  /** Verifica la sesion activa y carga las metricas y el analisis de ventas. */
  ngOnInit(): void {
    const usuario = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['/Login']);
      return;
    }

    this.correo = usuario.email;
    this.cargarMetricas();
    this.obtenerAnalisis();
  }

  /** Cancela todas las suscripciones activas y destruye el grafico para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chart?.destroy();
  }

  /** Consulta en paralelo todas las metricas del dashboard y dispara el dibujo del grafico al terminar. */
  private cargarMetricas(): void {
    this.crudService.CuantosProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  r => { this.totalProductos = r; },
        error: () => toast.error('Error al cargar el total de productos.')
      });

    this.crudService.ProveedorMasGrande()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  r => { this.proveedorGrande = r; },
        error: () => toast.error('Error al cargar el proveedor.')
      });

    this.crudService.TopUnoCarrito()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  r => { this.productoMasAgregado = r; },
        error: () => toast.error('Error al cargar el producto mas agregado.')
      });

    this.crudService.TotalCarritos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  r => { this.carritos = r; },
        error: () => toast.error('Error al cargar el total de carritos.')
      });

    this.crudService.TotalResenas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  r => { this.resenas = r; },
        error: () => toast.error('Error al cargar el total de resenas.')
      });

    this.crudService.TotalListas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  r => { this.listitas = r; },
        error: () => toast.error('Error al cargar el total de listas.')
      });

    this.crudService.SaberCuantosHoy()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (r: any) => { this.totalVistasHoy = r; },
        error: () => toast.error('Error al cargar las vistas de hoy.')
      });

    this.crudService.SaberCuantosSemana()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (r: any) => { this.totalVistasSemana = r; },
        error: () => toast.error('Error al cargar las vistas de la semana.')
      });

    this.crudService.SaberCuantosMes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r: any) => {
          this.totalVistasMes = r;
          this.dibujarGrafico();
        },
        error: () => toast.error('Error al cargar las vistas del mes.')
      });
  }

  /** Consulta todos los registros de pagos desde el backend y actualiza la lista de analisis. */
  obtenerAnalisis(): void {
    this.crudService.RevisarPagos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: any) => {
          this.tipoB         = respuesta;
          this.tipoBFiltrado = [...this.tipoB];
          this.paginaActual  = 1;
          toast.success('Analisis cargado correctamente.');
        },
        error: () => toast.error('No se pudo cargar el analisis.')
      });
  }

  /** Filtra la lista de pagos por el rango de fechas seleccionado y actualiza la paginacion. */
  actualizar(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      toast.warning('Selecciona un rango de fechas valido.');
      return;
    }

    const inicio = new Date(this.fechaInicio);
    const fin    = new Date(this.fechaFin);

    if (inicio > fin) {
      toast.error('La fecha de inicio no puede ser mayor que la fecha de fin.');
      return;
    }

    this.tipoBFiltrado = this.tipoB.filter(pago => {
      const fecha = new Date(pago.fechaPago);
      return fecha >= inicio && fecha <= fin;
    });

    this.paginaActual = 1;
    toast.success(`${this.tipoBFiltrado.length} resultado(s) encontrado(s).`);
  }

  /** Limpia el filtro de fechas y restaura la lista completa de pagos. */
  limpiarFiltro(): void {
    this.fechaInicio   = '';
    this.fechaFin      = '';
    this.tipoBFiltrado = [...this.tipoB];
    this.paginaActual  = 1;
    toast.info('Filtro limpiado.');
  }

  /** Destruye el grafico anterior si existe y renderiza uno nuevo con los datos de vistas actuales. */
  dibujarGrafico(): void {
    this.chart?.destroy();

    const ctx = document.getElementById('myChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Hoy', 'Semana', 'Totales'],
        datasets: [{
          label: 'Vistas',
          data: [
            this.totalVistasHoy,
            this.totalVistasSemana,
            this.totalVistasMes ?? null
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}