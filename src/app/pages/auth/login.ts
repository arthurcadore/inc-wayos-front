import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../service/auth.service';
import { LoadingModalService } from '@/layout/component/app.loading-modal';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        RippleModule,
    ],
    templateUrl: './login.html',
})
export class Login {
    form = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    });

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly messageService: MessageService,
        private readonly loadingModalService: LoadingModalService,
    ) { }

    handleLogin() {
        this.loadingModalService.show();
        const { email, password } = this.form.value;
        this.authService.login(email!, password!).subscribe({
            next: (success) => {
                if (success) {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Sucesso', 
                        detail: 'Login realizado com sucesso!', 
                        life: 3000,
                    });
                    this.loadingModalService.hide();
                    this.router.navigate(['/']);
                } else {
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Erro', 
                        detail: 'Usuário ou senha inválidos', 
                        life: 3000,
                    });
                }
            },
            error: (error) => {
                console.error('Erro no login:', error);
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Erro', 
                    detail: 'Erro ao conectar com o servidor', 
                    life: 3000,
                });
            },
            complete: () => {
                this.loadingModalService.hide();
            }
        });
    }
}
