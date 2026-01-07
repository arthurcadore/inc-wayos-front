import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    access_token: string;
    user: AuthUser;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';
    private readonly VIEW_GLOBAL_CACHE_KEY = 'view_global_cache';
    private readonly VIEW_GLOBAL_CACHE_TIMESTAMP_KEY = 'view_global_cache_timestamp';
    private readonly AUTH_ENDPOINT = `${environment.apiUrl}/v1/auth/login`;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {}

    /**
     * Realiza login via API
     * @param email Email do usuário
     * @param password Senha do usuário
     * @returns Observable com resultado do login (true se sucesso, false se erro)
     */
    login(email: string, password: string): Observable<boolean> {
        const credentials: LoginCredentials = { email, password };

        return this.http.post<AuthResponse>(this.AUTH_ENDPOINT, credentials).pipe(
            tap(response => {
                if (environment.enableDebug) {
                    console.log('✅ Login bem-sucedido:', response.user.email);
                }
                this.setAuthData(response.access_token, response.user);
            }),
            map(() => true),
            catchError(error => {
                console.error('❌ Erro ao fazer login:', error);
                return of(false);
            })
        );
    }

    /**
     * Armazena token e dados do usuário
     */
    private setAuthData(token: string, user: AuthUser): void {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    /**
     * Realiza logout e redireciona para login
     */
    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.VIEW_GLOBAL_CACHE_KEY);
        localStorage.removeItem(this.VIEW_GLOBAL_CACHE_TIMESTAMP_KEY);
        this.router.navigate(['/login']);
    }

    /**
     * Verifica se usuário está autenticado
     */
    isAuthenticated(): boolean {
        const token = localStorage.getItem(this.TOKEN_KEY);
        return !!token;
    }

    /**
     * Retorna o token de autenticação
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Retorna os dados do usuário autenticado
     */
    getUser(): AuthUser | null {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }
}