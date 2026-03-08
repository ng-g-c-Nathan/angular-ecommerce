import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Compras } from './Clases/Compras';
import { Cliente } from './Clases/Cliente';
import { Carrito } from './Clases/Carrito';
import { NuevoCarrito } from './Clases/CarritoNuevo';
import { ProductoNuevo } from './Clases/ProductoNuevo';
import { ID } from './Clases/ID';
import { ActualizarProducto } from './Clases/ActualizarProducto';
import { Resena } from './Clases/Resena';
import { IDCOMMUN } from './Clases/IDCOMMUN';
import { PersonaNueva } from './Clases/PersonaNueva';
import { Fecha } from './Clases/Fechas';
import { CarritoPasar } from './Clases/CarritoPasar';
import { Pago } from './Clases/Pago';
import { Rembolso } from './Clases/Rembolso';
import { ExisteRembolso } from './Clases/ExisteRembolso';
import { Correos } from './Clases/Correos';
import { DosValores } from './Clases/DosValores';
import { Facturas } from './Clases/Factura';
import { Refece } from './Clases/Refece';
import { VSM } from './Clases/VSM';
import { email } from './Clases/email';
import { MeterPedido } from './Clases/MeterPedido';
import { MeterFactura } from './Clases/MeterFactura';
import { CorreoDevolucion } from './Clases/CorreoDevolucion';
import { CambiarEstado } from './Clases/CambiarEstado';

/**
 * Servicio centralizado de acceso a la API de Electrotech.
 *
 * Métodos agrupados por dominio de endpoint:
 *  - /analisis
 *  - /archivos
 *  - /busqueda
 *  - /carritos
 *  - /clientes
 *  - /facturacion
 *  - /listadeseos
 *  - /listas
 *  - /mail
 *  - /pagos
 *  - /pedidos
 *  - /productos
 *  - /proveedores
 *  - /reembolsos
 *  - /resenas
 */
@Injectable({
  providedIn: 'root'
})
export class CrudService {

  API = environment.apiUrl;

  constructor(private clienteHttp: HttpClient) { }

  //  Helpers HTTP 

  private agregarHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${environment.apiKey}`
    });
  }

  private get(url: string, options?: any): Observable<any> {
    const headers = this.agregarHeaders();
    return this.clienteHttp.get(url, { ...options, headers });
  }

  private post(url: string, body: any, options?: any): Observable<any> {
    const headers = this.agregarHeaders();
    return this.clienteHttp.post(url, body, { ...options, headers });
  }

  private put(url: string, body: any, options?: any): Observable<any> {
    const headers = this.agregarHeaders();
    return this.clienteHttp.put(url, body, { ...options, headers });
  }

  private delete(url: string, options?: any): Observable<any> {
    const headers = this.agregarHeaders();
    return this.clienteHttp.delete(url, { ...options, headers });
  }

  private patch(url: string, body: any, options?: any): Observable<any> {
    const headers = this.agregarHeaders();
    return this.clienteHttp.patch(url, body, { ...options, headers });
  }

  //  /analisis 

  /** Consulta general de estado inicial del backend. */
  Nuevo(): Observable<any> {
    return this.get(this.API + '/analisis/Nuevo');
  }

  /** Obtiene la cantidad de registros del día. */
  SaberCuantosHoy(): Observable<any> {
    return this.get(this.API + '/analisis/hoy-cuantos');
  }

  /** Obtiene la cantidad de registros de la semana. */
  SaberCuantosSemana(): Observable<any> {
    return this.get(this.API + '/analisis/semana-cuantos');
  }

  /** Obtiene la cantidad de registros del mes. */
  SaberCuantosMes(): Observable<any> {
    return this.get(this.API + '/analisis/mes-cuantos');
  }

  //  /archivos 

  /** Sube la imagen de un producto. */
  uploadFileProducto(file: File, id: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('esProducto', 'true');
    formData.append('id', String(id));
    return this.post(this.API + '/archivos/subir', formData);
  }

  /** Actualiza la imagen de un producto. */
  actualizarFileProducto(file: File, id: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('esProducto', 'true');
    formData.append('id', String(id));
    const headers = this.agregarHeaders();
    return this.clienteHttp.put(this.API + '/archivos/actualizar', formData, { headers });
  }

  /** Elimina la foto de un producto. */
  BorrarFotoProducto(id: number): Observable<any> {
    return this.clienteHttp.delete(
      `${this.API}/archivos/eliminar?esProducto=true&id=${id}`,
      { headers: this.agregarHeaders() }
    );
  }

  /** Sube la foto de un cliente. */
  uploadFileUsuario(file: File, id: number): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('esProducto', 'false');
    formData.append('id', String(id));
    return this.clienteHttp.post(
      `${this.API}/archivos/subir`, formData,
      { headers: this.agregarHeaders(), responseType: 'text' }
    );
  }

  /** Elimina la foto de un cliente (respuesta text). */
  borrarFotoUsuario(id: number): Observable<string> {
    return this.clienteHttp.delete(
      `${this.API}/archivos/eliminar?esProducto=false&id=${id}`,
      { headers: this.agregarHeaders(), responseType: 'text' }
    );
  }

  /** Elimina la foto de un cliente (respuesta genérica). */
  BorrarFotoUser(id: number): Observable<any> {
    return this.clienteHttp.delete(
      `${this.API}/archivos/eliminar?esProducto=false&id=${id}`,
      { headers: this.agregarHeaders() }
    );
  }

  /** Obtiene el blob de un archivo (usuarios o productos). */
  verArchivo(carpeta: 'users' | 'productos', nombreArchivo: string): Observable<Blob> {
    return this.clienteHttp.get(
      `${this.API}/archivos/ver/${carpeta}/${nombreArchivo}`,
      { headers: this.agregarHeaders(), responseType: 'blob' }
    );
  }

  //  /busqueda 

  /** Ejecuta consulta VSM. */
  VSM(consulta: string): Observable<any> {
    return this.get(this.API + '/busqueda/vsm', { params: { q: consulta } });
  }

  /** Obtiene productos relacionados por ID. */
  ProductoRelacionados(idProducto: number): Observable<any> {
    return this.get(this.API + '/busqueda/relacionados', { params: { id: idProducto } });
  }

  /** Obtiene productos relacionados por ID (alias). */
  obtenerRelacionados(id: number): Observable<any> {
    return this.get(this.API + '/busqueda/relacionados?id=' + id);
  }

  //  /carritos 

  /** Obtiene el carrito con mayor actividad. */
  TopUnoCarrito(): Observable<any> {
    return this.get(this.API + '/carritos/top', { responseType: 'text' });
  }

  /** Obtiene el total de carritos. */
  TotalCarritos(): Observable<any> {
    return this.get(this.API + '/carritos/count');
  }

  /** Agrega un producto al carrito. */
  AgregarCarrito(Carrin: Carrito): Observable<any> {
    return this.post(this.API + '/carritos/agregar', Carrin);
  }

  /** Transfiere una lista al carrito. */
  PasarLista(Carrin2: CarritoPasar): Observable<any> {
    return this.post(this.API + '/carritos/pasarLista', Carrin2);
  }

  /** Consulta el carrito de un usuario. */
  RevisarCarrito(email: string): Observable<any> {
    return this.post(this.API + '/carritos/miCarrito', email);
  }

  /** Elimina un producto del carrito. */
  BorrarCarrito(Carrin: Carrito): Observable<any> {
    return this.post(this.API + '/carritos/borrarMiCarrito', Carrin);
  }

  /** Actualiza un carrito. */
  ActualizarCarrito(ActualizarCarritos: NuevoCarrito): Observable<any> {
    return this.post(this.API + '/carritos/actualizarCarrito', ActualizarCarritos);
  }

  //  /clientes 

  /** Registra un nuevo cliente. */
  AgregarCliente(datosCliente: Cliente): Observable<any> {
    return this.post(this.API + '/clientes/agregar', datosCliente);
  }

  /** Inicia sesión de un cliente. */
  Login(datosEntrada: Cliente): Observable<any> {
    return this.post(this.API + '/clientes/login', datosEntrada);
  }

  /** Verifica si existe un correo. */
  ExisteCorreo(Correo: string): Observable<any> {
    return this.post(this.API + '/clientes/existe-correo', {}, {
      params: { email: Correo }
    });
  }

  /** Consulta información completa de una persona. */
  RevisarPersona(email: string): Observable<any> {
    return this.get(this.API + '/clientes/completo?email=' + encodeURIComponent(email));
  }

  /** Actualiza información de una persona. */
  ActualizarPersona(Personita: PersonaNueva): Observable<any> {
    return this.post(this.API + '/clientes/actualizar-persona', Personita);
  }

  /** Verifica si un usuario es administrador. */
  RevisarAdmin(correo: string): Observable<any> {
    return this.post(this.API + '/clientes/admin', correo);
  }

  /** Obtiene el apodo de un usuario. */
  obtenerApodo(Correo: String): Observable<any> {
    return this.get(this.API + '/clientes/apodo?email=' + Correo);
  }

  /** Solicita restablecimiento de contraseña (elimina token). */
  Restablecer(Id: string): Observable<any> {
    return this.post(this.API + '/clientes/eliminar-token-reset?token=' + Id, {});
  }

  /** Reset password en modo demo */
  resetPasswordDemo(email: string): Observable<any> {
    return this.post(this.API + '/demo/reset-password?email=' + email, {});
  }

  /** Actualiza la contraseña. */
  RestablecerPassword(datosCliente: any): Observable<any> {
    return this.put(this.API + '/clientes/modificar-password', datosCliente);
  }

  //  /facturacion 

  /** Compras disponibles para facturar (sin factura aún). */
  ObtenerFacturasDisponibles(email: string): Observable<any> {
    return this.get(`${this.API}/facturacion/disponibles`, { params: { email } });
  }

  /** Obtiene facturas únicas de un usuario. */
  ObtenerFacturasUnicas(Waos: String): Observable<any> {
    return this.get(this.API + '/facturacion/disponibles?email=' + Waos);
  }

  /** Genera una nueva factura con los datos fiscales del cliente. */
  MeterFactura(datos: MeterFactura): Observable<any> {
    return this.post(`${this.API}/facturacion/facturar`, datos, {
      responseType: 'text'
    });
  }

  /** Lista todas las facturas (vista admin). */
  RevisarFacturas(): Observable<any> {
    return this.get(`${this.API}/facturacion/obtener`);
  }

  /** Descarga el PDF de una factura como Blob. */
  ObtenerPDFFactura(id: number): Observable<Blob> {
    return this.get(`${this.API}/facturacion/${id}/pdf`, { responseType: 'blob' });
  }

  /** Aprueba una factura. */
  AutorizarFactura(id: number, _nombreEmisor?: string): Observable<any> {
    return this.patch(
      `${this.API}/facturacion/${id}/estatus`, null,
      { params: { estatus: 'Aprobada' }, responseType: 'text' }
    );
  }

  /** Rechaza una factura. */
  RechazarFactura(id: number): Observable<any> {
    return this.patch(
      `${this.API}/facturacion/${id}/estatus`, null,
      { params: { estatus: 'Rechazada' }, responseType: 'text' }
    );
  }

  /** Envía la factura PDF al correo del cliente. */
  EnviarFacturaPDF(id: number, email: string): Observable<any> {
    return this.post(
      `${this.API}/facturacion/${id}/enviar`, null,
      { params: { email }, responseType: 'text' }
    );
  }

  //  /listadeseos 

  /** Agrega un producto a la lista de deseos. */
  AgregarLista(Carrin: Carrito): Observable<any> {
    return this.post(this.API + '/listadeseos/agregar', Carrin);
  }

  /** Transfiere el carrito a la lista de deseos. */
  PasarCarrito(Carrin: CarritoPasar): Observable<any> {
    return this.post(this.API + '/listadeseos/pasarCarro', Carrin);
  }

  /** Consulta la lista de deseos de un usuario. */
  RevisarLista(email: String): Observable<any> {
    return this.post(this.API + '/listadeseos/miLista', email);
  }

  /** Elimina un producto de la lista de deseos. */
  BorrarLista(Carrin: Carrito): Observable<any> {
    return this.post(this.API + '/listadeseos/borrarMiLista', Carrin);
  }

  /** Actualiza una lista de deseos. */
  ActualizarLista(ActualizarCarritos2: NuevoCarrito): Observable<any> {
    return this.post(this.API + '/listadeseos/actualizarLista', ActualizarCarritos2);
  }

  //  /listas ─

  /** Obtiene el total de listas. */
  TotalListas(): Observable<any> {
    return this.get(this.API + '/listas/count');
  }

  //  /mail 

  /** Envía correo de solicitud de restablecimiento de contraseña. */
  MandarCorreo(Correo: String): Observable<any> {
    return this.post(this.API + '/mail/solicitar-reset-password?email=' + Correo, {});
  }

  /** @legacy Activa una cuenta por correo. */
  ActivarCorreo(Correo: String): Observable<any> {
    return this.get(this.API + '?ActivarCuenta=' + Correo);
  }

  /** Verifica una cuenta por token. */
  Verify(id: string): Observable<any> {
    return this.get(this.API + '/mail/verificar-cuenta?token=' + id);
  }

  /** Notifica al usuario sobre un reembolso. */
  AvisarRembolso(datos: CorreoDevolucion): Observable<any> {
    return this.post(this.API + '/mail/notificar-solicitud-reembolso', datos);
  }

  /** Notifica autorización de reembolso. */
  AvisarAutorizacion(Datos: CorreoDevolucion): Observable<any> {
    return this.post(this.API + '/mail/notificar-autorizacion', Datos);
  }

  /** Notifica denegación de reembolso. */
  AvisarDenegar(Datos: CorreoDevolucion): Observable<any> {
    return this.post(this.API + '/mail/notificar-denegacion', Datos);
  }

  //  /pagos ──

  /** Obtiene todos los pagos. */
  RevisarPagos(): Observable<any> {
    return this.post(this.API + '/pagos/checar', null);
  }

  //  /pedidos 

  /** Obtiene los pedidos. */
  RevisarPedidos(): Observable<any> {
    return this.post(this.API + '/pedidos/ver', {});
  }

  /** Genera un pedido. */
  MeterPedido(Datos: MeterPedido): Observable<any> {
    return this.post(this.API + '/pedidos/hacer-pedido', Datos);
  }

  /** Cambia el estado de un pedido. */
  CambiarEstado(Datos: CambiarEstado): Observable<any> {
    return this.put(this.API + '/pedidos/cambiar-estado', Datos);
  }

  //  /productos ──

  /** Obtiene todos los productos disponibles. */
  ObtenerProductos(): Observable<any> {
    return this.get(this.API + '/productos/disponibles');
  }

  /** Obtiene todas las categorías disponibles. */
  ConsultarCategorias(): Observable<any> {
    return this.get(this.API + '/productos/categorias');
  }

  /** Obtiene categorías (alias de ConsultarCategorias). */
  ObtenerCategoria(): Observable<any> {
    return this.get(this.API + '/productos/categorias');
  }

  /** Obtiene categorías excluyendo una. */
  ConsultarCategoriasMenos(categoria: string): Observable<any> {
    return this.get(this.API + '/productos/categorias-menos?categoria=' + categoria);
  }

  /** Obtiene productos por categoría. */
  ProductosXCategoria(categoria: string): Observable<any> {
    return this.get(this.API + '/productos/por-categoria?categoria=' + categoria);
  }

  /** Registra un nuevo producto. */
  AgregarProductoNuevo(datosProducto: ProductoNuevo): Observable<any> {
    return this.post(this.API + '/productos/nuevo', datosProducto);
  }

  /** Consulta un producto por ID. */
  RevisarProducto(id: number): Observable<any> {
    return this.get(this.API + '/productos/producto/' + id);
  }

  /**
   * Consulta un producto previo a borrado */
  RevisarBorrar(ide: ID): Observable<any> {
    return this.get(this.API + '/productos/producto/' + ide);
  }

  /** Elimina un producto. */
  BorrarProducto(Ide: ID): Observable<any> {
    return this.post(this.API + '/productos/borrarProducto', Ide);
  }

  /** Actualiza un producto. */
  ActualizarProducto(Productoupdate: ActualizarProducto): Observable<any> {
    return this.post(this.API + '/productos/actualizarProducto', Productoupdate);
  }

  /** Obtiene el número total de productos. */
  CuantosProductos(): Observable<any> {
    return this.get(this.API + '/productos/count');
  }

  /** Alias de CuantosProductos. */
  TotalProductos(): Observable<any> {
    return this.get(this.API + '/productos/count');
  }

  /** Obtiene top 10 productos. */
  TopDiez(): Observable<any> {
    return this.get(this.API + '/productos/top');
  }

  /** Obtiene el producto más caro. */
  Caro(): Observable<any> {
    return this.get(this.API + '/productos/caros');
  }

  /** Obtiene el producto más barato. */
  Barato(): Observable<any> {
    return this.get(this.API + '/productos/baratos');
  }

  /** Obtiene el proveedor con mayor volumen. */
  ProveedorMasGrande(): Observable<any> {
    return this.get(this.API + '/productos/proveedor-grande');
  }

  /** Obtiene datos para la página de inicio. */
  PaginaDeInicio(): Observable<any> {
    return this.get(this.API + '/productos/inicio');
  }

  //  /proveedores 

  /** Obtiene todos los proveedores. */
  ObtenerProveedores(): Observable<any> {
    return this.get(this.API + '/proveedores/consultar');
  }

  /** Obtiene proveedores excluyendo uno. */
  ObtenerProveedoresMenos(id: number): Observable<any> {
    return this.post(this.API + '/proveedores/consultarExcepto', id);
  }

  //  /reembolsos ─

  /** Obtiene devoluciones únicas de un usuario. */
  ObtenerComprasUnicas(Waos: String): Observable<any> {
    return this.get(this.API + '/reembolsos?email=' + Waos);
  }

  /** Verifica si existe un reembolso. */
  VerCompras(Rembolsito: Compras): Observable<any> {
    return this.post(this.API + '/reembolsos/existe-reembolso', Rembolsito);
  }

  /** Verifica si existe un reembolso (alias). */
  ExisteRembolso(Rembolsito: Compras): Observable<any> {
    return this.post(this.API + '/reembolsos/existe-reembolso', Rembolsito);
  }

  /** Ejecuta un reembolso. */
  Rembolso(Rembolsito: Rembolso): Observable<any> {
    return this.post(this.API + '/reembolsos/hacer-reembolso', Rembolsito);
  }

  /** Obtiene todos los reembolsos. */
  ObtenerRembolsos(): Observable<any> {
    return this.get(this.API + '/reembolsos/all');
  }

  /** Autoriza un reembolso. */
  AutorizarRembolso(id: String): Observable<any> {
    return this.put(this.API + '/reembolsos/autorizar/' + id, {});
  }

  /** Deniega un reembolso. */
  DenegarRembolso(id: String): Observable<any> {
    return this.delete(this.API + '/reembolsos/denegar/' + id);
  }

  //  /resenas 

  /** Obtiene el total de reseñas. */
  TotalResenas(): Observable<any> {
    return this.get(this.API + '/resenas/count');
  }

  /** Obtiene reseñas de un producto. */
  RevisarResena(id: string): Observable<any> {
    return this.get(this.API + '/resenas/ver?idProducto=' + id);
  }


  /** Obtiene devoluciones/compras de un usuario. */
  ObtenerCompras(email: string): Observable<any> {
    return this.post(this.API + '/productosencompra/devoluciones', { email });
  }

  /** Realiza un pago. */
  Pagar(Pagito: Pago): Observable<any> {
    return this.post(this.API + '/compras/procesar', Pagito);
  }

  /**  Registra una reseña. */
  MeterResena(Resena: Resena): Observable<any> {
    return this.post(this.API + '/resena/meter-resena', Resena);
  }

  Derecho(Resena: Carrito): Observable<any> {
    return this.post(this.API + '/resena/derecho', Resena);
  }


}