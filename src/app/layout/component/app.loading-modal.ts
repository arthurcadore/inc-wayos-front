import { Component, inject, Injectable } from "@angular/core";

@Component({
    selector: 'app-loading-modal',
    standalone: true,
    template: `
    @if (service.showing) {
        <div class="loading-modal">
            <div>Carregando...</div>        
        </div>
    }
    `
})
export class LoadingModal {
    service: LoadingModalService = inject(LoadingModalService);
}

@Injectable({
    providedIn: 'root',
})
export class LoadingModalService {
    showing: boolean = false;
    
    show() {
        this.showing = true;
    }

    hide() {
        this.showing = false;
    }
}