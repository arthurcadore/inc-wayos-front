import { LoadingModal } from '@/layout/component/app.loading-modal';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, LoadingModal, ToastModule],
    template: `
    <p-toast />
    <router-outlet></router-outlet>
    <app-loading-modal></app-loading-modal>
    `
})
export class AppComponent {}
