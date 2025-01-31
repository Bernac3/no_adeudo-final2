
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DepartamentoService {
  private apiUrl = 'http://localhost:3000/api/register-departamento';
  private apiUrlCrearDepartamentoAdmin = 'http://localhost:3000/api/crear-departamento-admin';
  private apiUrlObtenerDepartamentos = 'http://localhost:3000/api/obtener-departamento'
  private apiUrlGuardarDepartamentoAdmin = 'http://localhost:3000/api/guardar-departamento-adm'
  private apiUrlEliminarDepartamentoAdmin = 'http://localhost:3000/api/eliminar-departamento-adm'
  private apiUrlEliminarAlumnoAdmin = 'http://localhost:3000/api/eliminar-alumno-adm'


  constructor(private http: HttpClient) {}

  registrarDepartamento(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }
  // En tu archivo departamento.service.ts
  crearDepartamentoAdmin(nuevoDepartamentoAdmin: any, authData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify(authData)
    });

    // Enviar los datos como JSON
    return this.http.post(`${this.apiUrlCrearDepartamentoAdmin}`, nuevoDepartamentoAdmin, { headers });
  }

  obtenerDepartamentos(authData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify(authData)
    });

    return this.http.post(this.apiUrlObtenerDepartamentos, {}, { headers });
  }

  guardarDepartamentoAdmin(departamentoModal: any, authData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify(authData)
    });

    // Realizar la llamada para hacer el update en la tabla departamentos
    return this.http.post(`${this.apiUrlGuardarDepartamentoAdmin}`, departamentoModal, { headers });
  }

  eliminarDepartamentoAdmin(idDepartamento: any, authData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify(authData)
    });

    return this.http.post(`${this.apiUrlEliminarDepartamentoAdmin}`, idDepartamento, { headers });
  }
  eliminarAlumnoAdminModal(idAlumno: string, authData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify(authData), // Asegúrate de que `authData` sea un JSON válido
    });

    // El cuerpo de la solicitud debe ser un JSON válido
    const body = { alumnoId: idAlumno };

    return this.http.post(this.apiUrlEliminarAlumnoAdmin, body, { headers });
  }

}
