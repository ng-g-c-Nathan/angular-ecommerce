import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../../../servicio/crud.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { toast } from 'ngx-sonner';
import { trigger, transition, style, animate } from '@angular/animations';
import { environment } from '../../../../environments/environment';
import { GlobalService } from '../../../servicio/global.service';

/** Componente que permite al usuario seleccionar productos de sus compras para solicitar una devolucion. */
@Component({
  selector: 'app-buscar-devolucion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscar-devolucion.component.html',
  styleUrls: ['../../../../styles.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('700ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class BuscarDevolucionComponent implements OnInit, OnDestroy {

  /** URL base de la API para construir rutas de imagenes. */
  readonly URL = environment.fotosUrl;

  /** Lista de compras del usuario obtenidas desde el backend. */
  Productos: any[] = [];

  /** Correo electronico del usuario autenticado. */
  correo: string = '';

  /** Conjunto de IDs unicos de productos seleccionados para devolucion. */
  itemsSet: Set<string> = new Set();

  /** Cadena legible con los nombres de los productos seleccionados para devolucion. */
  Texto: string = '';

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
  ) {}

  /** Verifica la sesion activa y carga el historial de compras del usuario. */
  ngOnInit(): void {
    const usuario = this.globalService.getUsuario();

    if (!usuario) {
      toast.error('Inicia sesion para disfrutar este servicio.');
      this.router.navigate(['Login']);
      return;
    }

    this.correo = usuario.email;

    this.crudService.ObtenerCompras(this.correo).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (respuesta: any[]) => {
        this.Productos = respuesta ?? [];
      },
      error: () => {
        toast.error('Error al cargar las compras.');
      }
    });
  }

  /** Cancela todas las suscripciones activas para evitar memory leaks. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Agrega un producto al conjunto de seleccionados para devolucion y actualiza el texto visible. */
  PasarACompras(item: string): void {
    if (this.itemsSet.has(item)) return;
    this.itemsSet.add(item);
    this.Texto = Array.from(this.itemsSet).join(', ');
  }

  /** Reemplaza la imagen del producto por una imagen por defecto si ocurre un error de carga. */
  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = './assets/HYYAA.png';
  }

  /** Redirige al usuario hacia la vista de login. */
  IrHaciaLogin(): void {
    this.router.navigate(['Login']);
  }
}