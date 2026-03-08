import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { CrudService } from '../../../servicio/crud.service';
import { GlobalService } from '../../../servicio/global.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { environment } from '../../../../environments/environment';

/** Componente de la pagina principal que muestra productos destacados y accesos rapidos a la plataforma. */
@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './pagina-principal.component.html',
  styleUrls: ['../../../../styles.css', './pagina-principal.component.css'],
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

  /** Nombre de la aplicacion mostrado en la pagina principal. */
  readonly title = 'Electrotech';

  /** URL base de la API para construir rutas de imagenes de productos. */
  readonly URL = environment.fotosUrl;

  /** Correo electronico del usuario autenticado, o cadena vacia si no hay sesion. */
  correo: string | undefined;

  /** Apodo del usuario autenticado para mostrarlo en el saludo. */
  apodito: string | undefined;

  /** Lista de productos destacados mostrados en la pagina principal. */
  productos: any[] = [];

  /** Indice actual del carrusel. */
  carruselIndex = 0;

  /** Numero de productos visibles a la vez en el carrusel. */
  readonly carruselVisible = 4;

  /** Ancho en px de cada item del carrusel. */
  readonly carruselItemWidth = 220;

  /** Timer del auto-giro del carrusel. */
  private carruselTimer: any;

  /** Indica si el mouse está sobre el carrusel (pausa el auto-giro). */
  carruselPausado = false;


  /** Subject para cancelar suscripciones activas al destruir el componente. */
  private readonly destroy$ = new Subject<void>();

  /**
   * @param crudService   Servicio para operaciones con la API.
   * @param router        Servicio de navegacion entre rutas.
   * @param globalService Servicio de estado global de sesion del usuario.
   */
  constructor(
    private readonly crudService: CrudService,
    private readonly router: Router,
    private readonly globalService: GlobalService,
  ) { }

  /** Carga los datos del usuario, los productos iniciales y activa el refresco automatico cada 7 segundos. */
  ngOnInit(): void {
    this.revisarUsuario();
    this.cargarProductos();
    this.iniciarAutoGiro();
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    clearInterval(this.carruselTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Lee el usuario autenticado desde GlobalService y almacena su correo y apodo. */
  private revisarUsuario(): void {
    const usuario = this.globalService.getUsuario();
    if (!usuario) {
      this.correo = '';
      this.apodito = undefined;
      return;
    }
    this.correo = usuario.email;
    this.apodito = usuario.apodo;
  }

  /** Consulta los productos destacados desde el backend y actualiza la lista de la pagina principal. */
  cargarProductos(): void {
    this.crudService.ObtenerProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (respuesta: any) => { this.productos = respuesta; },
        error: () => { }
      });
  }


  /** Indice maximo al que puede llegar el carrusel sin quedar con espacios vacios. */
  get maxCarruselIndex(): number {
    return Math.max(0, this.productos.length - this.carruselVisible);
  }

  /** Array usado para renderizar los puntos indicadores del carrusel. */
  get carruselDots(): number[] {
    return Array.from({ length: this.maxCarruselIndex + 1 }, (_, i) => i);
  }

  /** Avanza el carrusel una posicion hacia la derecha. */
  carruselSiguiente(): void {
    if (this.carruselIndex < this.maxCarruselIndex) {
      this.carruselIndex++;
    }
  }

  /** Retrocede el carrusel una posicion hacia la izquierda. */
  carruselAnterior(): void {
    if (this.carruselIndex > 0) {
      this.carruselIndex--;
    }
  }

  /** Inicia el auto-giro del carrusel cada 3 segundos. */
  private iniciarAutoGiro(): void {
    this.carruselTimer = setInterval(() => {
      if (this.carruselPausado || this.productos.length === 0) return;
      if (this.carruselIndex < this.maxCarruselIndex) {
        this.carruselIndex++;
      } else {
        this.carruselIndex = 0;
      }
    }, 3000);
  }
  /** Redirige al usuario hacia el catalogo de productos. */
  irHaciaCatalogo(): void {
    this.router.navigate(['Catalogo']);
  }

  /** Redirige al usuario hacia la pagina de informacion sobre la empresa. */
  irHaciaAboutUs(): void {
    this.router.navigate(['AboutUs']);
  }

  /** Navega hacia la vista de detalle del producto indicado pasando el correo del usuario como estado. */
  obtenerInformacionDelProducto(productId: string): void {
    this.router.navigate(['/Producto/', productId], {
      state: { email: this.correo }
    });
  }
}