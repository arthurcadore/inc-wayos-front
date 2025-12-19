import { LoadingModalService } from "@/layout/component/app.loading-modal";
import { RegionDevice } from "@/pages/service/dtos/alarm-log.dto";
import { EaceService } from "@/pages/service/eace.service";
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core"
import { PanelModule } from 'primeng/panel';
import { DynamicDialogConfig } from "primeng/dynamicdialog";

@Component({
    selector: 'app-inccloud-last-offline-moment',
    standalone: true,
    imports: [
        CommonModule,
        PanelModule,
    ],
    providers: [],
    template: `
        <p-panel header="Site: {{ inep }}" [toggleable]="true" class="mb-2">
            <div class="mb-2 text-lg">
                Status:
                @if(deviceStatus) {
                    <span class="text-green-600 font-bold">Online</span>
                } @else {
                    <span class="text-red-600 font-bold">Offline</span>
                }
            </div>
            <div class="mb-2 text-lg">Serial: {{ deviceSerial }}</div>
            <div class="mb-2 text-lg">Modelo: {{ deviceModel }}</div>
            <hr>
            @if(hasOfflineMoments === 'has-data') {
                    @for (item of offlineMoments; track item) {
                    <div class="mt-3 p-2 rounded-md border border-red-300 bg-red-50">
                        <div class="text-center mb-1">
                            <i class="pi pi-clock"></i>&nbsp;
                            {{ item.offlineTime | date:'dd/MM/yyyy HH:mm:ss' }}
                        </div>
                    </div>
                    }
            } @else if (hasOfflineMoments === 'no-data') {
                <div class="mt-4 p-4 rounded-md border border-blue-300 bg-blue-50">
                    <div class="bg-blue-100 p-4 rounded-md">
                        <div class="text-blue-500 text-2xl font-bold text-center mb-3">Nenhum dado de último momento offline encontrado.</div>
                        <div class="text-center">O {{ deviceModel }} pode estar online ou não há registros de offline.</div>
                    </div>
                </div>
            }
        </p-panel>
        @if(showError) {
            <div class="p-4 rounded-md border border-red-300 bg-red-50">
                <div class="bg-red-100 p-4 rounded-md">
                    <div class="text-red-500 text-2xl font-bold text-center mb-3">Falha ao buscar dados do último momento offline!</div>
                    <div class="text-center">Isso pode ter ocorrido por alguma instabilidade momentanea. Por favor tente novamente mais tarde ou entre em contato com o suporte.</div>
                </div>
                <hr class="bg-white">
                <pre style="white-space: pre-wrap; word-break: break-word; max-height: 120px; overflow-y: auto;">{{ errorMessage }}</pre>
            </div>
        }
    `,
})
export class IncCloudLastOfflineMoment implements OnInit {
    inep: string = 'n/d';
    deviceStatus: boolean = false;
    deviceSerial: string = 'n/d';
    deviceModel: string = 'n/d';

    hasOfflineMoments: 'loading' | 'no-data' | 'has-data' = 'loading';
    offlineMoments: RegionDevice[] = [];

    showError: boolean = false;
    errorMessage: string = '';

    constructor(
        private readonly eaceService: EaceService,
        private readonly loadingModalService: LoadingModalService,
        private readonly config: DynamicDialogConfig,
    ) {}

    ngOnInit(): void {
        this.inep = this.config.data.inep;
        this.deviceStatus = this.config.data.deviceStatus;
        this.deviceSerial = this.config.data.deviceSerial;
        this.deviceModel = this.config.data.deviceModel;
        this.getData();
    }

    getData(): void {
        this.loadingModalService.show();

        this.eaceService.getIncCloudLastOfflineMomentList(this.deviceSerial!).subscribe({
            next: (data: RegionDevice[]) => {
                this.offlineMoments = data;
                this.hasOfflineMoments = data.length > 0 ? 'has-data' : 'no-data';
            },
            error: (err) => {
                this.loadingModalService.hide();                
                this.showError = true;
                this.errorMessage = err.error.message ||  err.message || 'Erro desconhecido ao buscar dados do último momento offline.';
            },
            complete: () => {
                this.loadingModalService.hide();
            },
        });
    }
}