import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface FileHistory {
  uuidFile: string;
  originalFilename: string;
  size: number;
  contentType: string;
  downloadUrl: string;
  status: string;
  uploadedAt: string;
  expiresAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly apiUrl = 'http://localhost:8080/api/files';
  private readonly downloadBaseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  history() {
    return this.http.get<FileHistory[]>(`${this.apiUrl}/history`, {
      headers: this.authHeaders()
    });
  }

  upload(file: File, expirationDays = 7) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('expirationDays', String(expirationDays));

    return this.http.post(`${this.apiUrl}/upload`, formData, {
      headers: this.authHeaders()
    });
  }

  delete(uuidFile: string) {
    return this.http.delete(`${this.apiUrl}/${uuidFile}`, {
      headers: this.authHeaders()
    });
  }

  getDownloadUrl(file: FileHistory): string {
    return `${this.downloadBaseUrl}${file.downloadUrl}`;
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}
