import { LoadingModalService } from "@/layout/component/app.loading-modal";
import { WayosAlarmLogItem } from "@/pages/service/dtos/alarm-log.dto";
import { EaceService } from "@/pages/service/eace.service";
import { SiteModelView } from "@/pages/view-global/view-model";
import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core"
import { PanelModule } from 'primeng/panel';
import { DynamicDialogConfig } from "primeng/dynamicdialog";

@Component({
    selector: 'app-last-moment-offline',
    standalone: true,
    imports: [
        CommonModule,
        PanelModule,
    ],
    providers: [],
    template: `
        <div>
            <div class="mb-2 text-lg">Site: {{ site?.inep }}</div>
            <p-panel header="Dados do Roteador" [toggleable]="true">
                <div class="mb-2 text-lg">SceneId: {{ site?.router?.sceneId }}</div>
                <div class="mb-2 text-lg">
                    Status:
                    @if(site?.router?.online) {
                        <span class="text-green-600 font-bold">Online</span>
                    } @else {
                        <span class="text-red-600 font-bold">Offline</span>
                    }
                </div>
                <div class="mb-2 text-lg">Serial: {{ site?.router?.sn }}</div>
                <div class="mb-2 text-lg">Modelo: {{ site?.router?.model || 'N/A' }}</div>
                <hr>
                @if(hasRouterOfflineMoments === 'has-data') {
                     @for (item of routerOfflineMoments; track item) {
                        <div class="mt-3 p-2 rounded-md border border-red-300 bg-red-50">
                            <div class="text-center mb-1">
                                <i class="pi pi-clock"></i>&nbsp;
                                {{ item.happen_at | date:'dd/MM/yyyy HH:mm:ss' }}
                            </div>
                        </div>
                     }
                } @else if (hasRouterOfflineMoments === 'no-data') {
                    <div class="mt-4 p-4 rounded-md border border-blue-300 bg-blue-50">
                        <div class="bg-blue-100 p-4 rounded-md">
                            <div class="text-blue-500 text-2xl font-bold text-center mb-3">Nenhum dado de último momento offline encontrado.</div>
                            <div class="text-center">O roteador pode estar online ou não há registros de offline recentes.</div>
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
        </div>
    `,
})
export class LastMomentOffline implements OnInit {
    site: SiteModelView | undefined;

    hasRouterOfflineMoments: 'loading' | 'no-data' | 'has-data' = 'loading';
    routerOfflineMoments: WayosAlarmLogItem[] = [];

    showError: boolean = false;
    errorMessage: string = '';

    constructor(
        private readonly eaceService: EaceService,
        private readonly loadingModalService: LoadingModalService,
        private readonly config: DynamicDialogConfig,
    ) {}

    ngOnInit(): void {
        this.site = this.config.data.site;
        this.getData();
    }

    getData(): void {
        this.loadingModalService.show();

        this.eaceService.getLastMomentOffline(this.site?.router.sceneId!).subscribe({
            next: (data: WayosAlarmLogItem[]) => {
                this.routerOfflineMoments = data;
                this.hasRouterOfflineMoments = data.length > 0 ? 'has-data' : 'no-data';
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