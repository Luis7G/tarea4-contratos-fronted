import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
declare const html2pdf: any;
import { PdfService } from '../services/pdf.service'; // Importar el servicio
import { switchMap, map } from 'rxjs/operators';
import { ResourceService } from '../services/resource.service';
import Swal from 'sweetalert2';

// Interfaz para estructurar los datos del contrato
export interface ContratoData {
  // Datos Generales del Contratante (nuevos campos)
  tipoRepresentanteContratante:
    | 'gerente_general'
    | 'apoderado_especial'
    | 'superintendente'
    | '';
  apoderadoEspecialSeleccionado: 'damian_molina' | 'roberto_alomoto' | '';
  nombreProyectoSuperintendente: string;
  nombreSuperintendente: string;
  documentoRespaldoContratante: File | null;

  // Datos Generales del Contratista}
  nombreContratista: string; // Nuevo campo para el nombre del contratista

  rucContratista: string;
  tipoRepresentanteContratista:
    | 'representante_legal'
    | 'apoderado_especial'
    | 'superintendente'
    | 'persona_natural'
    | 'persona_juridica'
    | ''; // Updated type
  representanteLegalContratista: string; // <--- REVERT to single string for the name

  // Cláusula Primera
  clausulaPrimeraAntecedentes: string;

  // Cláusula Segunda
  clausulaSegundaGarantiasRendidas: string;

  // Cláusula Cuarta
  clausulaCuartaDescripcionBienes: string;
  clausulaCuartaLugarEntrega: string;
  ofertaContemplaSoporteTecnico: boolean; // Para determinar si mostrar la cláusula adicional
  capacitacionRequierePersonalCertificado: boolean; // Para el caso 3
  clausulaCuartaLapsoSoporte: string;
  clausulaCuartaCapacitacionNumeroServidores: string; // Podría ser number
  clausulaCuartaCapacitacionLugar: string;
  clausulaCuartaCapacitacionPersonalCertificado: string;

  // Cláusula Quinta
  clausulaQuintaPrecioTotalLetrasNumeros: number | null; // MODIFIED: Changed to number | null
  clausulaQuintaPrecioTotalLetras: string; // Para el precio en letras
  clausulaQuintaImagenTablaCantidades: File | null; // Para la imagen de la tabla

  // Cláusula Sexta
  clausulaSextaFormaPagoOpcion: string; // Para seleccionar 'con_anticipo', 'sin_anticipo_un_pago', 'sin_anticipo_varios_pagos'
  clausulaSextaFormaPagoTextoGeneral: string; // Texto general de la forma de pago
  beneficiarioBanco: string;
  beneficiarioNombre: string;
  beneficiarioDireccion: string;
  beneficiarioRuc: string;
  beneficiarioNumeroCuenta: string;
  beneficiarioTipoCuenta: string;
  beneficiarioCorreo: string;

  // Cláusula Séptima
  requiereGarantiaTecnica: boolean; // Solo para contratos ≤ 50k sin anticipo
  requiereGarantiaBuenUsoAnticipo: boolean; // Solo para contratos ≤ 20k con anticipo
  plazoGarantiaTecnica: string;
  clausulaSeptimaGarantiasOpcion: string;
  clausulaSeptimaTextoGeneral: string;

  // Cláusula Octava
  clausulaOctavaEstadoBienes:
    | 'contratados'
    | 'instalados'
    | 'puesto_en_funcionamiento'
    | ''; // Nueva variable para el estado de los bienes
  clausulaOctavaCapacitacion: string;
  clausulaOctavaPeriodoNumero: number | null; // Nuevo campo numérico
  clausulaOctavaPeriodoUnidad: 'dias' | 'meses' | 'años' | ''; // Nuevo campo para unidad
  clausulaOctavaPeriodoTexto: string; // Campo calculado para el texto en letras
  // Remover: clausulaOctavaPeriodoPlazo: string;
  clausulaOctavaInicioPlazo: string;

  // Cláusula Décima
  clausulaDecimaPorcentajeMulta: string;

  diasIncumplimientoContratante: number | null;
  diasSuspensionContratista: number | null;

  // Cláusula Vigésima Tercera - Comunicaciones
  contratanteCorreoComunicaciones: string;
  contratistaProvinciaComunicaciones: string;
  contratistaCantonComunicaciones: string;
  contratistaParroquiaComunicaciones: string;
  contratistaDireccionComunicaciones: string;
  contratistaNumeroComunicaciones: string;
  contratistaTelefonosComunicaciones: string;
  contratistaCorreoComunicaciones: string;

  clausulaVigesimaSegundaCiudadArbitraje: string;

  // Fecha de Firma
  fechaFirmaContratoDia: string;
  fechaFirmaContratoMes: string;
  fechaFirmaContratoAnio: string;
  // O podrías usar un solo campo de fecha: fechaFirmaContrato: string; (ISO format)

  // Anexo 1 - Forma de Pago (campos específicos para cada opción)
  anexo1ConAnticipoPorcentaje: string;
  anexo1ConAnticipoValorRestanteUSD: string;
  anexo1ConAnticipoPeriodoFacturas: string;
  anexo1SinAnticipoVariosPagosPeriodo: string;

  // Anexo 2 - Garantías (campos específicos para cada opción)
  anexo2Opcion1_1FondoGarantiaAlternativa: string;
  anexo2Opcion1_1PlazoGarantiaTecnica: string;
  anexo2Opcion1_2PlazoGarantiaTecnica: string; // Ya existe en la interfaz original
  anexo2Opcion2_1PlazoGarantiaTecnica: string; // Ya existe
  anexo2Opcion2_2PlazoGarantiaTecnica: string; // Ya existe
}

@Component({
  selector: 'app-plantilla-word',
  standalone: false,
  templateUrl: './contrato-adquisicion-bienes.component.html',
  styleUrls: ['./contrato-adquisicion-bienes.component.css'],
})
export class PlantillaWordComponent implements AfterViewInit {
  // @ViewChild('contentRef', { static: false }) contentRef!: ElementRef;
  @ViewChild('contractContent', { static: false }) contentRef!: ElementRef; // Cambiar a 'contractContent'
  @ViewChild('fileDropRef', { static: false }) fileDropRef!: ElementRef; // Para el input de archivo
  @ViewChild('documentoRespaldoRef', { static: false })
  documentoRespaldoRef!: ElementRef;

  // Datos del contrato que se mostrarán en la plantilla
  contratoData: ContratoData;
  selectedFileName: string | null = null;
  previewImageUrl: string | ArrayBuffer | null = null;

  // Nuevas propiedades para el documento de respaldo del contratante
  selectedDocumentFileName: string | null = null;
  previewDocumentUrl: string | ArrayBuffer | null = null;

  uploadedImageUrl: string | null = null;
  tempFileName: string | null = null;

  // Estados de los botones
  isGeneratingPdf = false;
  isUploadingPdf = false;
  lastGeneratedContrato: any = null;

  // Archivo seleccionado para subir
  selectedPdfFile: File | null = null;

  logoUrl: string;

  constructor(
    private pdfService: PdfService,
    private resourceService: ResourceService
  ) {
    this.contratoData = {
      // Nuevos campos para representante contratante
      tipoRepresentanteContratante: '',
      apoderadoEspecialSeleccionado: '',
      nombreProyectoSuperintendente: '',
      nombreSuperintendente: '',
      documentoRespaldoContratante: null,
      nombreContratista: '', // Inicializar nuevo campo
      rucContratista: '',
      // representanteLegalContratista: '', // Removido
      tipoRepresentanteContratista: '', // Initialize
      representanteLegalContratista: '', // Initialize (reverted)
      clausulaPrimeraAntecedentes: '',
      clausulaSegundaGarantiasRendidas: '',
      clausulaCuartaDescripcionBienes: '',
      clausulaCuartaLugarEntrega: '',
      clausulaCuartaLapsoSoporte: '',
      clausulaCuartaCapacitacionNumeroServidores: '',
      clausulaCuartaCapacitacionLugar: '',
      clausulaCuartaCapacitacionPersonalCertificado: '',
      diasIncumplimientoContratante: null,
      diasSuspensionContratista: null,
      clausulaQuintaPrecioTotalLetrasNumeros: null,
      ofertaContemplaSoporteTecnico: false,
      capacitacionRequierePersonalCertificado: false,
      clausulaQuintaImagenTablaCantidades: null, // Inicializar
      clausulaQuintaPrecioTotalLetras: '',
      requiereGarantiaTecnica: false,
      requiereGarantiaBuenUsoAnticipo: false, // Nuevo campo
      plazoGarantiaTecnica: '',
      clausulaSextaFormaPagoOpcion: '',
      clausulaSextaFormaPagoTextoGeneral: '',
      beneficiarioBanco: '',
      beneficiarioNombre: '',
      beneficiarioDireccion: '',
      beneficiarioRuc: '',
      beneficiarioNumeroCuenta: '',
      beneficiarioTipoCuenta: '',
      beneficiarioCorreo: '',
      clausulaSeptimaGarantiasOpcion: '',
      clausulaSeptimaTextoGeneral: '',
      // clausulaOctavaInstaladosFuncionando: 'instalados, puestos en funcionamiento', // Removido
      clausulaOctavaEstadoBienes: '', // Inicializar
      clausulaOctavaCapacitacion: 'la capacitación de ser el caso',
      clausulaOctavaPeriodoNumero: null, // Nuevo
      clausulaOctavaPeriodoUnidad: '', // Nuevo
      clausulaOctavaPeriodoTexto: '', // Nuevo
      // Remover: clausulaOctavaPeriodoPlazo: '',
      clausulaOctavaInicioPlazo: '',
      clausulaDecimaPorcentajeMulta: '',
      contratanteCorreoComunicaciones: '',
      contratistaProvinciaComunicaciones: '',
      contratistaCantonComunicaciones: '',
      contratistaParroquiaComunicaciones: '',
      contratistaDireccionComunicaciones: '',
      contratistaNumeroComunicaciones: '',
      contratistaTelefonosComunicaciones: '',
      contratistaCorreoComunicaciones: '',
      clausulaVigesimaSegundaCiudadArbitraje: 'Quito',
      fechaFirmaContratoDia: '',
      fechaFirmaContratoMes: '',
      fechaFirmaContratoAnio: '',
      anexo1ConAnticipoPorcentaje: '',
      anexo1ConAnticipoValorRestanteUSD: '',
      anexo1ConAnticipoPeriodoFacturas: '',
      anexo1SinAnticipoVariosPagosPeriodo: '',
      anexo2Opcion1_1FondoGarantiaAlternativa: '',
      anexo2Opcion1_1PlazoGarantiaTecnica: '',
      anexo2Opcion1_2PlazoGarantiaTecnica: '',
      anexo2Opcion2_1PlazoGarantiaTecnica: '',
      anexo2Opcion2_2PlazoGarantiaTecnica: '',
    };
    this.logoUrl = this.resourceService.getLogoUrl();
  }

  ngAfterViewInit(): void {
    // Verificar que el elemento esté disponible
    if (!this.contentRef) {
      console.warn(
        'ContentRef no está disponible en ngAfterViewInit. Asegúrate de que el elemento #print exista en el HTML.'
      );
    } else {
      console.log('ContentRef está disponible:', this.contentRef);
    }
  }

  // Métodos para obtener el texto del representante contratante
  getRepresentanteContratanteTexto(): string {
    switch (this.contratoData.tipoRepresentanteContratante) {
      case 'gerente_general':
        return 'representada por su Gerente General, la Compañía GEMADEMSA S.A., empresa que a su vez está representada legalmente por su Gerente General, el Abogado Diego Fernando Zárate Valdivieso, según nombramiento que forma parte de este contrato';

      case 'apoderado_especial':
        const nombreApoderado = this.getNombreApoderadoEspecial();
        return `representada por su apoderado especial, ${nombreApoderado}, según poder que forma parte de este contrato`;

      case 'superintendente':
        const nombreProyecto =
          this.contratoData.nombreProyectoSuperintendente ||
          '[nombre del proyecto]';
        const nombreSuperintendente =
          this.contratoData.nombreSuperintendente ||
          '[nombre del superintendente]';
        return `a través del Superintendente del Proyecto ${nombreProyecto}, ${nombreSuperintendente}, según documento que forma parte de este contrato`;

      default:
        return 'representada por [SELECCIONE TIPO DE REPRESENTANTE]';
    }
  }

  getNombreApoderadoEspecial(): string {
    switch (this.contratoData.apoderadoEspecialSeleccionado) {
      case 'damian_molina':
        return 'Damián Oswaldo Molina Bernal';
      case 'roberto_alomoto':
        return 'Roberto Jaime Alomoto Landeta';
      default:
        return '[Seleccione apoderado]';
    }
  }

  // Resetear campos cuando cambia el tipo de representante
  onTipoRepresentanteContratanteChange(): void {
    // Limpiar campos específicos cuando cambia la selección
    this.contratoData.apoderadoEspecialSeleccionado = '';
    this.contratoData.nombreProyectoSuperintendente = '';
    this.contratoData.nombreSuperintendente = '';

    // Solo limpiar documento si NO es superintendente, o si cambia de superintendente a otra opción
    if (this.contratoData.tipoRepresentanteContratante !== 'superintendente') {
      this.clearDocumentSelection();
    }
  }

  // --- Métodos para el manejo del documento de respaldo del contratante ---
  onDocumentFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleDocumentFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }

  onDocumentDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDocumentDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDocumentFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.handleDocumentFile(element.files[0]);
    }
  }

  private handleDocumentFile(file: File): void {
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/jpg',
    ];

    if (file.size > maxSizeInBytes) {
      alert('El archivo excede el tamaño máximo permitido de 5MB.');
      this.clearDocumentSelection();
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, seleccione un archivo válido (PDF, JPEG, PNG, GIF).');
      this.clearDocumentSelection();
      return;
    }

    this.contratoData.documentoRespaldoContratante = file;
    this.selectedDocumentFileName = file.name;

    // Preview solo para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) =>
        (this.previewDocumentUrl = e.target?.result || null);
      reader.readAsDataURL(file);
    } else {
      this.previewDocumentUrl = null; // No preview para PDFs
    }
  }

  clearDocumentSelection(): void {
    this.contratoData.documentoRespaldoContratante = null;
    this.selectedDocumentFileName = null;
    this.previewDocumentUrl = null;
    if (this.documentoRespaldoRef?.nativeElement) {
      this.documentoRespaldoRef.nativeElement.value = ''; // Resetea el input file
    }
  }

  onPriceChange(): void {
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;

    if (price === null || price <= 0) {
      // Si el precio no es válido, limpiar las opciones dependientes
      this.contratoData.clausulaSextaFormaPagoOpcion = '';
      this.contratoData.clausulaSeptimaGarantiasOpcion = '';
      this.contratoData.requiereGarantiaTecnica = false;
      this.contratoData.requiereGarantiaBuenUsoAnticipo = false;
      this.contratoData.clausulaQuintaPrecioTotalLetras = '';
    } else {
      // Convertir número a letras usando la librería
      this.contratoData.clausulaQuintaPrecioTotalLetras =
        this.convertirNumeroALetras(price);

      // Actualizar la opción de garantía
      this.updateGuaranteeOption();
    }
  }

  onPeriodoChange(): void {
    const numero = this.contratoData.clausulaOctavaPeriodoNumero;
    const unidad = this.contratoData.clausulaOctavaPeriodoUnidad;

    if (numero === null || numero <= 0 || !unidad) {
      this.contratoData.clausulaOctavaPeriodoTexto = '';
      return;
    }

    // Convertir número a letras usando el método existente (sin la parte de moneda)
    const numeroEnLetras = this.convertirNumeroALetrasSimple(numero);

    // Determinar la unidad en singular o plural
    let unidadTexto = '';
    if (numero === 1) {
      switch (unidad) {
        case 'dias':
          unidadTexto = 'DÍA';
          break;
        case 'meses':
          unidadTexto = 'MES';
          break;
        case 'años':
          unidadTexto = 'AÑO';
          break;
      }
    } else {
      switch (unidad) {
        case 'dias':
          unidadTexto = 'DÍAS';
          break;
        case 'meses':
          unidadTexto = 'MESES';
          break;
        case 'años':
          unidadTexto = 'AÑOS';
          break;
      }
    }

    this.contratoData.clausulaOctavaPeriodoTexto = `${numeroEnLetras} ${unidadTexto}`;
  }

  // Método auxiliar para convertir números a letras (sin moneda)
  private convertirNumeroALetrasSimple(numero: number): string {
    if (numero === 0) return 'CERO';
    if (numero < 0)
      return 'MENOS ' + this.convertirNumeroALetrasSimple(-numero);

    let resultado = '';
    let numeroOriginal = Math.floor(numero);

    // Millones
    if (numeroOriginal >= 1000000) {
      const millones = Math.floor(numeroOriginal / 1000000);
      resultado +=
        this.convertirGrupo(millones) +
        (millones === 1 ? ' MILLÓN ' : ' MILLONES ');
      numeroOriginal = numeroOriginal % 1000000;
    }

    // Miles
    if (numeroOriginal >= 1000) {
      const miles = Math.floor(numeroOriginal / 1000);
      if (miles === 1) {
        resultado += 'MIL ';
      } else {
        resultado += this.convertirGrupo(miles) + ' MIL ';
      }
      numeroOriginal = numeroOriginal % 1000;
    }

    // Centenas, decenas y unidades
    if (numeroOriginal > 0) {
      resultado += this.convertirGrupo(numeroOriginal);
    }

    return resultado.trim();
  }

  private convertirNumeroALetras(numero: number): string {
    if (numero === 0) return 'CERO DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA';
    if (numero < 0) return 'MENOS ' + this.convertirNumeroALetras(-numero);

    const unidades = [
      '',
      'UNO',
      'DOS',
      'TRES',
      'CUATRO',
      'CINCO',
      'SEIS',
      'SIETE',
      'OCHO',
      'NUEVE',
    ];
    const especiales = [
      'DIEZ',
      'ONCE',
      'DOCE',
      'TRECE',
      'CATORCE',
      'QUINCE',
      'DIECISÉIS',
      'DIECISIETE',
      'DIECIOCHO',
      'DIECINUEVE',
    ];
    const decenas = [
      '',
      '',
      'VEINTE',
      'TREINTA',
      'CUARENTA',
      'CINCUENTA',
      'SESENTA',
      'SETENTA',
      'OCHENTA',
      'NOVENTA',
    ];
    const centenas = [
      '',
      'CIENTO',
      'DOSCIENTOS',
      'TRESCIENTOS',
      'CUATROCIENTOS',
      'QUINIENTOS',
      'SEISCIENTOS',
      'SETECIENTOS',
      'OCHOCIENTOS',
      'NOVECIENTOS',
    ];

    let resultado = '';
    let numeroOriginal = Math.floor(numero);

    // Millones
    if (numeroOriginal >= 1000000) {
      const millones = Math.floor(numeroOriginal / 1000000);
      resultado +=
        this.convertirGrupo(millones) +
        (millones === 1 ? ' MILLÓN ' : ' MILLONES ');
      numeroOriginal = numeroOriginal % 1000000;
    }

    // Miles
    if (numeroOriginal >= 1000) {
      const miles = Math.floor(numeroOriginal / 1000);
      if (miles === 1) {
        resultado += 'MIL ';
      } else {
        resultado += this.convertirGrupo(miles) + ' MIL ';
      }
      numeroOriginal = numeroOriginal % 1000;
    }

    // Centenas, decenas y unidades
    if (numeroOriginal > 0) {
      resultado += this.convertirGrupo(numeroOriginal);
    }

    // Agregar la moneda
    const parteEntera = Math.floor(numero);
    if (parteEntera === 1) {
      resultado += ' DÓLAR DE LOS ESTADOS UNIDOS DE AMÉRICA';
    } else {
      resultado += ' DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA';
    }

    return resultado.trim();
  }

  private convertirGrupo(numero: number): string {
    const unidades = [
      '',
      'UNO',
      'DOS',
      'TRES',
      'CUATRO',
      'CINCO',
      'SEIS',
      'SIETE',
      'OCHO',
      'NUEVE',
    ];
    const especiales = [
      'DIEZ',
      'ONCE',
      'DOCE',
      'TRECE',
      'CATORCE',
      'QUINCE',
      'DIECISÉIS',
      'DIECISIETE',
      'DIECIOCHO',
      'DIECINUEVE',
    ];
    const decenas = [
      '',
      '',
      'VEINTE',
      'TREINTA',
      'CUARENTA',
      'CINCUENTA',
      'SESENTA',
      'SETENTA',
      'OCHENTA',
      'NOVENTA',
    ];
    const centenas = [
      '',
      'CIENTO',
      'DOSCIENTOS',
      'TRESCIENTOS',
      'CUATROCIENTOS',
      'QUINIENTOS',
      'SEISCIENTOS',
      'SETECIENTOS',
      'OCHOCIENTOS',
      'NOVECIENTOS',
    ];

    let resultado = '';

    // Centenas
    if (numero >= 100) {
      const cent = Math.floor(numero / 100);
      if (numero === 100) {
        resultado += 'CIEN';
      } else {
        resultado += centenas[cent];
      }
      numero = numero % 100;
      if (numero > 0) resultado += ' ';
    }

    // Decenas y unidades
    if (numero >= 20) {
      const dec = Math.floor(numero / 10);
      const uni = numero % 10;
      resultado += decenas[dec];
      if (uni > 0) {
        resultado += ' Y ' + unidades[uni];
      }
    } else if (numero >= 10) {
      resultado += especiales[numero - 10];
    } else if (numero > 0) {
      resultado += unidades[numero];
    }

    return resultado;
  }

  // Métodos auxiliares actualizados
  isContratoMenorIgualA20k(): boolean {
    return (
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros !== null &&
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros <= 20000
    );
  }

  isContratoMenorIgualA50k(): boolean {
    return (
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros !== null &&
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros <= 50000
    );
  }

  isContratoMayorA50k(): boolean {
    return (
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros !== null &&
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros > 50000
    );
  }

  // Nuevos métodos para determinar cuándo mostrar checkboxes
  shouldShowGarantiaTecnicaCheckbox(): boolean {
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const paymentOption = this.contratoData.clausulaSextaFormaPagoOpcion;

    // Solo mostrar checkbox si es ≤ 50k SIN anticipo (opcional)
    return (
      price !== null &&
      price <= 50000 &&
      !!paymentOption &&
      paymentOption !== 'con_anticipo'
    );
  }

  shouldShowGarantiaBuenUsoAnticipoCheckbox(): boolean {
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const paymentOption = this.contratoData.clausulaSextaFormaPagoOpcion;

    // Solo mostrar checkbox si es ≤ 20k CON anticipo (opcional)
    return price !== null && price <= 20000 && paymentOption === 'con_anticipo';
  }

  // Método para determinar si la garantía técnica es obligatoria
  isGarantiaTecnicaObligatoria(): boolean {
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const paymentOption = this.contratoData.clausulaSextaFormaPagoOpcion;

    if (!price || !paymentOption) return false;

    // Obligatoria si: > 50k (siempre) O ≤ 50k CON anticipo
    return (
      price > 50000 || (price <= 50000 && paymentOption === 'con_anticipo')
    );
  }

  // Método para determinar si la garantía de buen uso del anticipo es obligatoria
  isGarantiaBuenUsoAnticipoObligatoria(): boolean {
    const precio = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const conAnticipo =
      this.contratoData.clausulaSextaFormaPagoOpcion === 'con_anticipo';

    // Garantía obligatoria para contratos > USD 20,000 con anticipo
    return precio !== null && precio > 20000 && conAnticipo;
  }

  onPaymentOptionChange(): void {
    // Cuando cambia la opción de pago, actualizar la opción de garantía
    this.updateGuaranteeOption();
  }

  // Métodos auxiliares
  isContratoMenorA50k(): boolean {
    return (
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros !== null &&
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros < 50000
    );
  }

  isContratoMayorIgualA50k(): boolean {
    return (
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros !== null &&
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros >= 50000
    );
  }

  shouldShowGarantiaTecnicaOption(): boolean {
    return (
      this.isContratoMenorA50k() &&
      !!this.contratoData.clausulaSextaFormaPagoOpcion
    );
  }

  shouldIncludeClausulaSegundaPuntoC(): boolean {
    const precio = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const conAnticipo =
      this.contratoData.clausulaSextaFormaPagoOpcion === 'con_anticipo';

    if (precio === null || precio <= 0) {
      return false; // Sin precio definido, no incluir
    }

    // REGLA: Incluir punto c) EXCEPTO cuando:
    // - Contrato < 50k
    // - Sin anticipo
    // - Solo se aplica fondo de garantía del 5%
    // - No se requieren garantías adicionales (buen uso anticipo, fiel cumplimiento)

    // Para contratos >= 50k: SIEMPRE incluir (requieren garantía de fiel cumplimiento + técnica)
    if (precio >= 50000) {
      return true;
    }

    // Para contratos < 50k CON anticipo: SIEMPRE incluir (requieren garantía de buen uso del anticipo + técnica)
    if (precio < 50000 && conAnticipo) {
      return true;
    }

    // Para contratos < 50k SIN anticipo: NO incluir
    // (solo se aplica fondo de garantía del 5% + garantía técnica que se maneja internamente)
    if (precio < 50000 && !conAnticipo) {
      return false;
    }

    return false;
  }

  // Método para simplificar la visualización del texto de garantía técnica

  private updateGuaranteeOption(): void {
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const paymentOption = this.contratoData.clausulaSextaFormaPagoOpcion;

    if (price === null || price <= 0 || !paymentOption) {
      this.contratoData.clausulaSeptimaGarantiasOpcion = '';
      return;
    }

    // Determinar automáticamente las garantías obligatorias

    // Garantía técnica obligatoria
    if (this.isGarantiaTecnicaObligatoria()) {
      this.contratoData.requiereGarantiaTecnica = true;
    }

    // Garantía de buen uso del anticipo obligatoria
    if (this.isGarantiaBuenUsoAnticipoObligatoria()) {
      this.contratoData.requiereGarantiaBuenUsoAnticipo = true;
    }

    // Determinar la opción de garantías según el monto y forma de pago
    if (price <= 50000) {
      if (paymentOption === 'con_anticipo') {
        this.contratoData.clausulaSeptimaGarantiasOpcion = 'opcion1_2';
      } else {
        this.contratoData.clausulaSeptimaGarantiasOpcion = 'opcion1_1';
      }
    } else {
      if (paymentOption === 'con_anticipo') {
        this.contratoData.clausulaSeptimaGarantiasOpcion = 'opcion2_1';
      } else {
        this.contratoData.clausulaSeptimaGarantiasOpcion = 'opcion2_2';
      }
    }
  }

  // Método para determinar si mostrar la cláusula adicional de soporte técnico
  shouldShowClausulaCuartaAdicional(): boolean {
    return this.contratoData.ofertaContemplaSoporteTecnico === true;
  }

  // Método para determinar si incluir texto de personal certificado
  shouldIncludePersonalCertificado(): boolean {
    return (
      this.contratoData.ofertaContemplaSoporteTecnico &&
      this.contratoData.capacitacionRequierePersonalCertificado
    );
  }

  // Método para obtener el lapso de garantía técnica de la Cláusula Séptima
  getLapsoGarantiaTecnica(): string {
    return this.contratoData.plazoGarantiaTecnica || '[LAPSO_GARANTIA_TECNICA]';
  }

  // Ajustar contenido para evitar cortes de texto
  private adjustContentForPDF(container: HTMLElement): void {
    const pageHeight = 297; // Altura de una página A4 en mm
    const margin = 10; // Márgenes en mm
    const maxHeight = pageHeight - 2 * margin;

    let currentPageHeight = 0;
    const elements = Array.from(
      container.querySelectorAll('p, table, div:not(.page-break-placeholder)')
    ) as HTMLElement[]; // Selecciona elementos de bloque relevantes

    elements.forEach((el, index) => {
      // Evitar añadir page-break antes del primer elemento o si el elemento ya está precedido por uno
      if (
        index > 0 &&
        el.previousElementSibling &&
        el.previousElementSibling.classList.contains('page-break-placeholder')
      ) {
        currentPageHeight = 0; // Reiniciar altura para la nueva página
      }

      const elStyle = window.getComputedStyle(el);
      const marginTop = parseFloat(elStyle.marginTop);
      const marginBottom = parseFloat(elStyle.marginBottom);
      const elHeight = el.offsetHeight + marginTop + marginBottom; // Altura total incluyendo márgenes verticales

      const elHeightMm = elHeight / 3.78; // Convertir px a mm (aproximado, puede variar)

      if (currentPageHeight + elHeightMm > maxHeight) {
        // Verificar si ya existe un page-break antes de este elemento para no duplicar
        if (
          !el.previousElementSibling ||
          !el.previousElementSibling.classList.contains(
            'page-break-placeholder'
          )
        ) {
          const pageBreak = document.createElement('div');
          pageBreak.style.pageBreakBefore = 'always'; // Estilo CSS para salto de página
          pageBreak.classList.add('page-break-placeholder'); // Clase para identificarlo
          pageBreak.style.height = '0px'; // No ocupa espacio visual
          pageBreak.style.marginTop = '0px';
          pageBreak.style.marginBottom = '0px';
          el.parentElement?.insertBefore(pageBreak, el);
          currentPageHeight = 0;
        }
      }
      currentPageHeight += elHeightMm;
    });
  }

  async generatePDF() {
    try {
      console.log('Generando PDF con backend...');

      if (!this.contentRef?.nativeElement) {
        console.error('Elemento de contenido no encontrado');
        return;
      }

      // Obtén el HTML tal como lo tienes en el frontend
      const htmlContent = this.contentRef.nativeElement.innerHTML;

      this.pdfService.generatePdfFromHtml(htmlContent).subscribe({
        next: (pdfBlob: Blob) => {
          const url = window.URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `contrato_${
            this.contratoData.nombreContratista || 'documento'
          }.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          console.log('PDF generado exitosamente');
        },
        error: (error) => {
          console.error('Error generando PDF:', error);
          alert('Error al generar el PDF');
        },
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }

  checkElement() {
    console.log('=== DEBUG INFO ===');
    console.log('ViewChild contentRef:', this.contentRef);
    console.log('ViewChild nativeElement:', this.contentRef?.nativeElement);
    console.log(
      'getElementById contract-content:',
      document.getElementById('contract-content')
    );
    console.log(
      'querySelector .contract-content-wrapper:',
      document.querySelector('.contract-content-wrapper')
    );

    const contractElement = document.getElementById('contract-content');
    if (contractElement) {
      console.log(
        'Altura del elemento del contrato:',
        contractElement.offsetHeight
      );
      console.log(
        'Ancho del elemento del contrato:',
        contractElement.offsetWidth
      );
    }
  }

  // --- Métodos para el manejo de la imagen de tabla de cantidades ---
  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private handleFile(file: File): void {
    const maxSizeInBytes = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSizeInBytes) {
      alert('La imagen excede el tamaño máximo permitido de 3MB.');
      this.clearImageSelection();
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert('Tipo de archivo no válido. Solo se permiten: JPG, PNG, GIF');
      this.clearImageSelection();
      return;
    }

    this.contratoData.clausulaQuintaImagenTablaCantidades = file;
    this.selectedFileName = file.name;

    // Preview local inmediato
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImageUrl = (e.target?.result as string) || null;
    };
    reader.readAsDataURL(file);

    // Subir al backend como archivo temporal
    console.log('Subiendo imagen temporal al servidor...');
    this.pdfService.uploadTempImage(file).subscribe({
      next: (response) => {
        this.uploadedImageUrl = response.imageUrl;
        this.tempFileName = response.fileName;
        console.log('Imagen subida exitosamente:', response);
        console.log(`Tamaño: ${(response.size / 1024).toFixed(1)}KB`);
        console.log(`Expira en: ${response.expiresIn}`);
      },
      error: (error) => {
        console.error('Error subiendo imagen:', error);
        alert(
          'Error al subir la imagen: ' +
            (error.error?.message || 'Error desconocido')
        );
      },
    });
  }

  clearImageSelection(): void {
    // Limpiar imagen temporal del servidor si existe
    if (this.tempFileName) {
      this.pdfService.cleanupTempImage(this.tempFileName).subscribe({
        next: (response) => {
          console.log('Imagen temporal eliminada:', response);
        },
        error: (error) => {
          console.warn('No se pudo eliminar imagen temporal:', error);
        },
      });
    }

    // Limpiar variables locales
    this.contratoData.clausulaQuintaImagenTablaCantidades = null;
    this.selectedFileName = null;
    this.previewImageUrl = null;
    this.uploadedImageUrl = null;
    this.tempFileName = null;

    if (this.fileDropRef?.nativeElement) {
      this.fileDropRef.nativeElement.value = '';
    }
  }

  // Método opcional para limpiar al salir del componente
  ngOnDestroy(): void {
    if (this.tempFileName) {
      this.pdfService.cleanupTempImage(this.tempFileName).subscribe();
    }
  }

  calcularPorcentajeRestante(): string {
    if (!this.contratoData.anexo1ConAnticipoPorcentaje) {
      return '[% RESTANTE]';
    }

    // Extraer el número del porcentaje (ej: "30%" -> 30)
    const porcentajeAnticipoStr =
      this.contratoData.anexo1ConAnticipoPorcentaje.replace('%', '');
    const porcentajeAnticipo = parseFloat(porcentajeAnticipoStr);

    if (isNaN(porcentajeAnticipo)) {
      return '[% RESTANTE]';
    }

    const porcentajeRestante = 100 - porcentajeAnticipo;
    return `${porcentajeRestante}%`;
  }

  // BOTÓN 1: Generar y Descargar PDF
  async generarYDescargarPdf() {
    if (!this.validarDatosEsenciales()) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    this.isGeneratingPdf = true;

    try {
      // Obtener el HTML del contrato
      const htmlContent = this.getContractHtml();

      // Datos esenciales para el contrato
      const datosContrato = {
        nombreContratista: this.contratoData.nombreContratista,
        rucContratista: this.contratoData.rucContratista,
        montoContrato:
          this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros || 0,
        fechaFirmaContrato: this.getFechaFirmaFormatted(),
        datosEspecificos: this.getDatosEspecificos(),
      };

      // Generar PDF y crear contrato
      const resultado = await this.pdfService
        .generarPdfYCrearContrato(htmlContent, datosContrato)
        .toPromise();

      this.lastGeneratedContrato = resultado.contrato;

      // Descargar el PDF generado
      const pdfBlob = await this.pdfService
        .descargarArchivo(resultado.pdf.archivoId)
        .toPromise();

      if (pdfBlob) {
        this.downloadBlob(
          pdfBlob,
          `Contrato_${this.contratoData.rucContratista}.pdf`
        );
      } else {
        throw new Error('No se pudo descargar el archivo PDF');
      }

      alert(
        'PDF generado, guardado en base de datos y descargado exitosamente'
      );
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Revise la consola para más detalles.');
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  // BOTÓN 2: Subir PDF existente
  async subirPdfExistente() {
    if (!this.selectedPdfFile) {
      alert('Por favor seleccione un archivo PDF');
      return;
    }

    this.isUploadingPdf = true;

    try {
      // PASO 1: Validar integridad del PDF PRIMERO
      console.log('🔍 Validando integridad del PDF...');
      const validacionIntegridad = await this.pdfService
        .validarIntegridadPdf(this.selectedPdfFile)
        .toPromise();

      if (!validacionIntegridad.esValido) {
        alert(`❌ PDF inválido: ${validacionIntegridad.razon}`);
        return;
      }

      console.log('✅ PDF válido, solicitando datos...');

      // PASO 2: Si el PDF es válido, ENTONCES pedir datos
      let datosContrato;
      if (this.validarDatosEsenciales()) {
        datosContrato = {
          nombreContratista: this.contratoData.nombreContratista,
          rucContratista: this.contratoData.rucContratista,
          montoContrato:
            this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros || 0,
          fechaFirmaContrato: this.getFechaFirmaFormatted(),
          datosEspecificos: this.getDatosEspecificos(),
        };
      } else {
        datosContrato = await this.mostrarModalDatosMinimos();
      }

      // PASO 3: Subir PDF ya validado con datos
      const resultado = await this.pdfService
        .subirPdfValidadoYCrearContrato(
          this.selectedPdfFile,
          datosContrato,
          validacionIntegridad
        )
        .toPromise();

      alert('✅ PDF subido y contrato guardado exitosamente');
    } catch (error) {
      console.error('Error al subir PDF:', error);
      alert('❌ Error al subir el PDF.');
    } finally {
      this.isUploadingPdf = false;
    }
  }

  // Mostrar modal cuando no hay datos en formulario
  private async mostrarModalDatosMinimos(): Promise<any> {
    // Usar SweetAlert2 o modal de Angular
    const { value: datosMinimos } = await Swal.fire({
      title: 'Datos del Contrato',
      html: `
      <input id="nombre" class="swal2-input" placeholder="Nombre Contratista">
      <input id="ruc" class="swal2-input" placeholder="RUC Contratista">
      <input id="monto" class="swal2-input" type="number" placeholder="Monto">
      <input id="fecha" class="swal2-input" type="date">
    `,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      preConfirm: () => {
        return {
          nombreContratista: (
            document.getElementById('nombre') as HTMLInputElement
          ).value,
          rucContratista: (document.getElementById('ruc') as HTMLInputElement)
            .value,
          montoContrato: parseFloat(
            (document.getElementById('monto') as HTMLInputElement).value
          ),
          fechaFirmaContrato: (
            document.getElementById('fecha') as HTMLInputElement
          ).value,
        };
      },
    });

    if (!datosMinimos) {
      throw new Error('Datos cancelados por usuario');
    }

    return datosMinimos;
  }

  // Validar datos esenciales
  private validarDatosEsenciales(): boolean {
    return !!(
      this.contratoData.nombreContratista?.trim() &&
      this.contratoData.rucContratista?.trim() &&
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros !== null &&
      this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros > 0 &&
      this.contratoData.fechaFirmaContratoDia &&
      this.contratoData.fechaFirmaContratoMes &&
      this.contratoData.fechaFirmaContratoAnio
    );
  }

  // Manejar selección de archivo
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedPdfFile = file;
    } else {
      alert('Por favor seleccione un archivo PDF válido');
      event.target.value = '';
    }
  }

  // Obtener HTML del contrato
  private getContractHtml(): string {
    const printElement = document.getElementById('print');
    return printElement?.innerHTML || '';
  }

  // Formatear fecha para backend
  private getFechaFirmaFormatted(): string {
    const dia = this.contratoData.fechaFirmaContratoDia;
    const mes = this.getNumeroMes(this.contratoData.fechaFirmaContratoMes);
    const anio = this.contratoData.fechaFirmaContratoAnio;

    if (dia && mes && anio) {
      return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  // Convertir nombre de mes a número
  private getNumeroMes(nombreMes: string): string {
    const meses: { [key: string]: string } = {
      enero: '01',
      febrero: '02',
      marzo: '03',
      abril: '04',
      mayo: '05',
      junio: '06',
      julio: '07',
      agosto: '08',
      septiembre: '09',
      octubre: '10',
      noviembre: '11',
      diciembre: '12',
    };
    return meses[nombreMes.toLowerCase()] || '01';
  }

  // Obtener datos específicos del contrato
  private getDatosEspecificos(): any {
    return {
      descripcionBienes: this.contratoData.clausulaCuartaDescripcionBienes,
      lugarEntrega: this.contratoData.clausulaCuartaLugarEntrega,
      incluyeSoporteTecnico: this.contratoData.ofertaContemplaSoporteTecnico,
      plazoGarantiaTecnica: this.contratoData.plazoGarantiaTecnica,
      formaPago: this.contratoData.clausulaSextaFormaPagoOpcion,
    };
  }

  // Descargar blob como archivo
  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Limpiar formulario
  limpiarFormulario() {
    this.selectedPdfFile = null;
    this.lastGeneratedContrato = null;

    const fileInput = document.getElementById(
      'pdfFileInput'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
}
