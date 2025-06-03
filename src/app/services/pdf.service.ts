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
          withCredentials: false, // Importante para CORS
        }
      )
      .pipe(
        retry(1), // Reintentar una vez en caso de error
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error detallado:', error);
    console.error('Status:', error.status);
    console.error('Error message:', error.message);
    console.error('URL:', error.url);

    if (error.status === 0) {
      console.error('Error de CORS o conexión:', error.error);
    }

    return throwError(() => error);
  }

  uploadTempImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http
      .post(`${this.apiUrl}/pdf/upload-temp-image`, formData, {
        withCredentials: false,
      })
      .pipe(catchError(this.handleError));
  }

  cleanupTempImage(fileName: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/pdf/cleanup-temp-image/${fileName}`, {
        withCredentials: false,
      })
      .pipe(catchError(this.handleError));
  }
}
