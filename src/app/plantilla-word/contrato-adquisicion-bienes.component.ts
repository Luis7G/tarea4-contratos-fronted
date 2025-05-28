import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
// Eliminamos FormBuilder, FormGroup, Validators si no se usan directamente aquí para un formulario
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// jsPDF y html2canvas ya están declarados
// import { jsPDF } from 'jspdf';
// import html2canvas from "html2canvas";

import { CommonModule } from '@angular/common'; // Necesario para *ngIf, etc.
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
declare const html2pdf: any;

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
    | ''; // Nueva variable para el tipo
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
  tipoGarantiaTecnica: 'del_fabricante' | 'incondicional_irrevocable' | '';
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
  clausulaOctavaPeriodoPlazo: string;
  clausulaOctavaInicioPlazo: string;

  // Cláusula Décima
  clausulaDecimaPorcentajeMulta: string;

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
  anexo1ConAnticipoValorRestantePorcentaje: string;
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
  @ViewChild('print', { static: false }) contentRef!: ElementRef; // Cambiado a 'print' si ese es el ID del div a imprimir
  @ViewChild('fileDropRef', { static: false }) fileDropRef!: ElementRef; // Para el input de archivo
  @ViewChild('documentoRespaldoRef', { static: false })
  documentoRespaldoRef!: ElementRef; // Para el input del documento de respaldo

  // Datos del contrato que se mostrarán en la plantilla
  contratoData: ContratoData;
  selectedFileName: string | null = null;
  previewImageUrl: string | ArrayBuffer | null = null;

  // Nuevas propiedades para el documento de respaldo del contratante
  selectedDocumentFileName: string | null = null;
  previewDocumentUrl: string | ArrayBuffer | null = null;

  constructor() {
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
      clausulaQuintaPrecioTotalLetrasNumeros: null,
      ofertaContemplaSoporteTecnico: false,
      capacitacionRequierePersonalCertificado: false,
      clausulaQuintaImagenTablaCantidades: null, // Inicializar
      clausulaQuintaPrecioTotalLetras: '',
      requiereGarantiaTecnica: false,
      requiereGarantiaBuenUsoAnticipo: false, // Nuevo campo
      tipoGarantiaTecnica: '',
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
      clausulaOctavaPeriodoPlazo: '',
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
      anexo1ConAnticipoValorRestantePorcentaje: '',
      anexo1ConAnticipoValorRestanteUSD: '',
      anexo1ConAnticipoPeriodoFacturas: '',
      anexo1SinAnticipoVariosPagosPeriodo: '',
      anexo2Opcion1_1FondoGarantiaAlternativa: '',
      anexo2Opcion1_1PlazoGarantiaTecnica: '',
      anexo2Opcion1_2PlazoGarantiaTecnica: '',
      anexo2Opcion2_1PlazoGarantiaTecnica: '',
      anexo2Opcion2_2PlazoGarantiaTecnica: '',
    };
  }

  ngAfterViewInit(): void {
    // El código original lanzaba un error, lo comento o puedes implementar algo si es necesario.
    // throw new Error('Method not implemented.');
    if (!this.contentRef) {
      console.warn(
        'ContentRef no está disponible en ngAfterViewInit. Asegúrate de que el elemento #print exista en el HTML.'
      );
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
    } else {
      // Convertir número a letras (función auxiliar)
      this.contratoData.clausulaQuintaPrecioTotalLetras =
        this.convertirNumeroALetras(price);

      // Actualizar la opción de garantía
      this.updateGuaranteeOption();
    }
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
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const paymentOption = this.contratoData.clausulaSextaFormaPagoOpcion;

    if (!price || paymentOption !== 'con_anticipo') return false;

    // Obligatoria si: > 20k CON anticipo
    return price > 20000;
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
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const paymentOption = this.contratoData.clausulaSextaFormaPagoOpcion;

    if (!price || !paymentOption) return false;

    // Incluir punto c) si:
    // - Hay anticipo (cualquier monto), O
    // - Es contrato ≥ 50k (siempre), O
    // - Es contrato < 50k sin anticipo pero con garantía técnica
    return (
      paymentOption === 'con_anticipo' ||
      price >= 50000 ||
      (price < 50000 && this.contratoData.requiereGarantiaTecnica === true)
    );
  }

  getTipoGarantiaTecnicaTexto(): string {
    switch (this.contratoData.tipoGarantiaTecnica) {
      case 'del_fabricante':
        return 'del fabricante, representante, distribuidor o vendedor autorizado';
      case 'incondicional_irrevocable':
        return 'incondicional, irrevocable y de cobro inmediato, o fianza instrumentada en una póliza de seguros, otorgadas, por un banco, institución financiera o compañía de seguros establecidos en el Ecuador, o por intermedio de ellos, por igual valor de los bienes a suministrarse';
      default:
        return '[SELECCIONE TIPO DE GARANTÍA]';
    }
  }

  // Función auxiliar para convertir números a letras (básica)
  private convertirNumeroALetras(numero: number): string {
    // Implementación básica - puedes usar una librería más completa
    const unidades = [
      '',
      'uno',
      'dos',
      'tres',
      'cuatro',
      'cinco',
      'seis',
      'siete',
      'ocho',
      'nueve',
    ];
    const decenas = [
      '',
      '',
      'veinte',
      'treinta',
      'cuarenta',
      'cincuenta',
      'sesenta',
      'setenta',
      'ochenta',
      'noventa',
    ];
    const centenas = [
      '',
      'ciento',
      'doscientos',
      'trescientos',
      'cuatrocientos',
      'quinientos',
      'seiscientos',
      'setecientos',
      'ochocientos',
      'novecientos',
    ];

    if (numero === 0) return 'cero';
    if (numero < 0) return 'menos ' + this.convertirNumeroALetras(-numero);

    // Implementación simplificada para números hasta 999,999
    if (numero < 10) return unidades[numero];
    if (numero < 100) {
      if (numero < 20) {
        const especiales = [
          'diez',
          'once',
          'doce',
          'trece',
          'catorce',
          'quince',
          'dieciséis',
          'diecisiete',
          'dieciocho',
          'diecinueve',
        ];
        return especiales[numero - 10];
      }
      const dec = Math.floor(numero / 10);
      const uni = numero % 10;
      return decenas[dec] + (uni > 0 ? ' y ' + unidades[uni] : '');
    }

    // Para números más grandes, retornar una representación básica
    return numero.toLocaleString('es-ES').replace(/,/g, ' ');
  }

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
      if (!this.contentRef?.nativeElement) {
        throw new Error('El elemento #print para el PDF no está disponible.');
      }

      const contentElement = this.contentRef.nativeElement;

      // Limpiar saltos de página previos por si se genera múltiples veces
      const existingPageBreaks = contentElement.querySelectorAll(
        '.page-break-placeholder'
      );
      existingPageBreaks.forEach((pb: { remove: () => any }) => pb.remove());

      // Clonar el contenido para no modificar el original visible
      const clone = contentElement.cloneNode(true) as HTMLElement;
      document.body.appendChild(clone); // Añadir clon al DOM para que html2canvas lo procese correctamente (temporalmente)
      clone.style.position = 'absolute';
      clone.style.left = '-9999px'; // Moverlo fuera de la vista
      clone.style.width = contentElement.offsetWidth + 'px'; // Asegurar el mismo ancho

      // Ajustar contenido en el clon
      this.adjustContentForPDF(clone);

      const options = {
        margin: [10, 10, 10, 10], // Margen en mm [arriba, izquierda, abajo, derecha] o [vertical, horizontal]
        filename: 'contrato_adquisicion_bienes.pdf',
        image: { type: 'jpeg', quality: 0.98 }, // Calidad de imagen
        html2canvas: {
          scale: 2, // Escala para mejor resolución
          useCORS: true, // Para imágenes de otros dominios
          logging: true, // Para depuración
          scrollX: 0, // Evitar desplazamiento horizontal
          scrollY: -window.scrollY, // Compensar el scroll de la página principal
          windowWidth: clone.scrollWidth,
          windowHeight: clone.scrollHeight,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['css', 'avoid-all'] }, // Modos de salto de página
      };

      await html2pdf().from(clone).set(options).save();
      document.body.removeChild(clone); // Eliminar el clon del DOM
      console.log('PDF generado correctamente.');
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      const cloneIfExists = document.querySelector(
        'body > div[style*="left: -9999px"]'
      );
      if (cloneIfExists) {
        document.body.removeChild(cloneIfExists); // Asegurarse de remover el clon en caso de error
      }
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

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.handleFile(element.files[0]);
    }
  }

  private handleFile(file: File): void {
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeInBytes) {
      alert('La imagen excede el tamaño máximo permitido de 2MB.');
      this.clearImageSelection();
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert(
        'Por favor, seleccione un archivo de imagen válido (JPEG, PNG, GIF).'
      );
      this.clearImageSelection();
      return;
    }

    this.contratoData.clausulaQuintaImagenTablaCantidades = file;
    this.selectedFileName = file.name;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => (this.previewImageUrl = e.target?.result || null);
    reader.readAsDataURL(file);
  }

  clearImageSelection(): void {
    this.contratoData.clausulaQuintaImagenTablaCantidades = null;
    this.selectedFileName = null;
    this.previewImageUrl = null;
    if (this.fileDropRef?.nativeElement) {
      this.fileDropRef.nativeElement.value = ''; // Resetea el input file
    }
  }
}
