import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { jsPDF } from 'jspdf';
import html2canvas from "html2canvas";
declare const html2pdf: any;


@Component({
  selector: 'app-plantilla-word',
  standalone: false,
  templateUrl: './plantilla-word.component.html',
  styleUrl: './plantilla-word.component.css'
})
export class PlantillaWordComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    throw new Error('Method not implemented.');
  }
    @ViewChild('content', { static: false }) contentRef!: ElementRef;

  // Ajustar contenido para evitar cortes de texto
  private adjustContentForPDF(container: HTMLElement): void {
    const pageHeight = 297; // Altura de una página A4 en mm
    const margin = 10; // Márgenes en mm
    const maxHeight = pageHeight - 2 * margin;

    let currentPageHeight = 0;
    const blocks = Array.from(container.children) as HTMLElement[];

    blocks.forEach((block) => {
      const blockHeight = block.offsetHeight / 3.78; // Convertir px a mm
      if (currentPageHeight + blockHeight > maxHeight) {
        const pageBreak = document.createElement('div');
        pageBreak.classList.add('page');
        block.parentElement?.insertBefore(pageBreak, block);
        currentPageHeight = 0;
      }
      currentPageHeight += blockHeight;
    });
  }

  async generatePDF() {
    try {
      if (!this.contentRef?.nativeElement) {
        throw new Error('Elementos necesarios para el PDF no están disponibles');
      }

      const contentElement = this.contentRef.nativeElement;

      // Ajustar contenido antes de generar el PDF
      this.adjustContentForPDF(contentElement);

      const options = {
        margin: [10, 10, 10, 10],
        filename: 'reporte.pdf',
        html2canvas: {
          scale: 3, // Alta calidad de renderizado
          useCORS: true, // Permite cargar imágenes remotas
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'], // Prioriza las reglas CSS
        },
      };

      await html2pdf().from(contentElement).set(options).save();
      console.log('PDF generado correctamente.');
    } catch (error) {
      console.error('Error al generar el PDF:', error);
    }
  }
}