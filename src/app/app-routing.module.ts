import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlantillaWordComponent } from './plantilla-word/contrato-adquisicion-bienes.component';

const routes: Routes = [
  { path: '', redirectTo: 'contrato-adquisicion-bienes', pathMatch: 'full' }, // Ruta por defecto
  { path: 'contrato-adquisicion-bienes', component: PlantillaWordComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
