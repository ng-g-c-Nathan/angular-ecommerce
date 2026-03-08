import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';
import { Subject, switchMap, throwError, takeUntil } from 'rxjs';
import { CrudService } from '../../../servicio/crud.service';
import { environment } from '../../../../environments/environment';
/** Validador personalizado que verifica que los campos pass1 y pass2 sean identicos. */
function contrasenasCoincidenValidator(group: AbstractControl): ValidationErrors | null {
  const pass1 = group.get('pass1')?.value;
  const pass2 = group.get('pass2')?.value;
  return pass1 && pass2 && pass1 !== pass2 ? { noCoinciden: true } : null;
}

/** Componente que gestiona el registro de una nueva cuenta de usuario. */
@Component({
  selector: 'app-registrar-cuenta-nueva',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './registrar-cuenta-nueva.component.html',
  styleUrls: ['../../../../styles.css']
})
export class RegistrarCuentaNuevaComponent implements OnInit, OnDestroy {

  /** Icono para mostrar la contrasena. */
  readonly Eye = Eye;

  /** Icono para ocultar la contrasena. */
  readonly EyeOff = EyeOff;

  /** Formulario reactivo con los campos de correo y contrasenas. */
  formularioDeCliente: FormGroup;

  /** Indica si el usuario acepto los terminos y condiciones. */
  aceptoTOS = false;

  /** Controla la visibilidad del modal de terminos y condiciones. */
  modalTerminosAbierto = false;

  /** Indica si hay una peticion en curso para deshabilitar el boton de envio. */
  cargando = false;

  /** Controla si la primera contrasena se muestra en texto plano. */
  mostrarPass1 = false;

  /** Controla si la segunda contrasena se muestra en texto plano. */
  mostrarPass2 = false;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /** Texto completo de los terminos y condiciones mostrado en el modal. */
  readonly terminosYCondiciones =
    'Aceptacion: Al usar este sitio web, aceptas estos terminos.\n' +
    'Propiedad: El contenido del sitio web es propiedad de Electrotech.\n' +
    'Uso: Puedes usar el sitio web para tu uso personal y no comercial.\n' +
    'Prohibiciones: No puedes copiar, distribuir, modificar o vender el contenido.\n' +
    'Responsabilidad: No somos responsables por danos causados por el uso del sitio.\n' +
    'Ley aplicable: Estos terminos se rigen por la ley de Uatx.\n' +
    'Contacto: Si tienes preguntas, contacta a 246 179 5949.\n' +
    'Ultima actualizacion: 30/Junio/2024';

  /**
   * @param crudService Servicio para operaciones con la API.
   * @param router      Servicio de navegacion entre rutas.
   */
  constructor(
    private readonly crudService: CrudService,
    private readonly router: Router
  ) {
    this.formularioDeCliente = new FormGroup(
      {
        Email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(254)]),
        pass1: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]),
        pass2: new FormControl('', [Validators.required])
      },
      { validators: contrasenasCoincidenValidator }
    );
  }

  /** @inheritdoc */
  ngOnInit(): void { }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Retorna el control del campo de correo electronico. */
  get emailCtrl() { return this.formularioDeCliente.get('Email')!; }

  /** Retorna el control del campo de primera contrasena. */
  get pass1Ctrl() { return this.formularioDeCliente.get('pass1')!; }

  /** Retorna el control del campo de confirmacion de contrasena. */
  get pass2Ctrl() { return this.formularioDeCliente.get('pass2')!; }

  /** Indica si el campo de correo es invalido y fue tocado por el usuario. */
  get emailInvalido(): boolean { return this.emailCtrl.invalid && this.emailCtrl.touched; }

  /** Indica si el campo de primera contrasena es invalido y fue tocado por el usuario. */
  get pass1Invalida(): boolean { return this.pass1Ctrl.invalid && this.pass1Ctrl.touched; }

  /** Indica si la confirmacion de contrasena es invalida o no coincide con la primera. */
  get pass2Invalida(): boolean {
    return this.pass2Ctrl.touched &&
      (this.pass2Ctrl.invalid || !!this.formularioDeCliente.errors?.['noCoinciden']);
  }

  /** Valida el formulario, verifica la aceptacion de TOS y registra la cuenta en el backend. */
  submit(): void {
  this.formularioDeCliente.markAllAsTouched();

  if (this.formularioDeCliente.invalid) {
    toast.error('Corrige los campos antes de continuar.');
    return;
  }

  if (!this.aceptoTOS) {
    toast.error('Debes aceptar los terminos y condiciones.');
    return;
  }

  const { Email: email, pass1: contrasena } = this.formularioDeCliente.value;
  this.cargando = true;

  if (environment.demo === 'SI') {
    this.crudService.AgregarCliente({ email, contrasena }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (!response.success) {
          this.cargando = false;
          toast.error(response.error || 'Error al crear la cuenta.');
          return;
        }
        toast.info('Modo demo activo', {
          description: 'Cuenta creada. No se requiere activacion por correo.'
        });
        this.router.navigate(['Login']);
      },
      error: (err: Error) => {
        this.cargando = false;
        toast.error(err?.message || 'Error desconocido. Intenta mas tarde.');
      }
    });
    return;
  }

  this.crudService.AgregarCliente({ email, contrasena }).pipe(
    switchMap((response) => {
      if (!response.success) {
        return throwError(() => new Error(response.error || 'Error al crear la cuenta.'));
      }
      return this.crudService.ActivarCorreo(email);
    }),
    takeUntil(this.destroy$)
  ).subscribe({
    next: () => {
      toast.success('Cuenta creada. Revisa tu correo para activarla.');
      this.router.navigate(['Login']);
    },
    error: (err: Error) => {
      this.cargando = false;
      toast.error(err?.message || 'Error desconocido. Intenta mas tarde.');
    }
  });
}

  /** Alterna la visibilidad de la primera contrasena. */
  togglePass1(): void { this.mostrarPass1 = !this.mostrarPass1; }

  /** Alterna la visibilidad de la segunda contrasena. */
  togglePass2(): void { this.mostrarPass2 = !this.mostrarPass2; }

  /** Alterna el estado del checkbox de TOS y abre el modal si se acepta. */
  toggleCheckbox(): void {
    this.aceptoTOS = !this.aceptoTOS;
    if (this.aceptoTOS) this.abrirTerminos();
  }

  /** Abre el modal de terminos y condiciones. */
  abrirTerminos(): void { this.modalTerminosAbierto = true; }

  /** Cierra el modal de terminos y condiciones. */
  cerrarTerminos(): void { this.modalTerminosAbierto = false; }

  /** Redirige al usuario hacia la vista de login. */
  irALogin(): void { this.router.navigate(['Login']); }
}