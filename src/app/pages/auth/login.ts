import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
// import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../service/auth.service';
import { ToastModule } from 'primeng/toast';
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
        // AppFloatingConfigurator,        
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />
        <!-- <app-floating-configurator /> -->
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <svg style="width: 290px;" viewBox="0 0 83 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="mb-8 w-16 shrink-0 mx-auto">
                                <g transform="translate(0.606571, 0.710258)" fill-rule="nonzero">
                                    <path fill="var(--primary-color)" d="M60.846789,4.65985938 C60.0422223,4.16925 59.0991052,3.88582813 58.0897421,3.88582813 C55.1429128,3.88582813 52.7531825,6.29571094 52.7531825,9.26725781 C52.7531825,9.26964844 52.7534459,9.27164063 52.7534459,9.27376563 L52.7534459,15.9954063 L55.7553265,15.9954063 L55.7555899,9.26725781 L55.7553265,9.26725781 C55.7553265,7.96715625 56.8007759,6.91275781 58.0897421,6.91275781 C58.4495516,6.91275781 58.7892107,6.99603125 59.0931786,7.14239063 C59.4948693,6.18985938 60.0972736,5.34450781 60.846789,4.65985938 Z"></path>
                                    <path fill="var(--primary-color)" d="M1.69105196,0.089515625 C0.784548017,0.089515625 0.0497833054,0.830609375 0.0497833054,1.74435938 C0.0497833054,2.65890625 0.784548017,3.4 1.69105196,3.4 C2.59781931,3.4 3.33258402,2.65890625 3.33258402,1.74435938 C3.33258402,0.830609375 2.59781931,0.089515625 1.69105196,0.089515625 Z"></path>
                                    <path fill="var(--primary-color)" d="M22.3530992,12.7389766 C22.049263,12.8852031 21.7097356,12.9686094 21.3503212,12.9686094 C20.0610917,12.9686094 19.0155105,11.9143438 19.0155105,10.6139766 L19.0156422,10.6139766 L19.016169,6.91382031 L21.2886847,6.91328906 C21.2886847,6.91275781 21.664957,5.57892188 21.664957,3.88635938 L19.016169,3.88689063 L19.016169,0.34478125 C17.3372337,0.34478125 16.0134982,0.79209375 16.0134982,0.79209375 C16.0134982,0.79209375 16.0142884,2.61135938 16.0138933,3.88596094 L16.0134982,3.88596094 L16.0134982,10.6074688 C16.0134982,10.6097266 16.0134982,10.6118516 16.0134982,10.6139766 C16.0134982,13.5857891 18.4029652,15.9955391 21.3501895,15.9955391 C22.3590258,15.9955391 23.3018795,15.7123828 24.1068413,15.2215078 C23.3570626,14.5368594 22.7546582,13.6912422 22.3530992,12.7389766 Z"></path>
                                    <path fill="var(--primary-color)" d="M34.6503659,11.3745938 C33.101947,10.7544922 31.7479201,10.7096016 31.7479201,10.7096016 C31.372043,12.1676172 29.9696816,13.1483047 28.4508956,12.9464297 C28.1097878,12.9014063 27.7897523,12.7992734 27.4985594,12.6521172 L34.288976,7.39765625 C33.4520106,5.58197656 31.7406765,4.2234375 29.6265982,3.94267188 C26.3398464,3.50638281 23.325059,5.8395 22.8922867,9.15370313 C22.4595143,12.4680391 24.7732527,15.5083828 28.0594777,15.9446719 C31.096391,16.3480234 33.9009823,14.2900938 34.6511561,11.3747266 L34.6503659,11.3745938 Z M25.8650612,9.5486875 C26.0817108,7.88985938 27.590619,6.7224375 29.2349168,6.94064844 C29.5760247,6.9859375 29.8960602,7.08820313 30.187253,7.23522656 L25.9006207,10.5522188 C25.8351649,10.2305469 25.8201509,9.8929375 25.8650612,9.5486875 Z"></path>
                                    <path fill="var(--primary-color)" d="M9.6615172,3.88622656 C6.71429284,3.88622656 4.32456248,6.29571094 4.32456248,9.26752344 C4.32456248,9.26951563 4.32482588,9.27164063 4.32482588,9.27376563 L4.32482588,15.9956719 L7.32683822,15.9956719 L7.32683822,9.26752344 L7.32683822,9.26752344 C7.32683822,7.96715625 8.37228763,6.91289063 9.6616489,6.91289063 C10.951537,6.91289063 11.9965913,7.96715625 11.9965913,9.26752344 L11.9965913,15.9956719 L14.9987353,15.9956719 L14.9987353,9.26752344 C14.9987353,6.29571094 12.6092684,3.88622656 9.6615172,3.88622656 Z"></path>
                                    <path fill="var(--primary-color)" d="M0.190045793,15.9956719 L3.19218983,15.9956719 L3.19218983,3.88635938 C1.51299104,3.88635938 0.190045793,4.33367188 0.190045793,4.33367188 L0.190045793,15.9956719 Z"></path>
                                    <path fill="var(--primary-color)" d="M35.5620062,15.9954063 L38.5642819,15.9954063 L38.5642819,0.34478125 C36.9215646,0.3453125 35.6181112,0.773234375 35.5647719,0.791164063 L35.5620062,15.9954063 Z"></path>
                                    <path fill="var(--primary-color)" d="M45.7816759,3.88582813 C44.6878919,3.88582813 43.6633831,4.18226563 42.7803221,4.69784375 L42.7795319,0.34478125 C41.1344438,0.3453125 39.829015,0.7745625 39.7797585,0.791164063 C39.7797585,0.791164063 39.7772561,9.93357813 39.7772561,9.94075 C39.7772561,13.2841719 42.4659497,15.9952734 45.7815442,15.9952734 C49.098324,15.9952734 51.7860957,13.2841719 51.7860957,9.94075 C51.7862274,6.59692969 49.098324,3.88582813 45.7816759,3.88582813 Z M45.7816759,12.9679453 C44.1238128,12.9679453 42.7795319,11.6123281 42.7795319,9.94061719 L42.7803221,9.94061719 L42.7803221,9.91803906 C42.7924386,8.25615625 44.1313198,6.91302344 45.7816759,6.91302344 C47.4403292,6.91302344 48.7843467,8.26850781 48.7843467,9.94061719 C48.7843467,11.6123281 47.4401975,12.9679453 45.7816759,12.9679453 Z"></path>
                                    <path fill="var(--primary-color)" d="M65.5601353,3.88582813 C62.2441458,3.88582813 59.5561107,6.59692969 59.5561107,9.94075 C59.5561107,13.2841719 62.2441458,15.9952734 65.5601353,15.9952734 C66.6544462,15.9952734 67.6800086,15.6989688 68.563333,15.1833906 L68.563333,15.9956719 L71.5649502,15.9956719 L71.5649502,9.94061719 C71.5648185,6.59653125 68.87652,3.88582813 65.5601353,3.88582813 Z M68.5618843,9.94061719 L68.5618843,9.97063281 C68.5459484,11.6286641 67.2083842,12.9679453 65.5600036,12.9679453 C63.9018771,12.9679453 62.5575962,11.6127266 62.5575962,9.94061719 C62.5575962,8.26877344 63.9018771,6.91275781 65.5600036,6.91275781 C67.2183935,6.91275781 68.5621477,8.26877344 68.5621477,9.94061719 L68.5618843,9.94061719 Z"></path>
                                    <path fill="var(--primary-color)" d="M78.3269191,8.63267969 L76.351918,8.6306875 C75.8814789,8.6306875 75.4999386,8.24619531 75.4999386,7.77152344 C75.4999386,7.29738281 75.8813472,6.91275781 76.351918,6.91275781 L80.6648907,6.91275781 C80.682407,6.85870313 81.1070138,5.55461719 81.1075406,3.89844531 C81.1075406,3.89844531 76.4362072,3.89804688 76.148702,3.89804688 C74.1324781,3.89804688 72.498058,5.54625 72.498058,7.57960938 C72.498058,9.61296875 74.1324781,11.2627656 76.148702,11.2627656 L78.1237032,11.2627656 C78.5941422,11.2627656 78.9756825,11.6473906 78.9756825,12.1217969 C78.9756825,12.5962031 78.5942739,12.9806953 78.1237032,12.9806953 L73.2315056,12.9806953 C73.2134625,13.0346172 72.7891191,14.3388359 72.7888557,15.9951406 C72.7888557,15.9951406 78.2544831,15.9954063 78.3270508,15.9954063 C80.3432747,15.9954063 81.9779583,14.3474688 81.9779583,12.3138438 C81.9778266,10.2808828 80.343143,8.63267969 78.3269191,8.63267969 Z"></path>
                                </g>
                            </svg>
                            <!-- <svg style="width: 90px;" viewBox="0 0 90 35" xmlns="http://www.w3.org/2000/svg" class="mb-8 w-16 shrink-0 mx-auto">
                                <path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    fill="var(--primary-color)"
                                    d="M 55.781314,0.37590805 A 16.910268,17.191745 0 0 0 38.872534,17.568234 16.910268,17.191745 0 0 0 55.781314,34.760561 16.910268,17.191745 0 0 0 70.929656,25.146485 H 64.038853 A 10.908446,11.244105 0 0 1 55.87719,28.942749 10.908446,11.244105 0 0 1 44.969814,17.698788 10.908446,11.244105 0 0 1 55.87719,6.4527875 10.908446,11.244105 0 0 1 64.365238,10.638675 H 71.25196 A 16.910268,17.191745 0 0 0 55.781314,0.37590805 Z M 72.358517,1.155613 v 33.042394 h 17.506577 l -6.52e-4,-5.976924 h -11.57184 v -7.57825 H 89.422329 V 14.580234 H 78.292602 V 7.0896992 H 89.854789 V 1.155613 Z M 0.2,1.155152 v 33.042395 h 18.491746 l 4.912094,-8.428891 h 8.814433 v 8.428891 h 5.976924 V 1.155152 H 32.981286 L 15.529892,28.220623 H 6.1340861 v -7.57825 H 17.263812 V 14.579772 H 6.1340861 V 7.0892381 H 17.696272 V 1.155152 Z m 32.218273,9.483523 v 9.06738 h -5.283357 z" />
                            </svg> -->
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Seja Bem-Vindo!</div>
                            <span class="text-muted-color font-medium">Faça login para continuar</span>
                        </div>


                        <div>
                            <form (ngSubmit)="handleLogin()" [formGroup]="form">
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="text" placeholder="Digite seu e-mail" class="w-full md:w-120 mb-8" formControlName="email" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Senha</label>
                            <p-password id="password1" formControlName="password" placeholder="Digite sua senha" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <!-- <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="checked" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">Remember me</label>
                                </div>
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                            </div> -->
                            <p-button label="Entrar" styleClass="w-full" type="submit" [disabled]="!form.valid"></p-button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    // email: string = '';

    // password: string = '';

    // checked: boolean = false;

    form = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    });

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly messageService: MessageService,
    ) { }

    handleLogin() {
        const { email, password } = this.form.value;
        this.authService.login(email!, password!).subscribe({
            next: (success) => {
                if (success) {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Sucesso', 
                        detail: 'Login realizado com sucesso!', 
                        life: 3000 
                    });
                    setTimeout(() => {
                        this.router.navigate(['/']);
                    }, 1000);
                } else {
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Erro', 
                        detail: 'Usuário ou senha inválidos', 
                        life: 3000 
                    });
                }
            },
            error: (error) => {
                console.error('Erro no login:', error);
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Erro', 
                    detail: 'Erro ao conectar com o servidor', 
                    life: 3000 
                });
            }
        });
    }
}
