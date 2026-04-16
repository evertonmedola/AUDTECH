import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  // Retorna a URL completa para exibir um arquivo salvo no backend
  urlArquivo(caminho: string): string {
    if (!caminho) return '';
    // Cloudinary já retorna URL completa
    if (caminho.startsWith('http')) return caminho;
    // Fallback para disco local
    const nome = caminho.split(/[\\/]/).pop();
    return `${environment.apiUrl.replace('/api/v1', '')}/uploads/${nome}`;
  }

  // Verifica se o arquivo é imagem (para mostrar thumbnail)
  isImagem(nomeOuUrl: string): boolean {
    const ext = nomeOuUrl.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png'].includes(ext ?? '');
  }

  isPdf(nomeOuUrl: string): boolean {
    return nomeOuUrl.split('.').pop()?.toLowerCase() === 'pdf';
  }
}
