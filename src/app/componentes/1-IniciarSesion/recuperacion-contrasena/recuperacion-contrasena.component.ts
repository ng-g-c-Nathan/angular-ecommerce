import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { switchMap, throwError } from 'rxjs';
import { LucideAngularModule, Mail, Send, AlertCircle, CheckCircle } from 'lucide-angular';
import { CrudService } from '../../../servicio/crud.service';
import { AppComponent } from '../../../app.component';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
/** Componente que gestiona el flujo de recuperacion de contrasena mediante correo electronico. */
@Component({
  selector: 'app-recuperacion-contrasena',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  templateUrl: './recuperacion-contrasena.component.html',
  styleUrls: ['../../../../styles.css']
})
export class RecuperacionContrasenaComponent implements OnInit, OnDestroy {

  /** Icono de correo electronico. */
  readonly MailIcon = Mail;

  /** Icono de envio para el boton de submit. */
  readonly SendIcon = Send;

  /** Icono de alerta para estados de error. */
  readonly AlertCircleIcon = AlertCircle;

  /** Icono de confirmacion para estados exitosos. */
  readonly CheckCircleIcon = CheckCircle;

  /** Formulario reactivo para la captura del correo electronico. */
  FormularioPass: FormGroup;

  /** Indica si hay una peticion en curso para deshabilitar el boton de envio. */
  cargando = false;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param crudService Servicio para operaciones con la API.
   * @param router      Servicio de navegacion entre rutas.
   * @param padre       Referencia al componente raiz para controlar el footer global.
   */
  constructor(
    private crudService: CrudService,
    private router: Router,
    private padre: AppComponent
  ) {
    this.FormularioPass = new FormGroup({
      Email: new FormControl('', [
        Validators.required,
        Validators.email
      ])
    });
  }

  /** Oculta el footer global al inicializar el componente. */
  ngOnInit(): void {
    this.padre.Footer = false;
  }

  /** Restaura el footer global y cancela las suscripciones activas. */
  ngOnDestroy(): void {
    this.padre.Footer = true;
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Retorna el control del campo de correo electronico. */
  get emailControl(): FormControl {
    return this.FormularioPass.get('Email') as FormControl;
  }

  /** Indica si el campo de correo es invalido y fue tocado por el usuario. */
  get emailInvalido(): boolean {
    return this.emailControl.invalid && this.emailControl.touched;
  }

  /** Indica si el campo de correo es valido y fue tocado por el usuario. */
  get emailValido(): boolean {
    return this.emailControl.valid && this.emailControl.touched;
  }

  /** Valida el formulario e inicia el flujo de recuperacion si el correo es correcto. */
  submit(): void {
    if (this.FormularioPass.invalid) {
      this.FormularioPass.markAllAsTouched();
      toast.error('Correo invalido', {
        description: 'Por favor ingresa un correo electronico valido.'
      });
      return;
    }

    this.enviarCorreo();
  }

  /** Verifica si el correo existe en el sistema y solicita el envio del mensaje de recuperacion. */
  private enviarCorreo(): void {
    const email = this.FormularioPass.value.Email;
    this.cargando = true;

    if (environment.demo === 'SI') {
      const loadingToast = toast.loading('Verificando correo...', {
        description: 'Estamos comprobando si el correo esta registrado.'
      });

      this.crudService.ExisteCorreo(email).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          toast.dismiss(loadingToast);

          if (response.success === 1) {
            toast.info('Modo demo activo', {
              description: 'No se envía correo. Tu contraseña ha sido restablecida a: 12345678'
            });
          } else {
            toast.error('Usuario no encontrado', {
              description: 'No existe ninguna cuenta con ese correo.'
            });
          }

          this.cargando = false;
        },
        error: () => {
          toast.dismiss(loadingToast);
          toast.error('Error de conexion', {
            description: 'No pudimos conectar con el servidor.'
          });
          this.cargando = false;
        }
      });

      return;
    }

    const loadingToast = toast.loading('Verificando correo...', {
      description: 'Estamos comprobando si el correo esta registrado.'
    });

    this.crudService.ExisteCorreo(email).pipe(
      switchMap((response: any) => {
        if (response.success !== 1) {
          return throwError(() => ({ tipo: 'not_found' }));
        }
        return this.crudService.MandarCorreo(email);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        toast.dismiss(loadingToast);

        if (response.success === 1) {
          toast.success('Correo enviado!', {
            description: 'Revisa tu bandeja de entrada.'
          });
        } else {
          toast.error('No se pudo enviar el correo', {
            description: 'El servidor no pudo procesar la solicitud.'
          });
        }

        this.cargando = false;
      },
      error: (err) => {
        toast.dismiss(loadingToast);

        if (err?.tipo === 'not_found') {
          toast.error('Usuario no encontrado', {
            description: 'No existe ninguna cuenta con ese correo.'
          });
        } else {
          toast.error('Error de conexion', {
            description: 'No pudimos conectar con el servidor.'
          });
        }

        this.cargando = false;
      }
    });
  }

  /** Redirige al usuario hacia la vista de recuperacion de contrasena. */
  IrHaciaOlvidar(): void {
    this.router.navigate(['Olvido'], {
      state: { email: '' }
    });
  }
}