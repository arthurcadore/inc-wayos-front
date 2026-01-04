import { EaceService } from "@/pages/service/eace.service";
import { Component, OnInit } from "@angular/core"
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-add-comment',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        TextareaModule,
        ButtonModule,
    ],
    providers: [],
    template: `
        <form (ngSubmit)="handlePost()" [formGroup]="form" class="flex flex-col gap-4">
            <textarea pTextarea formControlName="text" placeholder="Escreva aqui seu comentário" rows="5" class="w-full"></textarea>
            <div class="flex gap-2 justify-between">
                <p-button type="button" label="Cancelar" severity="secondary" (click)="handleCancel()"></p-button>
                <p-button type="submit" label="Enviar" severity="primary" [disabled]="form.invalid"></p-button>
            </div>
        </form>
    `,
})
export class AddComment implements OnInit {
    alarmId: string = '';
    form = new FormGroup({
        text: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(5000)]),
    });

    constructor(
        private readonly eaceService: EaceService,
        private readonly config: DynamicDialogConfig,
        private readonly messageService: MessageService,
        private readonly ref: DynamicDialogRef,
    ) {}

    handlePost(): void {
        const { text } = this.form.value;
        // Implemente a lógica para enviar o comentário usando o eaceService
        this.messageService.add({
            severity: 'success',
            summary: 'Comentário adicionado com sucesso!',
            detail: 'A lista será atualizada automaticamente em alguns segundos.',
            life: 3000,
        });
        this.ref.close('submitted');
    }

    handleCancel(): void {
        this.ref.close();
    }
    
    ngOnInit(): void {
        this.alarmId = this.config.data.alarmId;
    }
}