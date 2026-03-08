import { Component, OnDestroy, OnInit } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppComponent } from '../../../app.component';
import { Subject, switchMap, takeUntil } from 'rxjs';

/** Componente que gestiona la activacion de cuentas de usuario mediante un enlace enviado por correo. */
@Component({
  selector: 'app-validar-correo',
  standalone: true,
  imports: [],
  templateUrl: './validar-correo.component.html',
  styleUrl: '../../../../styles.css'
})
export class ValidarCorreoComponent implements OnInit, OnDestroy {

  /** Identificador de activacion obtenido desde el parametro de ruta. */
  ID: any;

  /** Contador regresivo en segundos antes de redirigir al login. */
  contador: number;

  /** Mensaje que muestra el resultado del proceso de validacion al usuario. */
  QuePaso: String;

  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param crudService Servicio para operaciones con la API.
   * @param route       Servicio para leer los parametros de la ruta activa.
   * @param router      Servicio de navegacion entre rutas.
   * @param padre       Referencia al componente raiz para controlar el footer global.
   */
  constructor(
    private crudService: CrudService,
    private route: ActivatedRoute,
    private router: Router,
    private padre: AppComponent
  ) {
    this.contador = 10;
    this.QuePaso  = '';
  }

  /** Decrementa el contador cada segundo y redirige al login cuando llega a cero. */
  iniciarContador(): void {
    const intervalo = setInterval(() => {
      if (this.contador > 0) {
        this.contador--;
      } else {
        clearInterval(intervalo);
        this.IrHaciaLogin();
      }
    }, 1000);
  }

  /** Redirige al usuario hacia la vista de login. */
  IrHaciaLogin(): void {
    this.router.navigate(['Login'], { state: { email: '' } });
  }

  /** Restaura el footer global y cancela las suscripciones activas. */
  ngOnDestroy(): void {
    this.padre.Footer = true;
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Oculta el footer, obtiene el token desde la URL, valida la cuenta en el backend e inicia el contador de redireccion. */
  ngOnInit(): void {
    this.padre.Footer = false;

    this.route.paramMap.pipe(
      switchMap(params => {
        this.ID = params.get('id');
        return this.crudService.Verify(this.ID);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: string) => {
        this.QuePaso = 'Validacion exitosa :)';
        this.iniciarContador();
      },
      error: (err) => {
        if (err.status === 404) {
          this.QuePaso = 'Token invalido o expirado.';
        } else {
          this.QuePaso = 'Error al conectar con el servidor.';
        }
        this.iniciarContador();
      }
    });
  }
}