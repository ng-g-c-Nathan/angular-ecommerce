import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { toast } from 'ngx-sonner';
import {
  LucideAngularModule,
  PackageCheck,
  Trash2,
  Upload,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-angular';
import { GlobalService, Usuario } from '../../../servicio/global.service';

/** Componente que permite al usuario registrar la direccion de envio y generar un pedido de sus compras. */
@Component({
  selector: 'app-generar-pedido',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './generar-pedido.component.html',
  styleUrls: ['../../../../styles.css', './generar-pedido.component.css'],
})
export class GenerarPedidoComponent implements OnInit, OnDestroy {

  /** Icono de paquete confirmado para el estado de pedido generado. */
  readonly PackageCheck = PackageCheck;

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

  /** Lista de compras del usuario disponibles para generar pedido. */
  productos: any[] = [];

  /** Lista de fechas unicas de compras del usuario. */
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

  /** Direccion guardada en el perfil del usuario disponible para reutilizar en el pedido. */
  direccionGuardada: {
    calle:               string;
    numeroExterior:      string;
    numeroInterior:      string;
    ciudad:              string;
    estado:              string;
    codigoPostal:        string;
    pais:                string;
    instruccionesExtras: string;
  } | null = null;

  /** Controla si el modal de seleccion de direccion esta visible. */
  preguntandoDireccion: boolean = false;

  /** Indica si el usuario eligio usar la direccion guardada en su perfil. */
  usandoDireccionGuardada: boolean = false;

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
  onItemsPorPaginaChange(): void {
    this.paginaActual = 1;
  }

  /** Formulario reactivo con los datos de envio y la compra seleccionada para el pedido. */
  readonly formularioPedido: FormGroup = new FormGroup({
    ID_Compra:           new FormControl(''),
    calle:               new FormControl(''),
    numeroExterior:      new FormControl(''),
    numeroInterior:      new FormControl(''),
    ciudad:              new FormControl(''),
    estado:              new FormControl(''),
    codigoPostal:        new FormControl(''),
    pais:                new FormControl(''),
    instruccionesExtras: new FormControl(''),
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
  ) {}

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

  /** Muestra el modal para que el usuario elija entre su direccion guardada o una nueva. */
  abrirModalDireccion(): void {
    this.preguntandoDireccion = true;
  }

  /** Precarga la direccion guardada del perfil en el formulario de pedido. */
  usarDireccionGuardada(): void {
    if (this.direccionGuardada) {
      this.formularioPedido.patchValue({ ...this.direccionGuardada });
    }
    this.usandoDireccionGuardada = true;
    this.preguntandoDireccion    = false;
  }

  /** Limpia los campos de direccion del formulario para ingresar una nueva. */
  usarDireccionNueva(): void {
    this.formularioPedido.patchValue({
      calle: '', numeroExterior: '', numeroInterior: '',
      ciudad: '', estado: '', codigoPostal: '',
      pais: '', instruccionesExtras: '',
    });
    this.usandoDireccionGuardada = false;
    this.preguntandoDireccion    = false;
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

  /** Valida los datos del formulario y envia el pedido al backend con la direccion de envio. */
  generarPedido(): void {
    const v = this.formularioPedido.value;

    const esNumero   = (val: any): boolean => !isNaN(parseFloat(val)) && isFinite(val);
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    const errores: string[] = [];

    if (!v.ID_Compra)
      errores.push('Selecciona un pedido antes de continuar.');

    if (!v.estado || v.estado.length < 3)
      errores.push('El estado es obligatorio y debe tener al menos 3 caracteres.');

    if (!v.pais || v.pais.length > 255 || !soloLetras.test(v.pais))
      errores.push('El pais es obligatorio y debe ser valido (no exceder 255 caracteres).');

    if (!v.calle || v.calle.length > 255)
      errores.push('La calle es obligatoria y no debe exceder 255 caracteres.');

    if (v.numeroInterior && (
      v.numeroInterior.length > 11 ||
      (!esNumero(v.numeroInterior) && !/^[a-zA-Z]+$/.test(v.numeroInterior)) ||
      v.numeroInterior === '0'))
      errores.push('Si se ingresa un numero interior, debe ser valido (no exceder 11 caracteres).');

    if (!v.codigoPostal || v.codigoPostal.length > 5 || !esNumero(v.codigoPostal))
      errores.push('El codigo postal es obligatorio y debe ser valido (no exceder 5 digitos).');

    if (!v.numeroExterior || v.numeroExterior.length > 11 ||
      (!esNumero(v.numeroExterior) && !/^[a-zA-Z]+$/.test(v.numeroExterior)) ||
      v.numeroExterior === '0')
      errores.push('El numero exterior es obligatorio y debe ser valido (no exceder 11 caracteres).');

    if (!v.ciudad || v.ciudad.length > 255 || !soloLetras.test(v.ciudad))
      errores.push('La ciudad es obligatoria y no debe exceder 255 caracteres.');

    if (v.instruccionesExtras && v.instruccionesExtras.length > 255)
      errores.push('Las instrucciones extras no deben exceder 255 caracteres.');

    if (errores.length > 0) {
      toast.error(errores.join('\n'));
      return;
    }

    const payload = {
      email:               this.correo,
      ID_Compra:           v.ID_Compra,
      calle:               v.calle,
      numeroExterior:      v.numeroExterior,
      numeroInterior:      v.numeroInterior,
      ciudad:              v.ciudad,
      estado:              v.estado,
      codigoPostal:        v.codigoPostal,
      pais:                v.pais,
      instruccionesExtras: v.instruccionesExtras,
    };

    this.crudService.MeterPedido(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r: any) => {
          if (r.success === 1) {
            toast.success('Pedido generado con exito!');
            this.cargarCompras();
          } else {
            toast.error('No se pudo generar el pedido. Intenta de nuevo.');
          }
        },
        error: () => toast.error('Error al generar el pedido. Intenta de nuevo.'),
      });
  }

  /** Consulta los datos del perfil del cliente y precarga la direccion guardada si existe. */
  private cargarDatosCliente(): void {
    this.crudService.RevisarPersona(this.correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          const p = Array.isArray(result) ? result[0] : result;
          if (!p) return;

          if (p.email) this.correo = p.email;

          if (p.calle && p.ciudad && p.estado) {
            this.direccionGuardada = {
              calle:               p.calle               ?? '',
              numeroExterior:      p.numeroExterior       ?? '',
              numeroInterior:      p.numeroInterior       ?? '',
              ciudad:              p.ciudad               ?? '',
              estado:              p.estado               ?? '',
              codigoPostal:        p.codigoPostal         ?? '',
              pais:                p.pais                 ?? '',
              instruccionesExtras: p.instruccionesExtras  ?? '',
            };
            this.preguntandoDireccion = true;
          }
        },
        error: () => toast.error('Error al cargar los datos del cliente.'),
      });
  }

  /** Consulta las compras y fechas unicas del usuario y reinicia la paginacion. */
  private cargarCompras(): void {
    this.paginaActual = 1;

    this.crudService.ObtenerCompras(this.correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (r) => { this.productos = r; },
        error: () => toast.error('Error al cargar las compras.'),
      });

    this.crudService.ObtenerComprasUnicas(this.correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (r) => { this.fechasCompras = r; },
        error: () => toast.error('Error al cargar las fechas de compras.'),
      });
  }
}