import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResourceService {
  getAssetUrl(assetPath: string): string {
    // Remover la parte '/api' del apiUrl para obtener la URL base
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/${assetPath}`;
  }

  getLogoUrl(): string {
    return this.getAssetUrl('assets/logo-hidalgo.png');
  }
}
