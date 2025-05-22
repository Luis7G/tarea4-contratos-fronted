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
  // Datos Generales del Contratista
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
  clausulaCuartaLapsoSoporte: string;
  clausulaCuartaCapacitacionNumeroServidores: string; // Podría ser number
  clausulaCuartaCapacitacionLugar: string;
  clausulaCuartaCapacitacionPersonalCertificado: string;

  // Cláusula Quinta
  clausulaQuintaPrecioTotalLetrasNumeros: number | null; // MODIFIED: Changed to number | null
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
  clausulaSeptimaGarantiasOpcion: string; // Para seleccionar OPCION 1.1, 1.2, 2.1, 2.2
  clausulaSeptimaTextoGeneral: string; // Texto general de garantías si no es por opción

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
  standalone: false, // Asumo que sigue siendo parte de un NgModule
  templateUrl: './plantilla-word.component.html',
  styleUrl: './plantilla-word.component.css',
})
export class PlantillaWordComponent implements AfterViewInit {
  @ViewChild('print', { static: false }) contentRef!: ElementRef; // Cambiado a 'print' si ese es el ID del div a imprimir
  @ViewChild('fileDropRef', { static: false }) fileDropRef!: ElementRef; // Para el input de archivo

  // Datos del contrato que se mostrarán en la plantilla
  contratoData: ContratoData;
  selectedFileName: string | null = null;
  previewImageUrl: string | ArrayBuffer | null = null;

  constructor() {
    this.contratoData = {
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
      // clausulaQuintaTablaCantidadesPrecios: '', // Removido
      clausulaQuintaImagenTablaCantidades: null, // Inicializar
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

  onPriceChange(): void {
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;

    if (price === null || price <= 0) {
      // Si el precio no es válido, limpiar las opciones dependientes
      this.contratoData.clausulaSextaFormaPagoOpcion = '';
      this.contratoData.clausulaSeptimaGarantiasOpcion = '';
    } else {
      // Si el precio es válido, actualizar la opción de garantía
      this.updateGuaranteeOption();
    }
  }

  onPaymentOptionChange(): void {
    // Cuando cambia la opción de pago, actualizar la opción de garantía
    this.updateGuaranteeOption();
  }

  private updateGuaranteeOption(): void {
    const price = this.contratoData.clausulaQuintaPrecioTotalLetrasNumeros;
    const paymentOption = this.contratoData.clausulaSextaFormaPagoOpcion;

    if (price === null || price <= 0 || !paymentOption) {
      this.contratoData.clausulaSeptimaGarantiasOpcion = '';
      return;
    }

    if (price < 50000) {
      if (paymentOption === 'con_anticipo') {
        this.contratoData.clausulaSeptimaGarantiasOpcion = 'opcion1_2';
      } else if (
        paymentOption === 'sin_anticipo_un_pago' ||
        paymentOption === 'sin_anticipo_varios_pagos'
      ) {
        this.contratoData.clausulaSeptimaGarantiasOpcion = 'opcion1_1';
      } else {
        this.contratoData.clausulaSeptimaGarantiasOpcion = ''; // Si la opción de pago no coincide
      }
    } else {
      // price >= 50000
      if (paymentOption === 'con_anticipo') {
        this.contratoData.clausulaSeptimaGarantiasOpcion = 'opcion2_1';
      } else if (
        paymentOption === 'sin_anticipo_un_pago' ||
        paymentOption === 'sin_anticipo_varios_pagos'
      ) {
        this.contratoData.clausulaSeptimaGarantiasOpcion = 'opcion2_2';
      } else {
        this.contratoData.clausulaSeptimaGarantiasOpcion = ''; // Si la opción de pago no coincide
      }
    }
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
