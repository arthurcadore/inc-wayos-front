import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../pages/service/auth.service';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';

/**
 * Interceptor para tratar erros de autenticação
 * Realiza logout automático quando recebe respostas 401 ou 403
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const messageService = inject(MessageService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Verifica se o erro é 401 Unauthorized ou 403 Forbidden
            if (error.status === 401 || error.status === 403) {
                // Evita loop infinito: não intercepta erros do endpoint de login
                if (!req.url.includes('/v1/auth/login')) {
                    // Exibe notificação ao usuário
                    messageService.add({
                        severity: 'warn',
                        summary: 'Sessão Expirada',
                        detail: 'Sua sessão expirou. Faça login novamente.',
                        life: 3000
                    });

                    // Realiza logout automático
                    // Pequeno delay para garantir que o toast seja exibido antes do redirect
                    setTimeout(() => {
                        authService.logout();
                    }, 500);

                    if (environment.enableDebug) {
                        console.warn(`🔒 Auto-logout: Recebido status ${error.status} da URL ${req.url}`);
                    }
                }
            }

            // Propaga o erro para tratamento adicional se necessário
            return throwError(() => error);
        })
    );
};
