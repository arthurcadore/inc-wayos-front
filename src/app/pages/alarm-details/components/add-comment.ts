import { EaceService } from "@/pages/service/eace.service";
import { Component, OnDestroy, OnInit } from "@angular/core"
import { DynamicDialogConfig } from "primeng/dynamicdialog";

@Component({
    selector: 'app-add-comment',
    standalone: true,
    imports: [],
    providers: [],
    template: `
        <div>
            <!-- Add your template code here -->
            <h2>Add Comment Component</h2>
            <p>Alarm ID: {{ alarmId }}</p>
        </div>
    `,
})
export class AddComment implements OnInit, OnDestroy {
    alarmId: string = '';

    constructor(
        private readonly eaceService: EaceService,
        private readonly config: DynamicDialogConfig,
    ) {}
    
    ngOnInit(): void {
        this.alarmId = this.config.data.alarmId;
    }

    ngOnDestroy(): void {
        // Cleanup if necessary
    }
}