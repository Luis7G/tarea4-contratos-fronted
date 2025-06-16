import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs'; // ✅ Agregar 'of'
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

    // ✅ OBTENER MONTO REAL DEL CONTRATO
    const montoReal =
      datosContrato.clausulaQuintaPrecioTotalLetrasNumeros ||
      datosContrato.montoContrato ||
      datosContrato.MontoTotal ||
      0;

    // ✅ OBTENER FECHA REAL DEL CONTRATO
    const fechaFirma =
      datosContrato.clausulaOctavaFechaFirmaContrato ||
      datosContrato.fechaFirmaContrato ||
      datosContrato.FechaFirmaContrato ||
      new Date().toISOString();

    console.log('Monto extraído:', montoReal);
    console.log('Fecha extraída:', fechaFirma);

    // ✅ MAPEAR CORRECTAMENTE AL DTO DEL BACKEND
    const datosTransformados = {
      TipoContrato: 'BIENES', // ✅ Pascal Case como espera el DTO
      NumeroContrato: '',
      ObjetoContrato: datosContrato.nombreContratista || 'Contrato de Bienes',
      RazonSocialContratista: datosContrato.nombreContratista || '', // ✅ Pascal Case
      RucContratista: datosContrato.rucContratista || '', // ✅ Pascal Case
      MontoTotal: montoReal, // ✅ Pascal Case y valor real
      FechaInicio: this.convertirFechaAISO(fechaFirma), // ✅ Pascal Case
      FechaFin: this.calcularFechaFin(fechaFirma), // ✅ Pascal Case
      RepresentanteContratante:
        datosContrato.representanteContratante ||
        'Diego Fernando Zárate Valdivieso',
      CargoRepresentante: datosContrato.cargoRepresentante || 'Gerente General',
      RepresentanteContratista:
        datosContrato.representanteContratista ||
        datosContrato.nombreContratista ||
        '',
      CedulaRepresentanteContratista: '',
      DireccionContratista: '',
      TelefonoContratista: '',
      EmailContratista: '',
      UsuarioId: 1, // ✅ Pascal Case
      DatosEspecificos: datosContrato, // ✅ Pascal Case
      ArchivosAsociados: [], // ✅ Pascal Case
    };

    console.log('✅ Datos transformados para backend:', datosTransformados);

    // Validar antes de enviar
    if (datosTransformados.MontoTotal <= 0) {
      console.error(
        '❌ MontoTotal debe ser mayor a 0:',
        datosTransformados.MontoTotal
      );
      return throwError(
        () => new Error('El monto del contrato debe ser mayor a 0')
      );
    }

    if (!datosTransformados.RazonSocialContratista?.trim()) {
      console.error('❌ RazonSocialContratista es requerida');
      return throwError(
        () => new Error('La razón social del contratista es requerida')
      );
    }

    if (!datosTransformados.RucContratista?.trim()) {
      console.error('❌ RucContratista es requerido');
      return throwError(() => new Error('El RUC del contratista es requerido'));
    }

    // ✅ CREAR CONTRATO CON DATOS CORREGIDOS
    return this.http.post(`${this.apiUrl}/contratos`, datosTransformados).pipe(
      switchMap((contratoResponse: any) => {
        console.log('Contrato creado exitosamente:', contratoResponse);
        const contratoId = contratoResponse.contrato?.id;

        if (!contratoId) {
          throw new Error('No se pudo obtener el ID del contrato creado');
        }

        // ✅ GENERAR PDF CON DATOS DEL CONTRATO
        const pdfRequestBody = {
          htmlContent: htmlContent,
          contratoData: {
            representanteContratista:
              datosTransformados.RepresentanteContratista,
            razonSocialContratista: datosTransformados.RazonSocialContratista,
            cargoRepresentante: datosTransformados.CargoRepresentante,
            rucContratista: datosTransformados.RucContratista,
            montoContrato: datosTransformados.MontoTotal,
          },
        };

        console.log('Generando PDF para contrato ID:', contratoId);

        return this.generatePdf(pdfRequestBody).pipe(
          map((pdfBlob: Blob) => {
            console.log('✅ PDF generado exitosamente');
            return {
              contrato: contratoResponse.contrato,
              pdfBlob: pdfBlob,
              success: true,
            };
          }),
          catchError((pdfError) => {
            console.error('Error generando PDF:', pdfError);
            return of({
              contrato: contratoResponse.contrato,
              pdfBlob: null,
              success: false,
              error: 'Error generando PDF, pero contrato creado exitosamente',
            });
          })
        );
      }),
      catchError((error) => {
        console.error('=== ERROR DETALLADO ===');
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error object:', error.error);

        let errorMessage = 'Error desconocido';
        if (error.error?.errors?.MontoTotal) {
          errorMessage = `Error en MontoTotal: ${error.error.errors.MontoTotal.join(
            ', '
          )}`;
        } else if (error.error?.title) {
          errorMessage = error.error.title;
        } else if (error.message) {
          errorMessage = error.message;
        }

        return throwError(
          () => new Error(`Error del servidor: ${errorMessage}`)
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

  generatePdf(requestBody: {
    htmlContent: string;
    contratoData?: any;
  }): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
    });

    console.log(
      'Enviando request con datos de contrato a:',
      `${this.apiUrl}/pdf/generate`
    );
    console.log('Request body contratoData:', requestBody.contratoData);

    return this.http
      .post(
        `${this.apiUrl}/pdf/generate`,
        requestBody, // ✅ ENVIAR EL OBJETO COMPLETO CON htmlContent Y contratoData
        {
          headers,
          responseType: 'blob',
          withCredentials: false,
        }
      )
      .pipe(
        retry(1),
        catchError((error) => {
          console.error('Error generando PDF:', error);
          return this.handleError(error);
        })
      );
  }
}
