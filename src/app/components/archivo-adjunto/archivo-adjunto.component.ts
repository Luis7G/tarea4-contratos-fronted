import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-archivo-adjunto',
  imports: [CommonModule],
  templateUrl: './archivo-adjunto.component.html',
  styleUrls: ['./archivo-adjunto.component.css'],
})
export class ArchivoAdjuntoComponent {
  @Input() titulo: string = '';
  @Input() codigo: string = '';
  @Input() esObligatorio: boolean = false;
  @Input() descripcion?: string;
  @Input() contratoId: number | null = null;
  @Output() archivoSubido = new EventEmitter<any>();

  archivoActual: any = null;
  isUploading = false;
  error: string = '';
  dragOver = false;

  constructor(
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private async handleFile(file: File) {
    // Validaciones
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'El archivo es muy grande (máximo 5MB)';
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (!allowedTypes.includes(file.type)) {
      this.error =
        'Tipo de archivo no permitido. Solo se permiten PDF, JPG y PNG';
      return;
    }

    if (this.codigo.trim() === '') {
      this.error = 'Código de tipo de archivo no definido';
      return;
    }

    this.error = '';
    this.isUploading = true;

    try {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('tipoArchivoCodigo', this.codigo);
      formData.append('sessionId', this.sessionService.getSessionId());
      formData.append('usuarioId', '1');

      console.log('✅ Datos enviados:', {
        archivo: file.name,
        tipoArchivoCodigo: this.codigo,
        sessionId: this.sessionService.getSessionId(),
      });

      const response: any = await this.http
        .post(`${environment.apiUrl}/ArchivosAdjuntos/subir-temporal`, formData)
        .toPromise();

      if (response.success) {
        this.archivoActual = response.data;
        this.archivoSubido.emit(response.data);
        console.log('✅ Archivo temporal subido exitosamente:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Error al subir archivo temporal:', error);
      this.error = error.error?.message || 'Error al subir archivo';
    } finally {
      this.isUploading = false;
    }
  }

  eliminarArchivo() {
    this.archivoActual = null;
    this.archivoSubido.emit(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  descargarArchivo() {
    if (this.archivoActual && this.archivoActual.rutaTemporal) {
      console.log('Archivo temporal:', this.archivoActual);
    }
  }
}
