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
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

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

  generarPdfYCrearContrato(
    htmlContent: string,
    datosContrato: any
  ): Observable<any> {
    console.log('=== GENERAR PDF Y CREAR CONTRATO ===');
    console.log('Datos del contrato enviados:', datosContrato);

    // ✅ CREAR OBJETO CON NOMBRES CORRECTOS PARA EL BACKEND
    const contratoData = {
      tipoContrato: 'BIENES', // ✅ CORRECTO
      numeroContrato: datosContrato.numeroContrato || '',
      objetoContrato: datosContrato.datosEspecificos?.descripcionBienes || '',
      razonSocialContratista: datosContrato.nombreContratista || '', // ✅ MAPEAR CORRECTAMENTE
      rucContratista: datosContrato.rucContratista || '',
      montoTotal: parseFloat(datosContrato.montoContrato?.toString() || '0'), // ✅ CONVERTIR A NÚMERO
      fechaInicio: this.convertirFechaAISO(datosContrato.fechaFirmaContrato), // ✅ CONVERTIR FECHA
      fechaFin: this.calcularFechaFin(datosContrato.fechaFirmaContrato), // ✅ CALCULAR FECHA FIN
      representanteContratante: datosContrato.representanteContratante || '',
      cargoRepresentante: datosContrato.cargoRepresentante || '',
      representanteContratista: datosContrato.representanteContratista || '',
      cedulaRepresentanteContratista:
        datosContrato.cedulaRepresentanteContratista || '',
      direccionContratista: datosContrato.direccionContratista || '',
      telefonoContratista: datosContrato.telefonoContratista || '',
      emailContratista: datosContrato.emailContratista || '',
      usuarioId: 1,
      datosEspecificos: datosContrato.datosEspecificos || {},
      archivosAsociados: [],
    };

    console.log('✅ Datos transformados para backend:', contratoData);

    // ✅ ENVIAR contratoData EN LUGAR DE datosContrato
    return this.http
      .post(
        `${
          this.apiUrl
        }/Contratos?sessionId=${this.sessionService.getSessionId()}`,
        contratoData // ✅ AHORA SÍ ESTÁ CORRECTO
      )
      .pipe(
        switchMap((contratoResponse: any) => {
          console.log('Contrato creado exitosamente:', contratoResponse);
          const contratoId = contratoResponse.data.id;

          return this.http
            .post(
              `${this.apiUrl}/Contratos/${contratoId}/generar-pdf`,
              { htmlContent },
              { headers: { 'Content-Type': 'application/json' } }
            )
            .pipe(
              map((pdfResponse: any) => ({
                contrato: contratoResponse.data,
                pdf: pdfResponse.data,
              }))
            );
        }),
        catchError((error) => {
          console.error('=== ERROR DETALLADO ===');
          console.error('Status:', error.status);
          console.error('Error Body:', error.error);

          let errorMessage = 'Error desconocido';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && error.error.title) {
            errorMessage = error.error.title;
          } else if (error.statusText) {
            errorMessage = error.statusText;
          }

          return throwError(
            () =>
              new Error(`Error del servidor: ${error.status} - ${errorMessage}`)
          );
        })
      );
  }

  // ✅ MÉTODOS AUXILIARES PARA CONVERTIR FECHAS
  private convertirFechaAISO(fechaString: string): string {
    try {
      console.log('Convirtiendo fecha:', fechaString);

      // Si la fecha está en formato "123-01-12", convertir a formato válido
      if (fechaString && fechaString.includes('-')) {
        const partes = fechaString.split('-');
        if (partes.length === 3) {
          let anio = parseInt(partes[0]);
          const mes = parseInt(partes[1]);
          const dia = parseInt(partes[2]);

          // ✅ LÓGICA CORREGIDA PARA AÑO
          if (anio < 50) {
            anio = 2000 + anio; // 00-49 = 2000-2049
          } else if (anio < 100) {
            anio = 1900 + anio; // 50-99 = 1950-1999
          } else if (anio < 1000) {
            anio = 2000 + (anio % 100); // 123 -> 23 -> 2023
          }
          // Si anio >= 1000, mantener como está

          // ✅ VALIDAR RANGO DE SQL SERVER
          if (anio < 1753) anio = 2024;
          if (anio > 9999) anio = 2024;

          // ✅ VALIDAR MES Y DÍA
          const mesValido = mes >= 1 && mes <= 12 ? mes : 1;
          const diaValido = dia >= 1 && dia <= 31 ? dia : 1;

          const fecha = new Date(anio, mesValido - 1, diaValido);

          console.log('Fecha convertida:', fecha.toISOString());
          return fecha.toISOString();
        }
      }

      // Fallback: usar fecha actual
      const fechaActual = new Date().toISOString();
      console.log('Usando fecha actual como fallback:', fechaActual);
      return fechaActual;
    } catch (error) {
      console.warn('Error convertir fecha, usando fecha actual:', error);
      const fechaActual = new Date().toISOString();
      return fechaActual;
    }
  }

  private calcularFechaFin(fechaInicio: string): string {
    try {
      const fechaInicioISO = this.convertirFechaAISO(fechaInicio);
      const fechaInicioDate = new Date(fechaInicioISO);
      const fechaFin = new Date(fechaInicioDate);
      fechaFin.setFullYear(fechaFin.getFullYear() + 1); // 1 año después

      console.log('Fecha fin calculada:', fechaFin.toISOString());
      return fechaFin.toISOString();
    } catch (error) {
      console.warn('Error calculando fecha fin:', error);
      const fechaFin = new Date();
      fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      return fechaFin.toISOString();
    }
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
