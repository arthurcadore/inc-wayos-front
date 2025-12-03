import { LoadingModal } from '@/layout/component/app.loading-modal';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, LoadingModal],
    providers: [MessageService],
    template: `
    <router-outlet></router-outlet>
    <app-loading-modal></app-loading-modal>
    `
})
export class AppComponent {}
