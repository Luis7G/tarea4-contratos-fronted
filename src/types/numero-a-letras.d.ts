declare module 'numero-a-letras' {
  interface NumeroALetrasOptions {
    plural?: string;
    singular?: string;
    centPlural?: string;
    centSingular?: string;
  }

  function numeroALetras(numero: number, options?: NumeroALetrasOptions): string;
  
  export = numeroALetras;
}