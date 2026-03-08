import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MeterFactura } from '../../../servicio/Clases/MeterFactura';
import { toast } from 'ngx-sonner';
import {
  LucideAngularModule,
  FileText,
  Trash2,
  Upload,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-angular';
import { GlobalService, Usuario } from '../../../servicio/global.service';

/** Componente que permite al usuario solicitar la generacion de facturas sobre sus compras. */
@Component({
  selector: 'app-generar-facturas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './generar-facturas.component.html',
  styleUrls: ['../../../../styles.css', './generar-facturas.component.css'],
})
export class GenerarFacturasComponent implements OnInit, OnDestroy {

  /** Icono de documento para representar facturas. */
  readonly FileText = FileText;

  /** Icono de papelera para eliminar la foto de perfil. */
  readonly Trash2 = Trash2;

  /** Icono de carga para subir archivos. */
  readonly Upload = Upload;

  /** Icono de inicio de sesion. */
  readonly LogIn = LogIn;

  /** Icono de flecha izquierda para la paginacion. */
  readonly ChevronLeft = ChevronLeft;

  /** Icono de flecha derecha para la paginacion. */
  readonly ChevronRight = ChevronRight;

  /** Lista de compras del usuario disponibles para facturar. */
  productos: any[] = [];

  /** Lista de pedidos disponibles para seleccionar al generar una factura. */
  fechasCompras: any[] = [];

  /** ID del usuario autenticado. */
  userId: number | null = null;

  /** Correo electronico del usuario autenticado. */
  correo: string = '';

  /** URL de la imagen de perfil del usuario. */
  imageUrl: string | undefined;

  /** Archivo PNG seleccionado para actualizar la foto de perfil. */
  selectedFile: File | undefined;

  /** Nombre del archivo de foto seleccionado. */
  selectedFileName: string | undefined;

  /** Apodo del usuario autenticado. */
  apodito: string | undefined;

  /** Datos fiscales guardados en el perfil del usuario disponibles para reutilizar en la factura. */
  datosFiscalesGuardados: {
    razonSocial:        string;
    rfc:                string;
    regimenFiscal:      string;
    codigoPostalFiscal: string;
    usoCfdi:            string;
    correoFacturacion:  string;
  } | null = null;

  /** Controla si el modal de seleccion de datos fiscales es visible. */
  preguntandoDatosFiscales: boolean = false;

  /** Indica si el usuario eligio usar los datos fiscales guardados en su perfil. */
  usandoDatosFiscalesGuardados: boolean = false;

  /** Cantidad de compras visibles por pagina. */
  itemsPorPagina: number = 5;

  /** Numero de la pagina activa en la paginacion. */
  paginaActual: number = 1;

  /** Retorna el total de paginas calculado segun las compras y el limite por pagina. */
  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productos.length / this.itemsPorPagina));
  }

  /** Retorna un arreglo con los numeros de pagina disponibles. */
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /** Retorna el subconjunto de compras correspondiente a la pagina activa. */
  get productosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.productos.slice(inicio, inicio + this.itemsPorPagina);
  }

  /** Navega a la pagina indicada si esta dentro del rango valido. */
  irAPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p;
  }

  /** Reinicia la paginacion al cambiar la cantidad de items por pagina. */
  onItemsPorPaginaChange(): void { this.paginaActual = 1; }

  /** Formulario reactivo con los datos fiscales y la compra seleccionada para generar la factura. */
  readonly formularioFactura = new FormGroup({
    idCompra:           new FormControl(''),
    razonSocial:        new FormControl(''),
    rfc:                new FormControl(''),
    regimenFiscal:      new FormControl(''),
    codigoPostalFiscal: new FormControl(''),
    usoCfdi:            new FormControl(''),
    correoFacturacion:  new FormControl(''),
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
    private readonly globalService: GlobalService,
  ) { }

  /** Verifica la sesion activa y carga la foto, datos del cliente y compras disponibles. */
  ngOnInit(): void {
    const usuario: Usuario | null = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['Login']);
      return;
    }

    this.correo  = usuario.email;
    this.userId  = usuario.id;
    this.apodito = usuario.apodo;
    this.cargarDatosCliente();
    this.cargarCompras();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Muestra el modal para que el usuario elija entre sus datos fiscales guardados o nuevos. */
  abrirModalDatosFiscales(): void {
    this.preguntandoDatosFiscales = true;
  }

  /** Precarga los datos fiscales guardados del perfil en el formulario de factura. */
  usarDatosFiscalesGuardados(): void {
    if (this.datosFiscalesGuardados) {
      this.formularioFactura.patchValue({ ...this.datosFiscalesGuardados });
    }
    this.usandoDatosFiscalesGuardados = true;
    this.preguntandoDatosFiscales     = false;
  }

  /** Limpia los campos fiscales del formulario para ingresar datos nuevos. */
  usarDatosFiscalesNuevos(): void {
    this.formularioFactura.patchValue({
      razonSocial: '', rfc: '', regimenFiscal: '',
      codigoPostalFiscal: '', usoCfdi: '', correoFacturacion: '',
    });
    this.usandoDatosFiscalesGuardados = false;
    this.preguntandoDatosFiscales     = false;
  }

  /** Valida que el archivo seleccionado sea PNG, lo renombra con el ID del usuario y lo asigna. */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (ext === '.png') {
      const fileName        = `User${this.userId}${ext}`;
      this.selectedFile     = new File([file], fileName, { type: file.type });
      this.selectedFileName = fileName;
    } else {
      this.selectedFile     = undefined;
      this.selectedFileName = undefined;
      toast.warning('Solo se permiten archivos .png');
    }
  }

  /** Redirige al usuario hacia su vista de perfil. */
  irHaciaMe(): void {
    if (this.correo) this.router.navigate(['Me'], { state: { email: this.correo } });
  }

  /** Redirige al usuario hacia la vista de login. */
  irHaciaLogin(): void {
    this.router.navigate(['Login']);
  }

  /** Valida los datos fiscales del formulario y envia la solicitud de factura al backend. */
  generarFactura(): void {
    const v = this.formularioFactura.value;

    const rfcRegex   = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9,.\-]*$/;
    const errores: string[] = [];

    if (!v.idCompra)
      errores.push('Selecciona un pedido antes de continuar.');
    if (!v.razonSocial || v.razonSocial.length > 255)
      errores.push('La razon social es obligatoria (max. 255 caracteres).');
    if (!v.rfc || !rfcRegex.test(v.rfc))
      errores.push('RFC invalido (ej. XAXX010101000).');
    if (!v.regimenFiscal || v.regimenFiscal.length < 3 || v.regimenFiscal.length > 255)
      errores.push('El regimen fiscal es obligatorio (entre 3 y 255 caracteres).');
    if (!v.codigoPostalFiscal || !/^\d{5}$/.test(v.codigoPostalFiscal))
      errores.push('El codigo postal fiscal debe tener exactamente 5 digitos.');
    if (!v.usoCfdi || v.usoCfdi.length > 255 || !soloLetras.test(v.usoCfdi))
      errores.push('El uso de CFDI es obligatorio (max. 255 caracteres).');
    if (!v.correoFacturacion || !emailRegex.test(v.correoFacturacion) || v.correoFacturacion.length > 255)
      errores.push('El correo de facturacion debe ser un email valido.');

    if (errores.length > 0) {
      toast.error(errores.join('\n'));
      return;
    }

    const payload: MeterFactura = {
      correo:             this.correo,
      ID_Compra:          v.idCompra          ?? '',
      razonSocial:        v.razonSocial        ?? '',
      rfc:                (v.rfc              ?? '').toUpperCase(),
      regimenFiscal:      v.regimenFiscal      ?? '',
      codigoPostalFiscal: v.codigoPostalFiscal ?? '',
      usoCfdi:            v.usoCfdi            ?? '',
      correoFacturacion:  v.correoFacturacion  ?? '',
    };

    this.crudService.MeterFactura(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: string) => {
          if (respuesta.startsWith('Factura creada')) {
            toast.success('Factura generada con exito!');
            this.formularioFactura.reset();
            this.cargarCompras();
          } else {
            toast.error('No se pudo generar la factura. Intenta de nuevo.');
          }
        },
        error: () => toast.error('Error al generar la factura. Intenta de nuevo.'),
      });
  }

  /** Consulta los datos del perfil del cliente y precarga los datos fiscales guardados si existen. */
  private cargarDatosCliente(): void {
    this.crudService.RevisarPersona(this.correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          const p = Array.isArray(result) ? result[0] : result;
          if (!p) return;

          if (p.email) this.correo = p.email;

          if (p.razonSocial && p.rfc && p.regimenFiscal) {
            this.datosFiscalesGuardados = {
              razonSocial:        p.razonSocial        ?? '',
              rfc:                p.rfc                ?? '',
              regimenFiscal:      p.regimenFiscal      ?? '',
              codigoPostalFiscal: p.codigoPostalFiscal ?? '',
              usoCfdi:            p.usoCfdi            ?? '',
              correoFacturacion:  p.correoFacturacion  ?? '',
            };
            this.preguntandoDatosFiscales = true;
          }
        },
        error: () => toast.error('Error al cargar los datos del cliente.'),
      });
  }

  /** Consulta las compras y los pedidos facturables del usuario y reinicia la paginacion. */
  private cargarCompras(): void {
    this.paginaActual = 1;

    this.crudService.ObtenerCompras(this.correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  r => { this.productos = r; },
        error: () => toast.error('Error al cargar el historial de compras.'),
      });

    this.crudService.ObtenerFacturasDisponibles(this.correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (r: any) => { this.fechasCompras = Array.isArray(r) ? r : []; },
        error: () => toast.error('Error al cargar los pedidos disponibles.'),
      });
  }
}