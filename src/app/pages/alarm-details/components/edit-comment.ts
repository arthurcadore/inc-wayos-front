import { EaceService } from "@/pages/service/eace.service";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { TextareaModule } from "primeng/textarea";

@Component({
    selector: 'app-edit-comment',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        TextareaModule,
        ButtonModule,
    ],
    providers: [],
    template: `
        @if (isLoading) {
        <div class="text-gray-500 mb-4">
            Atualizando...
        </div>
        }
        <form (ngSubmit)="handlePost()" [formGroup]="form" class="flex flex-col gap-4">
            <textarea pTextarea formControlName="text" placeholder="Escreva aqui seu comentário" rows="5" class="w-full"></textarea>
            <div class="flex gap-2 justify-between">
                <p-button type="button" label="Cancelar" severity="secondary" (click)="handleCancel()"></p-button>
                <p-button type="submit" label="Enviar" severity="primary" [disabled]="form.invalid"></p-button>
            </div>
        </form>
    `,
})
export class EditComment implements OnInit {
    isLoading = false;
    form!: FormGroup;

    constructor(
        private readonly fb: FormBuilder,
        private readonly eaceService: EaceService,
        private readonly config: DynamicDialogConfig,
        private readonly messageService: MessageService,
        private readonly ref: DynamicDialogRef,
    ) { }

    async handlePost(): Promise<void> {
        this.isLoading = true;
        this.eaceService.updateComment(this.form.value as any).subscribe({
            next: () => {
                this.isLoading = false;
                // No action needed here, handled in complete
            },
            error: (err) => {
                this.isLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro ao editar comentário',
                    detail: err?.message || 'Ocorreu um erro ao tentar editar o comentário. Por favor, tente novamente mais tarde.',
                    life: 5000,
                });
            },
            complete: () => {
                this.isLoading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Comentário editado com sucesso!',
                    detail: 'A lista será atualizada automaticamente em alguns segundos.',
                    life: 3000,
                });
                this.ref.close('submitted');
            },
        });
    }

    handleCancel(): void {
        this.ref.close();
    }
    
    ngOnInit(): void {
        this.form = this.fb.group({
            text: this.fb.control<string>('', { validators: [Validators.required, Validators.minLength(1), Validators.maxLength(5000)] }),
            alarmId: this.fb.control<string>('', { validators: [Validators.required] }),
            alarmCommentId: this.fb.control<string>('', { validators: [Validators.required] }),
        });
        
        const { alarmId, alarmCommentId, text } = this.config.data;
        this.form.patchValue({ alarmId, alarmCommentId, text });
    }
}