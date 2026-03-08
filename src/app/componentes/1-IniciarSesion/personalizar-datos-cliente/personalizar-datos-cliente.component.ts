import { Component, OnDestroy, OnInit } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LucideAngularModule, User, MapPin, Mail, Phone, Upload, Trash2, Save, X, Check } from 'lucide-angular';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { PersonaNueva } from '../../../servicio/Clases/PersonaNueva';

/** Componente para visualizar y actualizar los datos personales del cliente autenticado. */
@Component({
  selector: 'app-personalizar-datos-cliente',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
    NgxSonnerToaster
  ],
  templateUrl: './personalizar-datos-cliente.component.html',
  styleUrl: '../../../../styles.css'
})
export class PersonalizarDatosClienteComponent implements OnInit, OnDestroy {

  /** Icono de usuario para el campo de perfil. */
  readonly iconUser = User;

  /** Icono de ubicacion para los campos de direccion. */
  readonly iconMapPin = MapPin;

  /** Icono de correo electronico. */
  readonly iconMail = Mail;

  /** Icono de telefono. */
  readonly iconPhone = Phone;

  /** Icono para la accion de subir archivo. */
  readonly iconUpload = Upload;

  /** Icono para la accion de eliminar foto. */
  readonly iconTrash = Trash2;

  /** Icono para la accion de guardar cambios. */
  readonly iconSave = Save;

  /** Icono para cancelar o cerrar. */
  readonly iconX = X;

  /** Icono de confirmacion exitosa. */
  readonly iconCheck = Check;

  /** Correo electronico del usuario autenticado. */
  correo: string = '';

  /** ID del usuario autenticado. */
  userId: number = 0;

  /** Apodo del usuario autenticado. */
  Apodito: string = '';

  /** URL de la imagen de perfil del usuario. */
  imageUrl: string | undefined;

  /** Archivo de imagen seleccionado por el usuario para subir. */
  selectedFile: File | undefined;

  /** Nombre del archivo de imagen seleccionado. */
  selectedFileName: string | undefined;

  /** Formulario reactivo con todos los campos editables del perfil del cliente. */
  FormularioDelCliente: FormGroup;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();


  /**
   * @param crudService   Servicio para operaciones con la API.
   * @param globalService Servicio de estado global de sesion del usuario.
   * @param router        Servicio de navegacion entre rutas.
   * @param titleService  Servicio para modificar el titulo del documento.
   */
  constructor(
    private readonly crudService: CrudService,
    private readonly globalService: GlobalService,
    private readonly router: Router,
    private readonly titleService: Title
  ) {
    this.FormularioDelCliente = new FormGroup({
      nombre: new FormControl(''),
      apellidoP: new FormControl(''),
      apellidoM: new FormControl(''),
      apodo: new FormControl(''),
      rfc: new FormControl(''),
      calle: new FormControl(''),
      numeroExterior: new FormControl(''),
      numeroInterior: new FormControl(''),
      ciudad: new FormControl(''),
      estado: new FormControl(''),
      codigoPostal: new FormControl(''),
      pais: new FormControl(''),
      instruccionesExtras: new FormControl(''),
      correo: new FormControl(''),
      correoNuevo: new FormControl(''),
      telefono: new FormControl('')
    });
  }

  /** Obtiene el usuario autenticado y carga sus datos y foto de perfil. */
  ngOnInit(): void {
    this.inicializar();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Valida la sesion activa, asigna los datos del usuario y dispara la carga inicial. */
  private inicializar(): void {
    const usuario = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('Acceso restringido — requiere autenticacion');
      this.IrHaciaLogin();
      return;
    }

    this.userId = usuario.id;
    this.correo = usuario.email;
    this.Apodito = usuario.apodo;

    this.cargarFotoUsuario(this.userId);
    this.RevisarDatosDelCliente();
  }

  /** Captura el archivo seleccionado y valida que sea un PNG antes de asignarlo. */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (ext !== '.png') {
      this.selectedFile = undefined;
      this.selectedFileName = undefined;
      toast.warning('Solo se permiten archivos .png');
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }

  /** Sube el archivo PNG seleccionado como foto de perfil del usuario. */
  onSubmit(): void {
    if (!this.selectedFile) {
      toast.error('Selecciona un archivo PNG primero');
      return;
    }

    this.crudService.uploadFileUsuario(this.selectedFile, this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: string) => {
          toast.success(response);
          this.selectedFile = undefined;
          this.selectedFileName = undefined;
          this.cargarFotoUsuario(this.userId);
        },
        error: (error) => {
          toast.error(`Error en subida: ${error?.error ?? error}`);
          console.error('Detalle tecnico:', error);
        }
      });
  }

  /** Restablece la imagen de perfil al avatar por defecto tras eliminar la foto. */
  AcaboDeBorrarFoto(): void {
    this.imageUrl = './assets/users/LNathan.png';
  }

  /** Carga la foto de perfil del usuario desde el servidor y genera una URL de objeto temporal. */
  cargarFotoUsuario(id: number): void {
    const carpeta = 'users';
    const nombreArchivo = `User${id}.png`;

    this.crudService.verArchivo(carpeta, nombreArchivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          if (this.imageUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(this.imageUrl);
          }
          this.imageUrl = URL.createObjectURL(blob);
        },
        error: () => {
          this.imageUrl = './assets/users/LNathan.png';
        }
      });
  }

  /** Elimina la foto de perfil del usuario en el servidor y restablece el avatar por defecto. */
  BorrarFoto(): void {
    this.crudService.borrarFotoUsuario(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: string) => {
          toast.success(response);
          this.AcaboDeBorrarFoto();
        },
        error: (error) => {
          toast.error(`Error al eliminar foto: ${error?.error ?? error}`);
          console.error('Detalle tecnico:', error);
        }
      });
  }

  /** Redirige al usuario hacia su vista de perfil. */
  IrHaciaMe(): void {
    if (this.correo) {
      this.router.navigate(['Me'], { state: { email: this.correo } });
    }
  }

  /** Redirige al usuario hacia la vista de login. */
  IrHaciaLogin(): void {
    this.router.navigate(['Login']);
  }

  /** Consulta los datos del cliente en el backend y los carga en el formulario. */
  RevisarDatosDelCliente(): void {
    this.FormularioDelCliente.patchValue({ correo: this.correo });

    this.crudService.RevisarPersona(this.correo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (datos) => {
          const registro = Array.isArray(datos) ? datos[0] : datos;
          if (registro && typeof registro === 'object') {
            this.actualizarFormulario(registro);
          } else {
            this.manejarErrorCargaDatos();
          }
        },
        error: () => this.manejarErrorCargaDatos()
      });
  }

  /** Mapea los datos recibidos del backend a los campos del formulario. */
  private actualizarFormulario(datos: any): void {
    this.FormularioDelCliente.patchValue({
      nombre: datos.nombre,
      apellidoP: datos.apellidoPaterno,
      apellidoM: datos.apellidoMaterno,
      apodo: datos.apodo,
      rfc: datos.rfc ?? '',
      calle: datos.calle,
      numeroExterior: datos.numeroExterior,
      numeroInterior: datos.numeroInterior,
      ciudad: datos.ciudad,
      estado: datos.estado,
      codigoPostal: datos.codigoPostal,
      pais: datos.pais,
      instruccionesExtras: datos.instruccionesExtras,
      correoNuevo: datos.email,
      telefono: datos.telefono
    });

    this.correo = datos.email;
  }

  /** Notifica el error de carga y redirige al login. */
  private manejarErrorCargaDatos(): void {
    toast.error('Error en carga de datos');
    this.IrHaciaLogin();
  }

  /** Extrae los valores del formulario, los valida y envia la actualizacion al backend. */
  ActualizarDatosDelCliente(): void {
    const valores = this.extraerValoresFormulario();
    const errores = this.validarCampos(valores);

    if (errores.length > 0) {
      errores.forEach(e => toast.error(e));
      return;
    }

    this.procesarActualizacionSegura(valores);
  }

  /** Extrae y estructura los valores actuales del formulario. */
  private extraerValoresFormulario(): any {
    const f = this.FormularioDelCliente.value;
    return {
      correo: f.correoNuevo,
      nombre: f.nombre,
      apellidoP: f.apellidoP,
      apellidoM: f.apellidoM,
      rfc: f.rfc,
      apodo: f.apodo,
      calle: f.calle,
      numeroInterior: f.numeroInterior,
      ciudad: f.ciudad,
      numeroExterior: f.numeroExterior,
      telefono: f.telefono,
      instruccionesExtras: f.instruccionesExtras,
      codigoPostal: f.codigoPostal,
      estado: f.estado,
      pais: f.pais
    };
  }

  /** Valida los campos del formulario con expresiones regulares y retorna los errores encontrados. */
  private validarCampos(valores: any): string[] {
    const errores: string[] = [];

    const rx = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      soloLetras: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
      alfanumerico: /^[a-zA-Z0-9]+$/,
      numerico: /^\d+$/
    };

    if (valores.rfc) {
      const rxRfc = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
      if (!rxRfc.test(valores.rfc))
        errores.push('El RFC no tiene un formato valido.');
    }
    if (!valores.correo || !rx.email.test(valores.correo) || valores.correo.length > 255)
      errores.push('El correo es invalido o excede los 255 caracteres.');

    if (valores.nombre && (valores.nombre.length > 255 || !rx.soloLetras.test(valores.nombre)))
      errores.push('El nombre debe contener solo letras y maximo 255 caracteres.');

    if (valores.apellidoP && (valores.apellidoP.length > 255 || !rx.soloLetras.test(valores.apellidoP)))
      errores.push('El apellido paterno es invalido o excede 255 caracteres.');

    if (valores.apellidoM && (valores.apellidoM.length > 255 || !rx.soloLetras.test(valores.apellidoM)))
      errores.push('El apellido materno es invalido o excede 255 caracteres.');

    if (valores.apodo && valores.apodo.length > 255)
      errores.push('El apodo no puede exceder 255 caracteres.');

    if (valores.estado && valores.estado.length < 3)
      errores.push('El estado debe tener minimo 3 caracteres.');

    if (valores.pais && (valores.pais.length > 255 || !rx.soloLetras.test(valores.pais)))
      errores.push('El pais es invalido o excede 255 caracteres.');

    if (valores.calle && valores.calle.length > 255)
      errores.push('La calle no puede exceder 255 caracteres.');

    if (valores.numeroInterior) {
      const ok = valores.numeroInterior.length <= 11
        && rx.alfanumerico.test(valores.numeroInterior)
        && valores.numeroInterior !== '0';
      if (!ok) errores.push('Numero interior: Maximo 11 caracteres alfanumericos, diferente de 0.');
    }

    if (valores.codigoPostal && (valores.codigoPostal.length > 5 || !rx.numerico.test(valores.codigoPostal)))
      errores.push('Codigo postal: Maximo 5 digitos numericos.');

    if (valores.numeroExterior) {
      const ok = valores.numeroExterior.length <= 11
        && rx.numerico.test(valores.numeroExterior)
        && valores.numeroExterior !== '0';
      if (!ok) errores.push('Numero exterior: Maximo 11 digitos, diferente de 0.');
    }

    if (valores.ciudad && (valores.ciudad.length > 255 || !rx.soloLetras.test(valores.ciudad)))
      errores.push('La ciudad es invalida o excede 255 caracteres.');

    if (valores.telefono && (valores.telefono.length > 10 || !rx.numerico.test(valores.telefono)))
      errores.push('Telefono: Maximo 10 digitos numericos.');

    if (valores.instruccionesExtras && (valores.instruccionesExtras.length > 255 || !rx.soloLetras.test(valores.instruccionesExtras)))
      errores.push('Instrucciones extras: Maximo 255 caracteres alfabeticos.');

    return errores;
  }

  /** Solicita confirmacion si el correo cambia y ejecuta la actualizacion en el backend. */
  private procesarActualizacionSegura(valores: any): void {
    toast.success('Validación de datos exitosa.');

    if (this.correo !== valores.correo) {
      toast.warning('¿Cambiar el correo electrónico?', {
        description: 'Tendrás que validarlo nuevamente.',
        duration: 10000,
        action: {
          label: 'Sí, cambiar',
          onClick: () => this.ejecutarActualizacion()
        },
        cancel: { label: 'Cancelar', onClick: () => { } }
      });
    } else {
      this.ejecutarActualizacion();
    }
  }

  /** Construye el payload y envia la peticion de actualizacion al backend. */
  private ejecutarActualizacion(): void {
    const payload = this.construirPayload();

    this.crudService.ActualizarPersona(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => this.manejarRespuestaBackend(r),
        error: () => toast.error('Error en la actualizacion')
      });
  }

  /** Mapea los valores del formulario a una instancia de PersonaNueva para enviar al backend. */
  private construirPayload(): PersonaNueva {
    const f = this.FormularioDelCliente.value;
    const payload = new PersonaNueva();

    payload.nombre = f.nombre;
    payload.apellidoP = f.apellidoP;
    payload.apellidoM = f.apellidoM;
    payload.apodo = f.apodo;
    payload.calle = f.calle;
    payload.numeroExterior = f.numeroExterior;
    payload.numeroInterior = f.numeroInterior;
    payload.ciudad = f.ciudad;
    payload.rfc = f.rfc;
    payload.estado = f.estado;
    payload.codigoPostal = f.codigoPostal;
    payload.pais = f.pais;
    payload.instruccionesExtras = f.instruccionesExtras;
    payload.correo = this.correo;
    payload.correoNuevo = f.correoNuevo;
    payload.telefono = f.telefono;

    return payload;
  }

  /** Notifica el resultado de la actualizacion y recarga los datos si fue exitosa. */
  private manejarRespuestaBackend(respuesta: any): void {
    if (respuesta?.success === 1) {
      toast.success('Datos actualizados correctamente');
      this.inicializar();
    } else {
      toast.error('Error en los datos recibidos');
    }
  }

}