import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { RouterLink } from "@angular/router";

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `
    <div class="layout-footer">
        <div>
            <a href="https://eace.org.br/" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Aprender Conectado - Dashboard</a>
            by
            <a href="https://www.intelbras.com/pt-br/" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Intelbras</a>
            <div class="text-gray-500 text-center text-sm">versão: <a [routerLink]="['/changelog']">{{ version }}</a></div>
        </div>
    </div>`,
    imports: [RouterLink]
})
export class AppFooter {
    version: string = environment.version;
}
