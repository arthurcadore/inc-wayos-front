import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        <a href="https://eace.org.br/" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Aprender Conectado - Dashboard</a>
        by
        <a href="https://www.intelbras.com/pt-br/" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Intelbras</a>
    </div>`
})
export class AppFooter {}
