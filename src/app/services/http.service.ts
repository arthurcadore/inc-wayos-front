import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class HttpService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {
        if (environment.enableDebug) {
            console.log(`🌍 Ambiente: ${environment.name}`);
            console.log(`🔗 API URL: ${this.baseUrl}`);
        }
    }

    /**
     * Requisição GET
     */
    get<T>(endpoint: string, params?: HttpParams): Observable<T> {
        return this.http
            .get<T>(`${this.baseUrl}${endpoint}`, {
                headers: this.getHeaders(),
                params: params
            })
            .pipe(catchError(this.handleError));
    }

    /**
     * Requisição POST
     */
    post<T>(endpoint: string, body: any): Observable<T> {
        return this.http
            .post<T>(`${this.baseUrl}${endpoint}`, body, {
                headers: this.getHeaders()
            })
            .pipe(catchError(this.handleError));
    }

    /**
     * Requisição PUT
     */
    put<T>(endpoint: string, body: any): Observable<T> {
        return this.http
            .put<T>(`${this.baseUrl}${endpoint}`, body, {
                headers: this.getHeaders()
            })
            .pipe(catchError(this.handleError));
    }

    /**
     * Requisição PATCH
     */
    patch<T>(endpoint: string, body: any): Observable<T> {
        return this.http
            .patch<T>(`${this.baseUrl}${endpoint}`, body, {
                headers: this.getHeaders()
            })
            .pipe(catchError(this.handleError));
    }

    /**
     * Requisição DELETE
     */
    delete<T>(endpoint: string): Observable<T> {
        return this.http
            .delete<T>(`${this.baseUrl}${endpoint}`, {
                headers: this.getHeaders()
            })
            .pipe(catchError(this.handleError));
    }

    /**
     * Headers padrão com token de autenticação
     */
    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        });
    }

    /**
     * Tratamento de erros
     */
    private handleError(error: any): Observable<never> {
        console.error('Erro na requisição HTTP:', error);
        return throwError(() => error);
    }
}
