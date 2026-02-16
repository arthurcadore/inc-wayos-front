import { EaceService } from "@/pages/service/eace.service";
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core"
import { PanelModule } from 'primeng/panel';
import { DynamicDialogConfig } from "primeng/dynamicdialog";
import { SiteModelView } from "@/pages/view-global/view-model";

@Component({
    selector: 'app-wayos-last-offline-moment',
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
                <div class="mt-3 p-2 rounded-md border border-red-300 bg-red-50">
                    <div class="text-center mb-1">
                        <i class="pi pi-clock"></i>&nbsp;
                        {{ offlineMoments | date:'dd/MM/yyyy HH:mm:ss' }}
                    </div>
                </div>
            } @else if (hasOfflineMoments === 'no-data') {
                <div class="mt-4 p-4 rounded-md border border-blue-300 bg-blue-50">
                    <div class="bg-blue-100 p-4 rounded-md">
                        <div class="text-blue-500 text-2xl font-bold text-center mb-3">Nenhum dado de último momento offline encontrado.</div>
                        <div class="text-center">O roteador pode estar online ou não há registros de offline nos últimos 30 dias.</div>
                    </div>
                </div>
            }
            @if (isLoading) {
                <div class="flex justify-center items-center mt-4">
                    <i class="pi pi-spin pi-spinner text-gray-500"></i>&nbsp;&nbsp;
                    <span class="text-gray-500">Atualizando...</span>
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
export class WayosLastOfflineMoment implements OnInit {
    shopId: number = 0;
    inep: string = 'n/d';
    deviceStatus: boolean = false;
    deviceSerial: string = 'n/d';
    deviceModel: string = 'n/d';

    hasOfflineMoments: 'loading' | 'no-data' | 'has-data' = 'loading';
    offlineMoments: string;

    showError: boolean = false;
    errorMessage: string = '';

    isLoading: boolean = false;

    constructor(
        private readonly eaceService: EaceService,
        private readonly config: DynamicDialogConfig,
    ) {}

    ngOnInit(): void {
        this.shopId = this.config.data.shopId;
        this.inep = this.config.data.inep;
        this.deviceStatus = this.config.data.deviceStatus;
        this.deviceSerial = this.config.data.deviceSerial;
        this.deviceModel = this.config.data.deviceModel;
        this.getData();
    }

    getData(): void {
        this.isLoading = true;
        this.eaceService.getViewGlobalData(true).subscribe({
            next: (data) => {
                const device = data.data.find(item => item.inep === this.inep);
                if (device) {
                    const site = new SiteModelView(device, data.refreshedAt);
                    const routerInfo = site.router;
                    this.offlineMoments = routerInfo.lastOnlineTime;
                    this.hasOfflineMoments = this.offlineMoments ? 'has-data' : 'no-data';                    
                } else {
                    this.hasOfflineMoments = 'no-data';
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.showError = true;
                this.errorMessage = err.error.message ||  err.message || 'Erro desconhecido ao buscar dados do último momento offline.';
            },
            complete: () => {
                this.isLoading = false;
            },
        });
    }
}