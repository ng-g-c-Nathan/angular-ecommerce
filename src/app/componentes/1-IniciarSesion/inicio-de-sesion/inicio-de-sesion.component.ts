import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';

/** Componente que gestiona el inicio de sesion del usuario. */
@Component({
  selector: 'app-inicio-de-sesion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './inicio-de-sesion.component.html',
  styleUrls: ['../../../../styles.css']
})
export class InicioDeSesionComponent implements OnInit, OnDestroy {

  /** Icono para mostrar la contrasena. */
  readonly Eye = Eye;

  /** Icono para ocultar la contrasena. */
  readonly EyeOff = EyeOff;

  /** Formulario reactivo con los campos de email y contrasena. */
  formularioDeLogin: FormGroup;

  /** Indica si hay una peticion en curso para deshabilitar el boton de envio. */
  cargando = false;

  /** Controla si la contrasena se muestra en texto plano. */
  mostrarContrasena = false;

  /**
   * @param crudService Servicio para operaciones con la API.
   * @param router      Servicio de navegacion entre rutas.
   * @param global      Servicio de estado global de sesion del usuario.
   */
  constructor(
    private readonly crudService: CrudService,
    private readonly router: Router,
    private readonly global: GlobalService
  ) {
    this.formularioDeLogin = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      contrasena: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  /** @inheritdoc */
  ngOnInit(): void { }

  /** @inheritdoc */
  ngOnDestroy(): void { }

  /** Retorna el control del campo email. */
  get emailCtrl() { return this.formularioDeLogin.get('email')!; }

  /** Retorna el control del campo contrasena. */
  get contrasenaCtrl() { return this.formularioDeLogin.get('contrasena')!; }

  /** Indica si el campo email es invalido y fue tocado por el usuario. */
  get emailInvalido(): boolean {
    return this.emailCtrl.invalid && this.emailCtrl.touched;
  }

  /** Indica si el campo contrasena es invalido y fue tocado por el usuario. */
  get contrasenaInvalida(): boolean {
    return this.contrasenaCtrl.invalid && this.contrasenaCtrl.touched;
  }

  /** Valida el formulario y envia las credenciales al backend para autenticar al usuario. */
  submit(): void {
    this.formularioDeLogin.markAllAsTouched();

    if (this.formularioDeLogin.invalid) {
      toast.error('Corrige los campos antes de continuar.');
      return;
    }

    this.cargando = true;

    this.crudService.Login(this.formularioDeLogin.value).subscribe({
      next: (response: any) => this.manejarRespuestaLogin(response),
      error: (err) => {
        this.cargando = false;
        toast.error(`Error de conexion: ${err}`);
      }
    });
  }

  /** Alterna la visibilidad de la contrasena en el campo de texto. */
  toggleContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  /** Evalua la respuesta del backend y establece la sesion o muestra el error correspondiente. */
  private manejarRespuestaLogin(response: any): void {
    if (response.success) {
      this.establecerSesionExitosa();
    } else {
      this.cargando = false;
      toast.error(response.error || 'Credenciales incorrectas.');
    }
  }

  /** Obtiene el perfil del usuario autenticado, guarda la sesion y redirige al inicio. */
  private establecerSesionExitosa(): void {
    const email = this.emailCtrl.value;

    this.crudService.obtenerApodo(email).subscribe({
      next: (data) => {
        this.global.setUsuario({
          id: data.id,
          email: data.correo,
          apodo: data.apodo,
          admin: data.permisos
        });

        toast.success('Bienvenido de vuelta!');
        this.cargando = false;
        this.router.navigate(['Inicio']);
      },
      error: (err) => {
        this.cargando = false;
        toast.error(`No se pudo obtener el perfil: ${err}`);
      }
    });
  }

  /** Redirige hacia la vista de registro. */
  irARegistrar(): void { this.router.navigate(['registrar']); }

  /** Redirige hacia la vista de recuperacion de contrasena. */
  irAOlvidar(): void { this.router.navigate(['Olvido']); }
}