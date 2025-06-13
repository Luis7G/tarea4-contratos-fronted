import { Injectable } from '@angular/core';

interface CurrencyConfig {
  singular?: string;
  plural?: string;
  centSingular?: string;
  centPlural?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClaseMonedaLiteral {
  private Unidades(num: number): string {
    switch (num) {
      case 1:
        return 'UN';
      case 2:
        return 'DOS';
      case 3:
        return 'TRES';
      case 4:
        return 'CUATRO';
      case 5:
        return 'CINCO';
      case 6:
        return 'SEIS';
      case 7:
        return 'SIETE';
      case 8:
        return 'OCHO';
      case 9:
        return 'NUEVE';
      case 0:
        return '';
      default:
        return '';
    }
  }

  private Decenas(num: number): string {
    const decena = Math.floor(num / 10);
    const unidad = num - decena * 10;

    switch (decena) {
      case 1:
        switch (unidad) {
          case 0:
            return 'DIEZ';
          case 1:
            return 'ONCE';
          case 2:
            return 'DOCE';
          case 3:
            return 'TRECE';
          case 4:
            return 'CATORCE';
          case 5:
            return 'QUINCE';
          default:
            return 'DIECI' + this.Unidades(unidad);
        }
      case 2:
        switch (unidad) {
          case 0:
            return 'VEINTE';
          default:
            return 'VEINTI' + this.Unidades(unidad);
        }
      case 3:
        return this.DecenasY('TREINTA', unidad);
      case 4:
        return this.DecenasY('CUARENTA', unidad);
      case 5:
        return this.DecenasY('CINCUENTA', unidad);
      case 6:
        return this.DecenasY('SESENTA', unidad);
      case 7:
        return this.DecenasY('SETENTA', unidad);
      case 8:
        return this.DecenasY('OCHENTA', unidad);
      case 9:
        return this.DecenasY('NOVENTA', unidad);
      case 0:
        return this.Unidades(unidad);
      default:
        return '';
    }
  }

  private DecenasY(strSin: string, numUnidades: number): string {
    if (numUnidades > 0) {
      return strSin + ' Y ' + this.Unidades(numUnidades);
    }
    return strSin;
  }

  private Centenas(num: number): string {
    const centenas = Math.floor(num / 100);
    const decenas = num - centenas * 100;

    switch (centenas) {
      case 1:
        if (decenas > 0) {
          return 'CIENTO ' + this.Decenas(decenas);
        }
        return 'CIEN';
      case 2:
        return 'DOSCIENTOS ' + this.Decenas(decenas);
      case 3:
        return 'TRESCIENTOS ' + this.Decenas(decenas);
      case 4:
        return 'CUATROCIENTOS ' + this.Decenas(decenas);
      case 5:
        return 'QUINIENTOS ' + this.Decenas(decenas);
      case 6:
        return 'SEISCIENTOS ' + this.Decenas(decenas);
      case 7:
        return 'SETECIENTOS ' + this.Decenas(decenas);
      case 8:
        return 'OCHOCIENTOS ' + this.Decenas(decenas);
      case 9:
        return 'NOVECIENTOS ' + this.Decenas(decenas);
      default:
        return this.Decenas(decenas);
    }
  }

  private Seccion(
    num: number,
    divisor: number,
    strSingular: string,
    strPlural: string
  ): string {
    const cientos = Math.floor(num / divisor);
    let letras = '';

    if (cientos > 0) {
      if (cientos > 1) {
        letras = this.Centenas(cientos) + ' ' + strPlural;
      } else {
        letras = divisor === 1000 ? 'MIL' : strSingular; // Caso especial para "MIL"
      }
    }

    return letras;
  }

  private Miles(num: number): string {
    const divisor = 1000;
    const resto = num % divisor;

    const strMiles = this.Seccion(num, divisor, 'UN MIL', 'MIL');
    const strCentenas = resto > 0 ? this.Centenas(resto) : '';

    return strMiles + (strCentenas ? ' ' + strCentenas : '');
  }

  private Millones(num: number): string {
    const divisor = 1000000;
    const resto = num % divisor;

    const strMillones = this.Seccion(
      num,
      divisor,
      'UN MILLÓN',
      'MILLONES'
    );
    const strMiles = resto > 0 ? this.Miles(resto) : '';

    return strMillones + (strMiles ? ' ' + strMiles : '');
  }

  public numeroALetras(num: number, currency: CurrencyConfig = {}): string {
    if (isNaN(num) || num === undefined || num === null) {
      throw new Error('El número debe ser un valor válido');
    }
    if (num < 0) {
      return 'MENOS ' + this.numeroALetras(-num, currency);
    }

    const data = {
      numero: num,
      enteros: Math.floor(num),
      centavos: Math.round((num - Math.floor(num)) * 100),
      letrasCentavos: '',
      letrasMonedaPlural:
        currency.plural || 'DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA',
      letrasMonedaSingular:
        currency.singular || 'DÓLAR DE LOS ESTADOS UNIDOS DE AMÉRICA',
      letrasMonedaCentavoPlural: currency.centPlural || 'CENTAVOS DE DÓLAR',
      letrasMonedaCentavoSingular: currency.centSingular || 'CENTAVO DE DÓLAR',
    };

    if (data.centavos > 0) {
      const centavosTexto = this.Decenas(data.centavos);
      data.letrasCentavos =
        'CON ' +
        (centavosTexto || 'CERO') +
        ' ' +
        (data.centavos === 1
          ? data.letrasMonedaCentavoSingular
          : data.letrasMonedaCentavoPlural);
    }

    if (data.enteros === 0) {
      return (
        'CERO ' +
        data.letrasMonedaPlural +
        (data.letrasCentavos ? ' ' + data.letrasCentavos : '')
      );
    }
    if (data.enteros === 1) {
      return (
        this.Millones(data.enteros) +
        ' ' +
        data.letrasMonedaSingular +
        (data.letrasCentavos ? ' ' + data.letrasCentavos : '')
      );
    }
    return (
      this.Millones(data.enteros) +
      ' ' +
      data.letrasMonedaPlural +
      (data.letrasCentavos ? ' ' + data.letrasCentavos : '')
    );
  }
}
