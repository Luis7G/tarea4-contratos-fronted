import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http'; // Importar HttpClientModule
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlantillaWordComponent } from './components/adquisicion-bienes/contrato-adquisicion-bienes.component';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ArchivoAdjuntoComponent } from './components/archivo-adjunto/archivo-adjunto.component';

@NgModule({
  declarations: [AppComponent, PlantillaWordComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    AppRoutingModule,
    ArchivoAdjuntoComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
