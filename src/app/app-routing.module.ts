import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlantillaWordComponent } from './plantilla-word/plantilla-word.component';

const routes: Routes = [

  { path: '', redirectTo: 'plantilla', pathMatch: 'full' }, // Redirige a 'plantilla' por defecto
  { path: 'plantilla', component: PlantillaWordComponent }, // Ruta para el componente

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
