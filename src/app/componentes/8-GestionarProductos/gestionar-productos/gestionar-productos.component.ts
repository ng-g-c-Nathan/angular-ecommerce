import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, FormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { GlobalService } from '../../../servicio/global.service';
import { environment } from '../../../../environments/environment';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import {
  LucideAngularModule, Pencil, Trash2, Tag, AlignLeft,
  DollarSign, Boxes, Layers, Truck, Image, Save,
  Hash, CheckCircle, RefreshCw, PlusCircle
} from 'lucide-angular';

/** Componente de administracion que permite agregar, editar y eliminar productos del catalogo. */
@Component({
  selector: 'app-gestionar-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
    NgxSonnerToaster
  ],
  templateUrl: './gestionar-productos.component.html',
  styleUrls: ['../../../../styles.css', './gestionar-productos.component.css']
})
export class GestionarProductosComponent implements OnInit, OnDestroy {

  /** URL base de la API para construir rutas de imagenes. */
  readonly URL = environment.fotosUrl;

  /** Icono de lapiz para la accion de editar. */
  readonly Pencil = Pencil;

  /** Icono de papelera para la accion de eliminar. */
  readonly Trash2 = Trash2;

  /** Icono de etiqueta para el campo de categoria. */
  readonly Tag = Tag;

  /** Icono de texto alineado para el campo de descripcion. */
  readonly AlignLeft = AlignLeft;

  /** Icono de signo de dolar para el campo de precio. */
  readonly DollarSign = DollarSign;

  /** Icono de cajas para el campo de stock. */
  readonly Boxes = Boxes;

  /** Icono de capas para representar categorias. */
  readonly Layers = Layers;

  /** Icono de camion para el campo de proveedor. */
  readonly Truck = Truck;

  /** Icono de imagen para la carga de foto del producto. */
  readonly Image = Image;

  /** Icono de guardar para confirmar cambios. */
  readonly Save = Save;

  /** Icono de numeral para el campo de ID. */
  readonly Hash = Hash;

  /** Icono de confirmacion para estados exitosos. */
  readonly CheckCircle = CheckCircle;

  /** Icono de refresco para la accion de actualizar. */
  readonly RefreshCw = RefreshCw;

  /** Icono de mas para la accion de agregar. */
  readonly PlusCircle = PlusCircle;

  /** Pestaña activa en la interfaz de gestion de productos. */
  tabActivo: 'agregar' | 'editar' | 'borrar' = 'agregar';

  /** Datos del proveedor actualmente seleccionado. */
  proveedor: any;

  /** Lista de proveedores disponibles para el selector del formulario de edicion. */
  opcionesProveedor: any[] = [];

  /** Formulario reactivo para agregar un nuevo producto. */
  formularioAgregar: FormGroup;

  /** Formulario reactivo para editar un producto existente. */
  formularioAEditar: FormGroup;

  /** Formulario reactivo para buscar y eliminar un producto. */
  formularioBorrar: FormGroup;

  /** Controla si los campos del formulario de edicion son visibles. */
  mostrarCamposEditar = false;

  /** Controla si los campos del formulario de borrado son visibles. */
  mostrarCamposBorrar = false;

  /** ID del ultimo producto agregado, usado para asociar la imagen subida. */
  private idProductoNuevo: number | null = null;

  /** ID del producto actualmente en edicion, usado para actualizar su imagen. */
  private idProductoEditar: number | null = null;

  /** Archivo de imagen seleccionado para el formulario de agregar. */
  selectedFileAgregar: File | null = null;

  /** Archivo de imagen seleccionado para el formulario de editar. */
  selectedFileEditar: File | null = null;

  /** Nombre del archivo seleccionado en el formulario de agregar. */
  selectedFileAgregarName: string | undefined;

  /** Nombre del archivo seleccionado en el formulario de editar. */
  selectedFileEditarName: string | undefined;

  /** URL de previsualización de la imagen en el formulario de agregar. */
  previewAgregar: string | null = null;

  /** URL de la imagen actual del producto en edicion. */
  previewEditarActual: string | null = null;

  /** URL de previsualización de la nueva imagen seleccionada en edicion. */
  previewEditarNueva: string | null = null;

  /** URL de la imagen del producto encontrado en el formulario de borrado. */
  previewBorrar: string | null = null;

  /** Categoria actualmente asignada al producto en edicion. */
  categoriaElegida: string = '';

  /** Lista de categorias excluyendo la categoria actual del producto en edicion. */
  categoriasMenos: string[] = [];

  /** Lista completa de categorias disponibles. */
  categorias: string[] = [];

  /** Categoria seleccionada en el formulario de agregar. */
  categoriaSeleccionadaAgregar: string = 'default';

  /** Texto de categoria personalizada en el formulario de agregar. */
  otraCategoriaAgregar: string = '';

  /** Categoria seleccionada en el formulario de editar. */
  categoriaSeleccionadaEditar: string = 'default';

  /** Texto de categoria personalizada en el formulario de editar. */
  otraCategoriaEditar: string = '';

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
    private readonly globalService: GlobalService
  ) {
    this.formularioAgregar = new FormGroup({
      agregarNombre:      new FormControl(''),
      agregarDescripcion: new FormControl(''),
      agregarPrecio:      new FormControl('', [Validators.min(0.01)]),
      agregarCategoria:   new FormControl('default'),
      agregarProveedor:   new FormControl(''),
      agregarStock:       new FormControl('', [Validators.min(0)])
    });

    this.formularioAEditar = new FormGroup({
      EditarID:              new FormControl(''),
      EditarNombre:          new FormControl(''),
      EditarDescripcion:     new FormControl(''),
      EditarPrecio:          new FormControl('', [Validators.min(0.01)]),
      EditarCategoria:       new FormControl(''),
      EditarProveedor:       new FormControl(''),
      EditarNombreProveedor: new FormControl(''),
      EditarStock:           new FormControl('', [Validators.min(0)])
    });

    this.formularioBorrar = new FormGroup({
      BorrarID:          new FormControl(''),
      BorrarNombre:      new FormControl(''),
      BorrarDescripcion: new FormControl(''),
      BorrarPrecio:      new FormControl(''),
      BorrarCategoria:   new FormControl(''),
      BorrarProveedor:   new FormControl(''),
      BorrarStock:       new FormControl('')
    });
  }

  /** Verifica que el usuario sea administrador y carga categorias y proveedores disponibles. */
  ngOnInit(): void {
    if (!this.globalService.getUsuario() || !this.globalService.esAdmin()) {
      this.toLogin();
      return;
    }

    this.obtenerCategorias();

    this.crudService.ObtenerProveedores().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (r) => { this.proveedor = r; },
      error: () => toast.error('Error al cargar los proveedores.')
    });
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Cambia la pestaña activa y oculta los campos de edicion y borrado. */
  setTab(tab: 'agregar' | 'editar' | 'borrar'): void {
    this.tabActivo           = tab;
    this.mostrarCamposEditar = false;
    this.mostrarCamposBorrar = false;
  }

  /** Cierra la sesion del usuario y redirige al login. */
  toLogin(): void {
    this.globalService.cerrarSesion();
    this.router.navigate(['Login']);
  }

  /** Valida el formulario y envia los datos del nuevo producto al backend. */
  agregar(): void {
    const v = this.formularioAgregar.value;

    const campos = [
      v.agregarNombre, v.agregarDescripcion, v.agregarPrecio,
      v.agregarCategoria, v.agregarProveedor, v.agregarStock
    ];

    if (campos.some(c => !c && c !== 0)) {
      toast.error('Formulario incompleto', { description: 'Por favor, completa todos los campos.' });
      return;
    }

    if (campos.some(c => String(c).length > 255)) {
      toast.error('Texto demasiado largo', { description: 'Alguno de los campos supera los 255 caracteres.' });
      return;
    }

    const precio = Number(v.agregarPrecio);
    if (isNaN(precio) || precio <= 0) {
      toast.error('Precio invalido', { description: 'El precio debe ser mayor a 0.' });
      return;
    }

    const stock = Number(v.agregarStock);
    if (isNaN(stock) || stock < 0) {
      toast.error('Stock invalido', { description: 'El stock no puede ser negativo.' });
      return;
    }

    this.crudService.AgregarProductoNuevo(v).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response?.success && response?.id_producto) {
          const idProducto: number = response.id_producto;
          this.idProductoNuevo = idProducto;
          this.subirFoto();
          this.limpiarFormulario();
          toast.success(`Producto agregado (ID: ${idProducto})`, {
            description: 'Deseas verlo?',
            action: {
              label: 'Ver producto',
              onClick: () => this.router.navigate(['/Producto/', idProducto], {
                state: { email: this.globalService.getUsuario()?.email }
              })
            }
          });
        } else {
          toast.error('Error al agregar', { description: 'No se recibio un ID valido del servidor.' });
        }
      },
      error: () => toast.error('Error de conexion', { description: 'No se pudo contactar al servidor.' })
    });
  }

  /** Consulta el producto por ID y precarga sus datos en el formulario de edicion. */
  saberQueEditar(): void {
    const id = this.formularioAEditar.value.EditarID;

    if (!id) {
      this.mostrarCamposEditar     = false;
      this.previewEditarActual     = null;
      this.previewEditarNueva      = null;
      this.categoriaSeleccionadaEditar = 'default';
      this.formularioAEditar.patchValue({
        EditarNombre: '', EditarDescripcion: '', EditarPrecio: '',
        EditarCategoria: '', EditarProveedor: '', EditarNombreProveedor: '', EditarStock: ''
      });
      return;
    }

    this.crudService.RevisarProducto(id).pipe(
      switchMap((respuesta: any) => {
        const p = Array.isArray(respuesta) ? respuesta[0] : respuesta;

        if (!p || !p.nombre) {
          this.mostrarCamposEditar = false;
          this.previewEditarActual = null;
          toast.error('Producto no encontrado', { description: `No existe un producto con el ID "${id}".` });
          throw new Error('Producto no encontrado');
        }

        this.categoriaElegida    = p.categoria;
        this.previewEditarActual = `${this.URL}/archivos/assets/productos/Imagen${p.id}.gif`;
        this.previewEditarNueva  = null;

        this.formularioAEditar.patchValue({
          EditarNombre:          p.nombre,
          EditarDescripcion:     p.descripcion,
          EditarPrecio:          p.precio,
          EditarCategoria:       p.categoria,
          EditarNombreProveedor: p.nombreEmpresa,
          EditarStock:           p.stock
        });

        this.categoriaSeleccionadaEditar = p.categoria;
        this.obtenerCategoriasMenos();

        return this.crudService.ObtenerProveedoresMenos(p.idProveedor).pipe(
          switchMap((data: any) => {
            return [{ data, idProveedor: p.idProveedor, nombreEmpresa: p.nombreEmpresa }];
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ data, idProveedor, nombreEmpresa }: any) => {
        if (!Array.isArray(data)) return;

        this.opcionesProveedor = [
          { id: String(idProveedor), nombre: nombreEmpresa },
          ...data.map((prov: any) => ({
            id:     String(prov.idProveedor ?? prov.ID_Proveedor ?? prov.id),
            nombre: prov.nombreEmpresa ?? prov.NombreEmpresa ?? prov.nombre
          }))
        ];

        this.formularioAEditar.patchValue({ EditarProveedor: String(idProveedor) });
        this.mostrarCamposEditar = true;
      },
      error: () => {
        this.mostrarCamposEditar = false;
      }
    });
  }

  /** Valida los campos del formulario y solicita confirmacion antes de actualizar el producto. */
  actualizar(): void {
    const v = this.formularioAEditar.value;

    const errores: string[] = [];
    if (String(v.EditarNombre).length      > 255) errores.push('El nombre es demasiado largo.');
    if (String(v.EditarDescripcion).length > 255) errores.push('La descripcion es demasiado larga.');
    if (String(v.EditarCategoria).length   > 255) errores.push('La categoria es demasiado larga.');
    if (String(v.EditarProveedor).length   > 255) errores.push('El proveedor es demasiado largo.');

    const precio = Number(v.EditarPrecio);
    if (isNaN(precio) || precio <= 0) errores.push('El precio debe ser mayor a 0.');

    const stock = Number(v.EditarStock);
    if (isNaN(stock) || stock < 0) errores.push('El stock no puede ser negativo.');

    if (errores.length > 0) {
      toast.error('Campos invalidos', { description: errores.join(' ') });
      return;
    }

    toast('Confirmar actualizacion?', {
      action: { label: 'Si, actualizar', onClick: () => this.ejecutarActualizacion() },
      cancel: { label: 'Cancelar',       onClick: () => { } }
    });
  }

  /** Envia la actualizacion del producto al backend junto con su nueva imagen si fue cambiada. */
  private ejecutarActualizacion(): void {
    this.idProductoEditar = this.formularioAEditar.value.EditarID;
    this.actualizarFoto();

    this.crudService.ActualizarProducto(this.formularioAEditar.value).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (respuesta: any) => {
        if (respuesta?.success === 1) {
          toast.success('Actualizacion exitosa.');
        } else {
          toast.error('La actualizacion fallo', { description: 'El servidor no confirmo el cambio.' });
        }
      },
      error: () => toast.error('Error de conexion', { description: 'No se pudo contactar al servidor.' })
    });
  }

  /** Consulta el producto por ID y precarga sus datos en el formulario de borrado. */
  queBorrar(): void {
    const id = this.formularioBorrar.value.BorrarID;

    if (!id) {
      this.mostrarCamposBorrar = false;
      this.previewBorrar       = null;
      this.formularioBorrar.patchValue({
        BorrarNombre: '', BorrarDescripcion: '', BorrarPrecio: '',
        BorrarCategoria: '', BorrarProveedor: '', BorrarStock: ''
      });
      return;
    }

    this.crudService.RevisarBorrar(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (respuesta: any) => {
        const p = Array.isArray(respuesta) ? respuesta[0] : respuesta;

        if (!p || !p.nombre) {
          this.mostrarCamposBorrar = false;
          this.previewBorrar       = null;
          toast.error('Producto no encontrado', { description: `No existe un producto con el ID "${id}".` });
          return;
        }

        this.previewBorrar = `${this.URL}/archivos/assets/productos/Imagen${id}.gif`;

        this.formularioBorrar.patchValue({
          BorrarNombre:      p.nombre,
          BorrarDescripcion: p.descripcion,
          BorrarPrecio:      p.precio,
          BorrarCategoria:   p.categoria,
          BorrarProveedor:   p.nombreEmpresa,
          BorrarStock:       p.stock
        });

        this.mostrarCamposBorrar = true;
      },
      error: () => toast.error('Error al buscar el producto.')
    });
  }

  /** Solicita confirmacion antes de ejecutar el borrado del producto. */
  borrar(): void {
    toast('Confirmar eliminacion?', {
      description: 'Esta accion no se puede deshacer.',
      action: { label: 'Si, borrar', onClick: () => this.ejecutarBorrado() },
      cancel: { label: 'Cancelar',   onClick: () => { } }
    });
  }

  /** Elimina el producto del backend junto con su imagen y limpia el formulario. */
  private ejecutarBorrado(): void {
    const id = this.formularioBorrar.value.BorrarID;

    this.crudService.BorrarProducto(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.crudService.BorrarFotoProducto(id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => { },
          error: (err) => {
            if (err.status === 200) return;
            toast.error('Error al eliminar la imagen.');
          }
        });

        this.formularioBorrar.reset({
          BorrarID: '', BorrarNombre: '', BorrarDescripcion: '',
          BorrarPrecio: '', BorrarCategoria: '', BorrarProveedor: '', BorrarStock: ''
        });
        this.previewBorrar       = null;
        this.mostrarCamposBorrar = false;
        toast.success('Producto eliminado correctamente.');
      },
      error: () => toast.error('Error al eliminar el producto.')
    });
  }

  /** Captura el archivo seleccionado y genera una previsualización para el formulario de agregar. */
  onFileSelectedAgregar(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFileAgregar     = event.target.files[0];
      this.selectedFileAgregarName = this.selectedFileAgregar?.name;
      this.previewAgregar          = URL.createObjectURL(this.selectedFileAgregar!);
    }
  }

  /** Captura el archivo seleccionado y genera una previsualización para el formulario de editar. */
  onFileSelectedEditar(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFileEditar     = event.target.files[0];
      this.selectedFileEditarName = this.selectedFileEditar?.name;
      this.previewEditarNueva     = URL.createObjectURL(this.selectedFileEditar!);
    }
  }

  /** Sube la imagen del nuevo producto al servidor usando el ID recibido del backend. */
  subirFoto(): void {
    if (!this.selectedFileAgregar || !this.idProductoNuevo) {
      toast.warning('Sin imagen', { description: 'No se ha seleccionado ningun archivo.' });
      return;
    }
    this.crudService.uploadFileProducto(this.selectedFileAgregar, this.idProductoNuevo).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next:  () => toast.success('Imagen subida correctamente.'),
      error: () => toast.error('Error al subir la imagen.')
    });
  }

  /** Actualiza la imagen del producto editado en el servidor. */
  actualizarFoto(): void {
    if (!this.selectedFileEditar || !this.idProductoEditar) {
      toast.warning('Sin imagen nueva', { description: 'No se ha seleccionado ningun archivo.' });
      return;
    }
    this.crudService.actualizarFileProducto(this.selectedFileEditar, this.idProductoEditar).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next:  () => toast.success('Imagen actualizada correctamente.'),
      error: () => toast.error('Error al actualizar la imagen.')
    });
  }

  /** Consulta todas las categorias disponibles desde el backend. */
  obtenerCategorias(): void {
    this.crudService.ConsultarCategorias().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        this.categorias = Array.isArray(data)
          ? data.map((item: any) => typeof item === 'string' ? item : item?.Categoria ?? '').filter(Boolean)
          : [];
      },
      error: () => toast.error('Error al cargar las categorias.')
    });
  }

  /** Consulta las categorias excluyendo la categoria actual del producto en edicion. */
  obtenerCategoriasMenos(): void {
    this.crudService.ConsultarCategoriasMenos(this.categoriaElegida).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        this.categoriasMenos = Array.isArray(data)
          ? data.map((item: any) => typeof item === 'string' ? item : item?.Categoria ?? '').filter(Boolean)
          : [];
      },
      error: () => toast.error('Error al cargar las categorias.')
    });
  }

  /** Actualiza la categoria seleccionada en el formulario de agregar y limpia el campo personalizado. */
  onCategoriaAgregar(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.categoriaSeleccionadaAgregar = valor;
    if (valor !== '') this.otraCategoriaAgregar = '';
  }

  /** Actualiza la categoria seleccionada en el formulario de editar y limpia el campo personalizado. */
  onCategoriaEditar(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.categoriaSeleccionadaEditar = valor;
    if (valor !== '') this.otraCategoriaEditar = '';
  }

  /** Resetea el formulario de agregar y limpia la previsualización de imagen. */
  limpiarFormulario(): void {
    this.formularioAgregar.reset({
      agregarNombre:      '',
      agregarDescripcion: '',
      agregarPrecio:      '',
      agregarCategoria:   'default',
      agregarProveedor:   '',
      agregarStock:       ''
    });
    this.categoriaSeleccionadaAgregar = 'default';
    this.previewAgregar               = null;
    this.selectedFileAgregar          = null;
    this.selectedFileAgregarName      = undefined;
  }
}