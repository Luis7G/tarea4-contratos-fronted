import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private baseUrl = 'http://localhost:5221/api';

  constructor(private http: HttpClient) {}

  generatePdfFromHtml(htmlContent: string): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const body = {
      htmlContent: htmlContent,
    };

    return this.http.post(`${this.baseUrl}/pdf/generate`, body, {
      headers: headers,
      responseType: 'blob',
    });
  }

  // Subir imagen temporal
  uploadTempImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.baseUrl}/image/upload-temp`, formData);
  }

  // Eliminar imagen temporal manualmente
  cleanupTempImage(fileName: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/image/cleanup/${fileName}`);
  }

  // Obtener información de archivos temporales
  getTempInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/image/temp-info`);
  }
}
