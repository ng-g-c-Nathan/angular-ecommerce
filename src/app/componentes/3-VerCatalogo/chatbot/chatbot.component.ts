import { Component, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GlobalService } from '../../../servicio/global.service';
import { environment } from '../../../../environments/environment';
 
interface Mensaje {
  texto: string;
  esUsuario: boolean;
  hora: string;
}
@Component({
  selector: 'app-chatbot',
  imports: [FormsModule,CommonModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent  implements AfterViewChecked {
 
  @ViewChild('mensajesContenedor') mensajesContenedor!: ElementRef;
 
  abierto  = signal(false);
  cargando = signal(false);
  inputTexto = '';
 
  mensajes: Mensaje[] = [
    {
      texto: '¡Hola! 👋 Soy el asistente de Tiendita. ¿En qué te puedo ayudar hoy?',
      esUsuario: false,
      hora: this.horaActual()
    }
  ];
 
  constructor(
    private http: HttpClient,
    private global: GlobalService
  ) {}
 
  ngAfterViewChecked(): void {
    this.scrollAbajo();
  }
 
  toggleChat(): void {
    this.abierto.update(v => !v);
  }
 
  /** Usa el email del usuario como sessionId; si no hay sesión usa un UUID de pestaña. */
  private get sessionId(): string {
    return this.global.getUsuario()?.email ?? this.obtenerUuidPestana();
  }
 
  enviarMensaje(): void {
    const texto = this.inputTexto.trim();
    if (!texto || this.cargando()) return;
 
    this.mensajes.push({ texto, esUsuario: true, hora: this.horaActual() });
    this.inputTexto = '';
    this.cargando.set(true);
 
    this.http.post<{ respuesta: string }>(`${environment.apiUrl}/chat`, {
      sessionId: this.sessionId,
      mensaje:   texto
    }).subscribe({
      next: (res) => {
        this.mensajes.push({ texto: res.respuesta, esUsuario: false, hora: this.horaActual() });
        this.cargando.set(false);
      },
      error: (error) => {
        this.mensajes.push({
          texto: 'Ups, tuve un problema al responder. Intenta de nuevo 😅',
          esUsuario: false,
          hora: this.horaActual()
        });
        this.cargando.set(false);
      }
    });
  }
 
  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }
 
  limpiarChat(): void {
    // Limpia la memoria en el backend
    this.http.delete(`${environment.apiUrl}/chat/${this.sessionId}`).subscribe();
    // Reinicia el chat en el frontend
    this.mensajes = [{
      texto: '¡Chat reiniciado! ¿En qué te puedo ayudar? 😊',
      esUsuario: false,
      hora: this.horaActual()
    }];
  }
 
  private scrollAbajo(): void {
    if (this.mensajesContenedor) {
      const el = this.mensajesContenedor.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
 
  private horaActual(): string {
    return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }
 
  /** Genera o recupera un UUID de pestaña para usuarios no autenticados. */
  private obtenerUuidPestana(): string {
    const key = 'chatbot_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  }
}