import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CrudService } from '../../../servicio/crud.service';
import { ActivatedRoute } from '@angular/router';
import { AppComponent } from '../../../app.component';
import { LucideAngularModule, KeyRound, ShieldAlert, Eye, EyeOff } from 'lucide-angular';
import { toast } from 'ngx-sonner';
import { GlobalService } from '../../../servicio/global.service';

/** Componente para restablecer la contrasena del usuario mediante un token recibido por correo. */
@Component({
  selector: 'app-actualizar-contrasena',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
  ],
  templateUrl: './actualizar-contrasena.component.html',
  styleUrls: ['../../../../styles.css']
})
export class ActualizarContrasenaComponent implements OnInit, OnDestroy {

  /** Icono de llave para los campos de contrasena. */
  readonly KeyRound = KeyRound;

  /** Icono de escudo para el estado de token invalido. */
  readonly ShieldAlert = ShieldAlert;

  /** Icono para mostrar la contrasena. */
  readonly Eye = Eye;

  /** Icono para ocultar la contrasena. */
  readonly EyeOff = EyeOff;

  /** Controla si la primera contrasena se muestra en texto plano. */
  public mostrarPass1: boolean = false;

  /** Controla si la segunda contrasena se muestra en texto plano. */
  public mostrarPass2: boolean = false;

  /** Token de restablecimiento obtenido desde la URL. */
  public ID: any;

  /** ID del cliente retornado por el backend al validar el token. */
  public IDCliente: any;

  /** Formulario reactivo con las dos contrasenas ingresadas por el usuario. */
  public formularioDeCliente: FormGroup;

  /** Formulario reducido con los datos minimos requeridos por el backend. */
  public formularioReducido: FormGroup;

  /** Indica si el token es valido y el usuario puede operar en esta vista. */
  public PuedoEstarAqui: boolean = true;

  /**
   * @param crudService   Servicio para operaciones con la API.
   * @param router        Servicio de navegacion entre rutas.
   * @param route         Servicio para leer los parametros de la ruta activa.
   * @param padre         Referencia al componente raiz para controlar el footer global.
   * @param globalService Servicio de estado global de sesion del usuario.
   */
  constructor(
    private crudService: CrudService,
    private router: Router,
    private route: ActivatedRoute,
    private padre: AppComponent,
    private globalService: GlobalService
  ) {
    this.formularioDeCliente = new FormGroup({
      pass1: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
      pass2: new FormControl('', [Validators.required])
    });

    this.formularioReducido = new FormGroup({
      Email: new FormControl(''),
      pass1: new FormControl('')
    });
  }

  /** Oculta el footer, obtiene el token desde la URL y valida su vigencia contra el backend. */
  ngOnInit(): void {

    this.padre.Footer = false;

    this.route.paramMap.subscribe(params => {
      this.ID = params.get('id');
    });

    this.crudService.Restablecer(this.ID).subscribe({
      next: (response: any) => {
        console.log(response);

        if (response.success === 1) {
          this.IDCliente = response.ID_Cliente;
          this.PuedoEstarAqui = true;
        } else {
          this.IDCliente = '';
          this.PuedoEstarAqui = false;
          toast.error('Token invalido o expirado. Solicita uno nuevo.');

          setTimeout(() => {
            this.router.navigate(['Login']);
          }, 2000);
        }
      },

      error: (error) => {
        this.IDCliente = '';
        this.PuedoEstarAqui = false;

        if (error.status === 404) {
          toast.error('Token invalido o expirado. Solicita uno nuevo.');
        } else {
          toast.error('Ocurrio un error al verificar el token. Intenta mas tarde.');
        }

        setTimeout(() => {
          this.router.navigate(['Login']);
        }, 2000);
      }
    });
  }

  /** Restaura la visibilidad del footer global al destruir el componente. */
  ngOnDestroy(): void {
    this.padre.Footer = true;
  }

  /** Alterna la visibilidad de la primera contrasena. */
  togglePass1(): void {
    this.mostrarPass1 = !this.mostrarPass1;
  }

  /** Alterna la visibilidad de la segunda contrasena. */
  togglePass2(): void {
    this.mostrarPass2 = !this.mostrarPass2;
  }

  /** Valida las contrasenas y envia la nueva al backend. Redirige al login si el proceso es exitoso. */
  submit(): void {

    if (!this.PuedoEstarAqui) return;

    const pass1 = this.formularioDeCliente.value.pass1 as string;
    const pass2 = this.formularioDeCliente.value.pass2 as string;

    if (pass1 !== pass2) {
      toast.error('Las contrasenas no coinciden.');
      return;
    }

    if (pass1.length < 8 || pass1.length > 20) {
      toast.warning('La contrasena debe tener entre 8 y 20 caracteres.');
      return;
    }

    this.formularioReducido.patchValue({
      Email: this.IDCliente,
      pass1
    });

    this.crudService.RestablecerPassword(this.formularioReducido.value).subscribe({
      next: (response) => {

        this.globalService.cerrarSesion();

        toast.success('Contrasena restablecida con exito.');

        setTimeout(() => {
          this.router.navigate(['Login'], { state: { email: '' } });
        }, 1500);

      },

      error: (error) => {
        console.error('Error al restablecer la contrasena:', error);
        toast.error('Ocurrio un error al restablecer la contrasena. Intenta de nuevo.');
      }
    });
  }
}