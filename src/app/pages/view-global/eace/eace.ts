import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';

@Component({
    selector: 'app-eace',
    standalone: true,
    templateUrl: './eace.html',
    imports: [
        ButtonModule,
        PopoverModule,
    ],
})
export class Eace implements OnInit, OnDestroy {
    ngOnInit(): void {
        // Initialization logic here
    }

    ngOnDestroy(): void {
        // Cleanup logic here
    }

    exportCSV(): void {
        // Export to CSV logic here
    }
}