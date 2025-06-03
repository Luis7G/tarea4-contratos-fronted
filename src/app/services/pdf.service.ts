import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  generatePdfFromHtml(htmlContent: string): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
    });

    console.log('Enviando request a:', `${this.apiUrl}/pdf/generate`);
    console.log('Headers:', headers);

    return this.http
      .post(
        `${this.apiUrl}/pdf/generate`,
        { htmlContent },
        {
          headers,
          responseType: 'blob',
          withCredentials: false,
        }
      )
      .pipe(retry(1), catchError(this.handleError));
  }

  uploadTempImage(file: File): Observable<any> {
    console.log('🔄 Iniciando upload de imagen temporal...');
    console.log(
      '📁 Archivo:',
      file.name,
      'Tamaño:',
      Math.round(file.size / 1024),
      'KB'
    );

    const formData = new FormData();
    formData.append('image', file); // Cambiar de 'file' a 'image' para coincidir con el backend

    const url = `${this.apiUrl}/pdf/upload-temp-image`;
    console.log('🌐 URL de upload:', url);

    return this.http
      .post(url, formData, {
        withCredentials: false,
      })
      .pipe(catchError(this.handleError));
  }

  cleanupTempImage(fileName: string): Observable<any> {
    const url = `${this.apiUrl}/pdf/cleanup-temp-image/${fileName}`;
    console.log('🗑️ Limpiando imagen temporal:', url);

    return this.http
      .delete(url, {
        withCredentials: false,
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error detallado:', error);
    console.error('Status:', error.status);
    console.error('Error message:', error.message);
    console.error('URL:', error.url);

    if (error.status === 0) {
      console.error('Error de CORS o conexión:', error.error);
    } else if (error.status === 404) {
      console.error('Endpoint no encontrado - Verificar URL y controlador');
    }

    return throwError(() => error);
  }
}
