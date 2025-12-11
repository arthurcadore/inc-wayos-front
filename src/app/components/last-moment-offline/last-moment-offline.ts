import { SiteModelView } from "@/pages/view-global/view-model";
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core"
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";

@Component({
    selector: 'app-last-moment-offline',
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
        <p>Last Moment Offline Component Works!</p>
        <div>
            <pre>{{ site | json }}</pre>
        </div>
    `,
})
export class LastMomentOffline implements OnInit {
    site: SiteModelView | undefined;

    constructor(
        private readonly config: DynamicDialogConfig,
        private readonly ref: DynamicDialogRef,
    ) {}

    ngOnInit(): void {
        this.site = this.config.data.site;
    }
}