import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalService, Usuario } from './servicio/global.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CrudService } from './servicio/crud.service';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Subscription } from 'rxjs';
import { NgxSonnerToaster, toast } from 'ngx-sonner';
import { environment } from '../environments/environment';
import {
  LucideAngularModule, ShoppingCart, Heart, User, Menu,
  ShieldCheck, Package, FileText, BarChart2, X
} from 'lucide-angular';

/**
 * Componente raíz de la aplicación.
 *
 * Responsabilidades:
 * - Mantener el estado global de sesión vía GlobalService (reactivo).
 * - Controlar la navegación principal.
 * - Verificar conectividad con el backend.
 * - Mostrar notificaciones con ngx-sonner.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    ReactiveFormsModule,
    NgxSonnerToaster,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    FlexLayoutModule,
    LucideAngularModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {

  readonly iconCart = ShoppingCart;
  readonly iconHeart = Heart;
  readonly iconUser = User;
  readonly iconMenu = Menu;
  readonly iconAdmin = ShieldCheck;
  readonly iconPackage = Package;
  readonly iconInvoice = FileText;
  readonly iconAnalysis = BarChart2;
  readonly iconClose = X;

  /** Usuario autenticado actualmente (null si no hay sesión). */
  usuario: Usuario | null = null;

  /** Atajos de conveniencia derivados del usuario. */
  get HayCorreo(): boolean { return !!this.usuario; }
  get isAdmin(): boolean { return this.global.esAdmin(); }
  get correo(): string { return this.usuario?.email ?? ''; }
  get Apodo(): string { return this.usuario?.apodo ?? ''; }

  showUserOptions: boolean = false;
  showDevoluciones: boolean = false;
  Footer: boolean = true;
  segundosRestantes: number = 60;
  HayConexion: boolean = true;
  Novedades: string = '';

  /** Control de apertura del modal de motivo. */
  Abrir: boolean = false;
  selectedMotivo: string = '';
  Contenido: string = '';

  title = 'Electrotech';
  readonly TextoNovedades = 'Se ha agregado el modelo VSM para las búsquedas, '
    + 'lo que permitirá obtener resultados más precisos y relevantes.';

  formularioAEditar: FormGroup;

  private sub = new Subscription();

  constructor(
    private readonly crudService: CrudService,
    private readonly global: GlobalService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly titleService: Title,
  ) {
    this.formularioAEditar = new FormGroup({ EditarID: new FormControl('') });
  }


  ngOnInit(): void {
    this.titleService.setTitle('Electrotech');
    this.Novedades = this.TextoNovedades;

    if (environment.demo === 'SI') {
      toast.info(
        'Esta es una versión de prueba. Algunas funciones como el pago de productos no están disponibles.',
        { duration: 6000 }
      );
    }
    // Suscripción reactiva al usuario global
    this.sub.add(
      this.global.usuario$.subscribe(user => {
        this.usuario = user;
      })
    );

    // Si ya hay un usuario en storage, úsalo directamente
    const existing = this.global.getUsuario();
    if (!existing) {
      this.recuperarSesionDesdeRouter();
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }


  /**
   * Intenta recuperar el correo desde el state del router
   * y cargar el usuario desde el backend si aún no está en GlobalService.
   */
  private recuperarSesionDesdeRouter(): void {
    const emailDesdeRouter: string | undefined = history.state?.email;
    if (emailDesdeRouter) {
      this.cargarUsuarioDesdeBackend(emailDesdeRouter);
    }
  }

  /**
   * Llama al backend para obtener los datos del usuario y los persiste
   * en GlobalService.
   */
  private cargarUsuarioDesdeBackend(email: string): void {
    this.crudService.obtenerApodo(email).subscribe({
      next: (data: any) => {
        if (data?.success === 1) {
          this.global.setUsuario({
            id: data.id,
            email: data.correo ?? email,
            apodo: data.apodo ?? email,
            admin: data.permisos === 'SI' ? 'SI' : 'NO',
          });
        }
      },
      error: () => { /* sesión anónima, sin problema */ },
    });
  }

  /**
   * Cierra sesión, limpia GlobalService y redirige a Login.
   */
  cerrarSesion(): void {
    this.global.cerrarSesion();
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', () =>
      history.pushState(null, '', window.location.href)
    );
    this.router.navigate(['Login'], { state: { email: '' } });
  }


  private navegar(ruta: string, requiereLogin = false): void {
    if (requiereLogin && !this.correo) return;
    this.router.navigate([ruta], { state: { email: this.correo } });
  }

  IrHaciaHome(): void { this.navegar('Inicio'); }
  IrHaciaCatalogo(): void { this.navegar('Catalogo'); }
  IrHaciaAboutUs(): void { this.navegar('AboutUs'); }
  IrHaciaCarrito(): void { this.navegar('Carrito', true); }
  IrHaciaWishList(): void { this.navegar('Whislist', true); }
  IrHaciaHistorial(): void { this.navegar('MisCompras', true); }
  IrHaciaMe(): void { this.navegar('Me', true); }
  IrHaciaDevolucion(): void { this.navegar('Devolucion', true); }
  IrHaciaMisDevoluciones(): void { this.navegar('MisDevoluciones', true); }
  IrHaciaFacturas(): void { this.navegar('Facturas', true); }
  IrHaciaMisFacturas(): void { this.navegar('MisFacturas', true); }
  IrHaciaPedidos(): void { this.navegar('Pedidos', true); }
  IrHaciaAnalisis(): void { this.navegar('Analisis', true); }
  IrHaciaTerminarPedidos(): void { this.navegar('GenerarPedido', true); }
  IrHaciaMisPedidos(): void { this.navegar('MisPedidos', true); }
  IrHaciaAdmin(): void { this.navegar('ManejoDeProductos', true); }
  IrHacia404(): void { this.router.navigate(['404'], { state: { email: '' } }); }

  IrHaciaLogin(): void {
    this.cerrarSesion();
  }

  IrHaciaRegistrar(): void {
    this.global.cerrarSesion();
    this.router.navigate(['registrar'], { state: { email: '' } });
  }

  IrHaciaTerms(): void {
    this.global.cerrarSesion();
    this.router.navigate(['Terminos'], { state: { email: '' } });
  }


  /**
   * Notificación informativa (azul).
   */
  AnimacionAzul(mensaje: string): void {
    toast(mensaje, { duration: 3000 });
  }

  /**
   * Notificación de wishlist (rosa / warning).
   */
  AnimacionRosa(mensaje: string): void {
    toast.warning(mensaje, { duration: 3000 });
  }

  /**
   * Notificación de error (roja).
   */
  AnimacionRoja(mensaje: string): void {
    toast.error(mensaje, { duration: 3000 });
  }

  /**
   * Notificación de éxito (verde).
   */
  AnimacionVerde(mensaje: string): void {
    toast.success(mensaje, { duration: 3000 });
  }

  /**
   * Notificación dorada (info especial).
   */
  AnimacionDorada(mensaje: string): void {
    toast.info(mensaje, { duration: 3000 });
  }


  openModal(contenido: string, razon: string): void {
    this.Contenido = contenido;
    this.selectedMotivo = razon;
    this.Abrir = true;
  }

  closeMotivoModal(): void {
    this.Abrir = false;
    this.Contenido = '';
    this.selectedMotivo = '';
  }

  /**
   * Valida que un texto no supere 256 caracteres.
   */
  TextoCorrecto(texto: string): boolean {
    return texto.length < 256;
  }
}