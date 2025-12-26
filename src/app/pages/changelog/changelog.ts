import { Component } from '@angular/core';
import { CardModule } from "primeng/card";
import { MarkdownModule } from 'ngx-markdown';

@Component({
    standalone: true,
    selector: 'app-changelog-page',
    imports: [CardModule, MarkdownModule],
    template: `
    <div class="p-4">
        <h1 class="text-2xl font-bold mb-4">Changelog</h1>
        <p-card>
            <markdown 
                [src]="'assets/CHANGELOG.md'"
                class="prose prose-sm max-w-none">
            </markdown>
        </p-card>
    </div>`
})
export class ChangelogPage {}