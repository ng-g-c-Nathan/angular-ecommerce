import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import {
  LucideAngularModule,
  FileText,
  Check,
  X,
  Send,
  XCircle,
  RefreshCw,
} from 'lucide-angular';
import { GlobalService } from '../../../servicio/global.service';

/** Componente de administracion que permite revisar, autorizar, rechazar y enviar facturas. */
@Component({
  selector: 'app-autorizar-facturas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSonnerToaster,
    LucideAngularModule,
  ],
  templateUrl: './autorizar-facturas.component.html',
  styleUrl: '../../../../styles.css',
})
export class AutorizarFacturasComponent implements OnInit, OnDestroy {

  /** Icono de documento para representar facturas. */
  readonly FileText = FileText;

  /** Icono de confirmacion para la accion de autorizar. */
  readonly Check = Check;

  /** Icono de cierre para la accion de rechazar o cerrar. */
  readonly X = X;

  /** Icono de envio para reenviar la factura al cliente. */
  readonly Send = Send;

  /** Icono de cancelacion para estados rechazados. */
  readonly XCircle = XCircle;

  /** Icono de refresco para actualizar la lista de facturas. */
  readonly RefreshCw = RefreshCw;

  /** Lista de facturas pendientes obtenidas desde el backend. */
  productos: any[] = [];

  /** URL segura del PDF activo para renderizarlo en el iframe del modal. */
  pdfBlobUrl: SafeResourceUrl | null = null;

  /** URL sin sanitizar del blob PDF, necesaria para poder revocarlo correctamente. */
  private rawPdfUrl: string | null = null;

  /** Controla si el modal de visualizacion del PDF es visible. */
  mostrarModalPdf = false;

  /** Controla si el modal de detalle de texto es visible. */
  modalAbierto = false;

  /** Contenido de texto mostrado en el modal de detalle. */
  modalContenido = '';

  /** Titulo del modal de detalle activo. */
  modalTitulo = '';

  /** Formulario reactivo para capturar el nombre del emisor al autorizar una factura. */
  readonly facturaForm = new FormGroup({
    Nombre: new FormControl('')
  });

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param router        Servicio de navegacion entre rutas.
   * @param crudService   Servicio para operaciones con la API.
   * @param globalService Servicio de estado global de sesion del usuario.
   * @param sanitizer     Servicio para marcar URLs de blob como seguras en el template.
   */
  constructor(
    private readonly router:        Router,
    private readonly crudService:   CrudService,
    private readonly globalService: GlobalService,
    private readonly sanitizer:     DomSanitizer,
  ) {}

  /** Verifica que el usuario sea administrador y carga la lista de facturas pendientes. */
  ngOnInit(): void {
    const usuario = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['Login']);
      return;
    }

    if (!this.globalService.esAdmin()) {
      toast.error('No tienes permisos de administrador.');
      this.router.navigate(['Login']);
      return;
    }

    this.obtenerFacturas();
  }

  /** Cancela todas las suscripciones activas y libera el blob URL del PDF para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.revocarBlobUrl();
  }

  /** Consulta todas las facturas pendientes desde el backend y actualiza la lista local. */
  obtenerFacturas(): void {
    this.crudService.RevisarFacturas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (respuesta: any) => { this.productos = respuesta; },
        error: () => toast.error('No se pudieron cargar las facturas.'),
      });
  }

  /** Valida que el nombre del emisor cumpla con los requisitos de longitud antes de autorizar. */
  private validarNombreEmisor(): boolean {
    const nombre = this.facturaForm.value.Nombre?.trim();
    if (!nombre)             { toast.error('El nombre no puede estar vacio.');  return false; }
    if (nombre.length < 7)   { toast.error('El nombre es demasiado corto.');    return false; }
    if (nombre.length > 255) { toast.error('El nombre es demasiado largo.');    return false; }
    return true;
  }

  /** Valida el nombre del emisor y envia la autorizacion de la factura al backend. */
  autorizar(index: number): void {
    if (!this.validarNombreEmisor()) return;
    const factura = this.productos[index];
    const nombre  = this.facturaForm.value.Nombre ?? undefined;

    this.crudService.AutorizarFactura(factura.idFacturacion, nombre)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.productos[index].estatus = 'Aprobada';
          toast.success('Factura autorizada correctamente.');
        },
        error: () => toast.error('Error al autorizar la factura.'),
      });
  }

  /** Envia el rechazo de la factura al backend y actualiza su estado en la lista local. */
  rechazar(index: number): void {
    const factura = this.productos[index];

    this.crudService.RechazarFactura(factura.idFacturacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.productos[index].estatus = 'Rechazada';
          toast.warning('Factura rechazada.');
        },
        error: () => toast.error('Error al rechazar la factura.'),
      });
  }

  /** Obtiene el PDF de la factura desde el backend, genera un blob URL y abre el modal de visualizacion. */
  verPdf(index: number): void {
    const factura = this.productos[index];

    this.crudService.ObtenerPDFFactura(factura.idFacturacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          this.revocarBlobUrl();
          this.rawPdfUrl       = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          this.pdfBlobUrl      = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdfUrl);
          this.mostrarModalPdf = true;
        },
        error: () => toast.error('No se pudo obtener el PDF.'),
      });
  }

  /** Cierra el modal de visualizacion del PDF y libera el blob URL generado. */
  cerrarModalPdf(): void {
    this.mostrarModalPdf = false;
    this.pdfBlobUrl      = null;
    this.revocarBlobUrl();
  }

  /** Envia la factura en PDF al correo del cliente asociado. */
  enviar(index: number): void {
    const factura = this.productos[index];

    this.crudService.EnviarFacturaPDF(factura.idFacturacion, factura.email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => toast.success('Factura enviada correctamente.'),
        error: () => toast.error('Error al enviar la factura.'),
      });
  }

  /** Abre el modal de detalle con el contenido y titulo indicados. */
  openModal(cadena: string, titulo: string): void {
    this.modalContenido = cadena;
    this.modalTitulo    = titulo;
    this.modalAbierto   = true;
  }

  /** Cierra el modal de detalle de texto. */
  cerrarModal(): void {
    this.modalAbierto = false;
  }

  /** Revoca el blob URL del PDF activo para liberar memoria del navegador. */
  private revocarBlobUrl(): void {
    if (this.rawPdfUrl) {
      URL.revokeObjectURL(this.rawPdfUrl);
      this.rawPdfUrl = null;
    }
  }
}