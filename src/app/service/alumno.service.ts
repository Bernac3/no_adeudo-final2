import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private apiUrl = 'http://localhost:3000/api/register';

  constructor(private http: HttpClient) {}

  registrarAlumno(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }
}
