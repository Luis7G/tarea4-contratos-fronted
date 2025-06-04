import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Método existente - mantener
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

  // NUEVO: Subir PDF y crear contrato
  subirPdfYCrearContrato(file: File, datosContrato: any): Observable<any> {
    console.log('Subiendo PDF y creando contrato...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipoArchivo', 'PDF_GENERADO');
    formData.append('usuarioId', '1'); // Usuario temporal

    // Primero subir el archivo
    return this.http.post(`${this.apiUrl}/Archivos/Subir`, formData).pipe(
      switchMap((archivoResponse: any) => {
        // Luego crear el contrato con el archivo asociado
        const contratoData = {
          tipoContratoCodigo: 'BIENES',
          nombreContratista: datosContrato.nombreContratista,
          rucContratista: datosContrato.rucContratista,
          montoContrato: datosContrato.montoContrato || 0,
          fechaFirmaContrato: datosContrato.fechaFirmaContrato,
          usuarioCreadorId: 1,
          archivosAsociados: [archivoResponse.data.id],
        };

        return this.http.post(`${this.apiUrl}/Contratos`, contratoData);
      }),
      catchError(this.handleError)
    );
  }

  // NUEVO: Generar PDF y crear contrato en una sola llamada
  generarPdfYCrearContrato(
    htmlContent: string,
    datosContrato: any
  ): Observable<any> {
    console.log('Generando PDF y creando contrato...');

    // Primero crear el contrato sin PDF
    const contratoData = {
      tipoContratoCodigo: 'BIENES',
      nombreContratista: datosContrato.nombreContratista,
      rucContratista: datosContrato.rucContratista,
      montoContrato: datosContrato.montoContrato || 0,
      fechaFirmaContrato: datosContrato.fechaFirmaContrato,
      usuarioCreadorId: 1,
      datosEspecificos: datosContrato.datosEspecificos || {},
    };

    return this.http.post(`${this.apiUrl}/Contratos`, contratoData).pipe(
      switchMap((contratoResponse: any) => {
        // Luego generar el PDF para ese contrato
        const contratoId = contratoResponse.data.id;
        return this.http
          .post(
            `${this.apiUrl}/Contratos/${contratoId}/generar-pdf`,
            { htmlContent },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          )
          .pipe(
            map((pdfResponse: any) => ({
              contrato: contratoResponse.data,
              pdf: pdfResponse.data,
            }))
          );
      }),
      catchError(this.handleError)
    );
  }

  // NUEVO: Descargar archivo por ID
  descargarArchivo(archivoId: number): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/Archivos/descargar/${archivoId}`, {
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError));
  }

  // Métodos existentes - mantener
  uploadTempImage(file: File): Observable<any> {
    console.log('Iniciando upload de imagen temporal...');
    console.log(
      'Archivo:',
      file.name,
      'Tamaño:',
      Math.round(file.size / 1024),
      'KB'
    );

    const formData = new FormData();
    formData.append('image', file);
    const url = `${this.apiUrl}/pdf/upload-temp-image`;
    console.log('URL de upload:', url);

    return this.http
      .post(url, formData)
      .pipe(retry(1), catchError(this.handleError));
  }

  cleanupTempImage(fileName: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/pdf/cleanup-temp-image/${fileName}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en PdfService:', error);
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }

  // NUEVO: Validar integridad del PDF ANTES de pedir datos
  validarIntegridadPdf(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post(`${this.apiUrl}/Archivos/ValidarIntegridad`, formData)
      .pipe(catchError(this.handleError));
  }

  // MODIFICADO: Subir PDF ya validado
  subirPdfValidadoYCrearContrato(
    file: File,
    datosContrato: any,
    validacion: any
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('datosContrato', JSON.stringify(datosContrato));
    formData.append('validacionIntegridad', JSON.stringify(validacion));

    return this.http
      .post(`${this.apiUrl}/Contratos/SubirPdfValidado`, formData)
      .pipe(catchError(this.handleError));
  }
}
