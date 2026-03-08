// Importaciones necesarias
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RouterOutlet } from '@angular/router';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';
import { AppComponent } from '../../../app.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { environment } from '../../../../environments/environment';
/**
 * Componente principal de la aplicación.
 *
 * Se encarga de mostrar la página inicial con los productos,
 * refrescarlos automáticamente cada cierto intervalo
 * y gestionar la sesión básica del usuario (correo y apodo).
 */
@Component({
    selector: 'app-pagina-principal',
    standalone: true,
    imports: [RouterOutlet, CommonModule],
    templateUrl: './pagina-principal.component.html',
    styleUrl: '../../../../styles.css',
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('900ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class PaginaPrincipalComponent implements OnInit, OnDestroy {

  /**
   * Título visible de la aplicación.
   */
  title = 'Electrotech';

  /**
   * Correo del usuario actual.
   * Se obtiene desde el estado de navegación.
   */
  correo: string | undefined;

  /**
   * Listado de productos mostrados en la página principal.
   */
  Productos: any;

  /**
   * Apodo del usuario obtenido desde el backend.
   * Si no existe, se utiliza el correo.
   */
  Apodito: string | undefined;

  /**
   * Suscripción utilizada para la actualización periódica
   * de los productos en pantalla.
   */
  private subscription: Subscription | undefined;
  /**
   * URL base para la carga de imágenes.
   *
   * @type {any}
   */
  URL: any;
  /**
   * Constructor del componente.
   *
   * @param crudService Servicio para acceder al backend
   * @param route Servicio de rutas activas
   * @param router Servicio de navegación
   * @param padre Componente principal para interacción global
   */
  constructor(
    private crudService: CrudService,
    private route: ActivatedRoute, private global: GlobalService,
    private router: Router,
    private padre: AppComponent
  ) { }

  /**
   * Hook de inicialización del componente.
   *
   * - Obtiene los productos iniciales.
   * - Revisa si existe un correo en el estado de navegación.
   * - Configura la actualización automática de productos.
   */
  ngOnInit(): void {
    this.URL = environment.apiUrl;
    this.crudService.PaginaDeInicio().subscribe(respuesta => {
      this.Productos = respuesta;
    });

    this.RevisarCorreo();
    this.actualizarProductos();

    this.subscription = interval(7000)
      .pipe(
        switchMap(() => this.crudService.PaginaDeInicio())
      )
      .subscribe(respuesta => {
        this.Productos = respuesta;
      });
  }

  /**
   * Fuerza manualmente la actualización del listado de productos.
   */
  actualizarProductos(): void {
    this.crudService.PaginaDeInicio().subscribe(respuesta => {
      this.Productos = respuesta;
    });
  }

  /**
   * Hook de destrucción del componente.
   *
   * Se utiliza para cancelar la suscripción
   * de actualización periódica.
   */
  ngOnDestroy(): void {

    this.RevisarCorreo();

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Revisa si existe un correo almacenado en el estado
   * de navegación y obtiene el apodo del usuario.
   *
   * Si no existe apodo, se utiliza el correo como identificador.
   */
  RevisarCorreo(): void {

    const usuario = this.global.getUsuario();
    console.log(usuario)
    if (!usuario) {
      this.correo = '';
      return;
    }
    console.log(this.correo,this.Apodito)
    this.correo = usuario.email;
    this.Apodito = usuario.apodo;

  }

  /**
   * Navega hacia la vista de catálogo.
   * Se envía el correo del usuario en el estado de navegación.
   */
  IrHaciaCatalogo(): void {
    this.router.navigate(['Catalogo']);
  }

  /**
   * Navega hacia la vista "About Us".
   * Se envía el correo del usuario en el estado de navegación.
   */
  IrHaciaAboutUs(): void {
    this.router.navigate(['AboutUs']);
  }

  /**
   * Navega a la vista de detalle de un producto.
   *
   * @param productId Identificador del producto
   */
  ObtenerInformacionDelProducto(productId: string): void {

    this.RevisarCorreo();

    const email = this.correo;

    this.router.navigate(
      ['/Producto/', productId],
      { state: { email: email } }
    );
  }

}
