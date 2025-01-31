import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Alumno } from '../interfaces/alumno.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/login';

  private userSubject = new BehaviorSubject<Alumno | null>(null);

  constructor(private http: HttpClient) {
    // Intentamos cargar datos desde localStorage al inicializar el servicio
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser)); // Establecemos el usuario desde el localStorage
    }
  }

  /**
   * Iniciar sesión y obtener los datos del usuario.
   * @param correo Email del usuario.
   * @param contrasena Contraseña del usuario.
   * @param tipo_usuario Tipo de usuario (Alumno, Departamento, Admin).
   */
  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { correo, contrasena }).pipe(
      map((user) => {
        // Guardar los datos completos en localStorage
        localStorage.setItem('user', JSON.stringify(user));

        // Guardar los datos relevantes en sessionStorage (correo, contrasena y rol)
        const sessionData = { correo, contrasena, tipo_usuario: user.rol }; // Agregamos el tipo_usuario (rol)
        sessionStorage.setItem('user', JSON.stringify(sessionData));

        // Almacenar el usuario en el BehaviorSubject
        this.userSubject.next(user);

        return user;
      })
    );
  }
  /**
   * Actualizar el usuario actual.
   * @param user Datos del usuario.
   */
  setUser(user: Alumno): void {
    this.userSubject.next(user); // Actualizamos el BehaviorSubject
  }

  /**
   * Verificar si el usuario está autenticado.
   * @returns Observable que emite true si el usuario está autenticado, false en caso contrario.
   */
  isUserAuthenticated(): Observable<boolean> {
    return this.userSubject.asObservable().pipe(map((user) => !!user));
  }

  /**
   * Obtener los datos del usuario actual.
   * @returns Observable con los datos del usuario actual o null si no hay usuario autenticado.
   */
  getUser(): Observable<Alumno | null> {
    // Si no hay datos en el BehaviorSubject, intentamos recuperarlos del localStorage
    if (!this.userSubject.value) {
      const storedUser = localStorage.getItem('usuario');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.userSubject.next(user);
      }
    }
    return this.userSubject.asObservable();
  }

  /**
   * Cerrar sesión del usuario actual.
   */
  logout(): void {
    this.userSubject.next(null); // Limpiamos el BehaviorSubject
    localStorage.removeItem('usuario'); // Eliminamos los datos del localStorage
    sessionStorage.removeItem('usuario'); // Eliminamos los datos del sessionStorage
    localStorage.removeItem('user'); // Eliminamos los datos del localStorage
    sessionStorage.removeItem('user');
  }

  /**
   * Obtener datos combinados de alumnos y peticiones.
   * @returns Observable con un arreglo de alumnos y peticiones.
   */
  getAlumnosYPeticiones(): Observable<Alumno[]> {
    //problema aqui
    const urlAlumnosypeticiones = 'http://localhost:3000/api/alumnos-peticiones';
    // const url = 'https://no-adeudo-repositorio-1.onrender.com/alumno/alumnos-peticiones';
    return this.http.get<Alumno[]>(urlAlumnosypeticiones, { responseType: 'json' }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al obtener los datos:', error);
        return throwError(() => new Error('Error al obtener los datos. Intenta nuevamente.'));
      })
    );
  }

}
