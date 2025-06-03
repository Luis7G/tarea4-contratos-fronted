import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  generatePdfFromHtml(htmlContent: string): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/pdf/generate`,
      { htmlContent },
      {
        headers,
        responseType: 'blob'
      }
    );
  }

  uploadTempImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post(`${this.apiUrl}/pdf/upload-temp-image`, formData);
  }

  cleanupTempImage(fileName: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/pdf/cleanup-temp-image/${fileName}`);
  }
}
