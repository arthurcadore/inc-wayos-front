import { Component, OnInit } from '@angular/core';
import { EaceService } from '../service/eace.service';
import { LoadingModalService } from '@/layout/component/app.loading-modal';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-schools',
    standalone: true,
    template: `
        <div class="card">
            <h1>Escolas</h1>
            <p>Conteúdo da página de escolas.</p>
        </div>
    `,
})
export class Schools implements OnInit {
    constructor(
        private readonly eaceService: EaceService,
        private readonly loadingModalService: LoadingModalService,
        private readonly messageService: MessageService,
    ) { }

    ngOnInit() {
        // Implementar lógica de inicialização, se necessário
    }
}