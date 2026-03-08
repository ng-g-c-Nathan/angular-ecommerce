import { NgModule } from '@angular/core';
import { Router, RouterModule,Routes} from '@angular/router';

import { InicioDeSesionComponent } from './componentes/1-IniciarSesion/inicio-de-sesion/inicio-de-sesion.component';

import { RegistrarCuentaNuevaComponent } from './componentes/2-RegistrarCuentas/registrar-cuenta-nueva/registrar-cuenta-nueva.component';
import {} from '@angular/common/http';

import { MostrarCatalogoProductosComponent } from './componentes/3-VerCatalogo/mostrar-catalogo-productos/mostrar-catalogo-productos.component';

import { BuscarDevolucionComponent } from './componentes/7-RealizarDevolucion/buscar-devolucion/buscar-devolucion.component';
import { GestionarCarritoComprasComponent } from './componentes/4-ManejoCarrito/gestionar-carrito-compras/gestionar-carrito-compras.component';

import { PaginaPrincipalComponent } from './componentes/MainPage/pagina-principal/pagina-principal.component';
import { RealizarCompraComponent } from './componentes/6-RealizarCompra/realizar-compra/realizar-compra.component';
import { GenerarFacturasComponent } from './componentes/11-Facturas/generar-facturas/generar-facturas.component';
import { AutorizarFacturasComponent } from './componentes/11-Facturas/autorizar-facturas/autorizar-facturas.component';
import { GestionarPedidosComponent } from './componentes/9-GestionarPedidos/gestionar-pedidos/gestionar-pedidos.component';
import { GestionarListaDeseosComponent } from './componentes/5-ManejoLista/gestionar-lista-deseos/gestionar-lista-deseos.component';
import { PersonalizarDatosClienteComponent } from './componentes/1-IniciarSesion/personalizar-datos-cliente/personalizar-datos-cliente.component';

import { GenerarAnalisisReportesComponent } from './componentes/10-Analisis/generar-analisis-reportes/generar-analisis-reportes.component';
import { HistorialDeComprasComponent } from './componentes/1-IniciarSesion/historial-de-compras/historial-de-compras.component';

import { VerDetallesProductoComponent } from './componentes/3-VerCatalogo/ver-detalles-producto/ver-detalles-producto.component';
import { RealizarDevolucionComponent } from './componentes/7-RealizarDevolucion/realizar-devolucion/realizar-devolucion.component';
import { GestionarProductosComponent } from './componentes/8-GestionarProductos/gestionar-productos/gestionar-productos.component';
import { AboutUsComponent } from './componentes/MainPage/about-us/about-us.component';
import { RecuperacionContrasenaComponent } from './componentes/1-IniciarSesion/recuperacion-contrasena/recuperacion-contrasena.component';
import { ValidarCorreoComponent } from './componentes/2-RegistrarCuentas/validar-correo/validar-correo.component';
import { ActualizarContrasenaComponent } from './componentes/1-IniciarSesion/actualizar-contrasena/actualizar-contrasena.component';
import { AceptarDevolucionComponent } from './componentes/7-RealizarDevolucion/aceptar-devolucion/aceptar-devolucion.component';
import { VerMisPedidosComponent } from './componentes/9-GestionarPedidos/ver-mis-pedidos/ver-mis-pedidos.component';

import { GenerarPedidoComponent}  from './componentes/9-GestionarPedidos/generar-pedido/generar-pedido.component';

export const routes: Routes = [
{path: '',pathMatch:'full',redirectTo:'Inicio'},
{path: 'registrar',component:RegistrarCuentaNuevaComponent},
{path: 'Carrito',component:GestionarCarritoComprasComponent},
{path: 'login',component:InicioDeSesionComponent},
{path: 'Inicio',component:PaginaPrincipalComponent},
{path: 'Catalogo',component:MostrarCatalogoProductosComponent},
{path: 'Whislist',component:GestionarListaDeseosComponent},
//{path: 'Terminos',component:VerTerminosCondicionesComponent},

{path: 'Checkout',component:RealizarCompraComponent}, //Caso de uso 5 

{path: 'Verify/:id',component:ValidarCorreoComponent}, //Caso de uso 5 
{path: 'Recuperar/:id',component:ActualizarContrasenaComponent}, //Caso de uso 5 

{path: 'Devolucion',component:RealizarDevolucionComponent}, //Caso de uso 6 Entera
{path: 'MisDevoluciones',component:BuscarDevolucionComponent}, //Caso de uso 6 Entera
{path: 'Facturas',component:AutorizarFacturasComponent}, // Caso de uso 10 

{path: 'MisFacturas',component:GenerarFacturasComponent}, // Caso de uso 10 

{path: 'MisPedidos',component:VerMisPedidosComponent}, // Caso de uso 10 


{path: 'Pedidos',component:GestionarPedidosComponent}, // Casp de uso 08 
{path: 'Me',component:PersonalizarDatosClienteComponent}, //Caso de uso 1 
{path: 'Analisis',component:GenerarAnalisisReportesComponent}, //Caso de uso 9
{path: 'Producto/:id',component:VerDetallesProductoComponent}, //No hay caso en espesifico pero es la foto que les mande
{path: 'AboutUs',component:AboutUsComponent}, 
{path: 'MisCompras',component:HistorialDeComprasComponent}, //Caso de uso 1 
{path: 'AceptarDevoluciones',component:AceptarDevolucionComponent}, //Caso de uso 1 
{path: 'GenerarPedido',component:GenerarPedidoComponent}, //Caso de uso 1 


{path: 'ManejoDeProductos',component:GestionarProductosComponent}, 
{path: 'Olvido',component:RecuperacionContrasenaComponent}, 

{ path: '**', redirectTo: 'login' },

];


@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule{}