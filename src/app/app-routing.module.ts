import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlantillaWordComponent } from './plantilla-word/contrato-adquisicion-bienes.component';

const routes: Routes = [
  { path: '', redirectTo: '/contrato-adquisicion-bienes', pathMatch: 'full' },
  { path: 'contrato-adquisicion-bienes', component: PlantillaWordComponent },
  { path: '**', redirectTo: '/contrato-adquisicion-bienes' }, // Wildcard route
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: false, // Solo para debug
      useHash: false,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
