import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'; // Importar HttpClientModule
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlantillaWordComponent } from './plantilla-word/contrato-adquisicion-bienes.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ArchivoAdjuntoComponent } from './plantilla-word/archivo-adjunto/archivo-adjunto.component';

@NgModule({
  declarations: [AppComponent, PlantillaWordComponent],
  imports: [
    BrowserModule,
    HttpClientModule, // Agregar HttpClientModule aquí
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    AppRoutingModule,
    ArchivoAdjuntoComponent,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
