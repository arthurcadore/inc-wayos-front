import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { EaceService } from '../service/eace.service';
import { LoadingModalService } from '@/layout/component/app.loading-modal';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { RouterLink } from "@angular/router";
import { SiteModelView } from './view-model';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { ViewGlobalItem } from '../service/dtos/view-global.dtos';
import { DialogService } from 'primeng/dynamicdialog';
import { WayosLastOfflineMoment } from '@/components/last-offline-moment/wayos-last-offline-moment';
import { ExportFileService } from '@/services/export-file';

@Component({
    selector: 'app-view-global',
    standalone: true,
    imports: [
        CardModule,
        ButtonModule,
        TableModule,
        DividerModule,
        InputTextModule,
        InputIconModule,
        IconFieldModule,
        RouterLink,
        SelectButtonModule,
        FormsModule,
    ],
    providers: [MessageService, DialogService],
    templateUrl: './view-global.html',
})
export class ViewGlobal implements OnInit, OnDestroy {
    @ViewChild('dt2') dt2!: Table;

    refreshedAtFormat: string = 'n/d';
    refreshedAt: Date = new Date();

    onlineRouters: number = 0;
    offlineRouters: number = 0;

    onlineSwitches: number = 0;
    offlineSwitches: number = 0;

    onlineAccessPoints: number = 0;
    offlineAccessPoints: number = 0;

    sites: SiteModelView[] = [];
    filteredSites: SiteModelView[] = [];

    // Variáveis de controle do timer de atualização
    private refreshInterval: any = null;
    private timeRemaining: number = 0;
    private isPageVisible: boolean = true;
    private isLoading: boolean = false;
    private readonly refreshIntervalSeconds: number;
    private visibilityChangeListener: any;

    // Opções do filtro de status
    stateOptions: any[] = [
        { label: 'Todos', value: 'all' },
        { label: 'Online', value: 'online' },
        { label: 'Offline', value: 'offline' },
    ];
    value: string = 'all';

    constructor(
        private readonly eaceService: EaceService,
        private readonly loadingModalService: LoadingModalService,
        private readonly messageService: MessageService,
        private readonly dialogService: DialogService,
        private readonly exportFileService: ExportFileService,
    ) {
        // Converter minutos para segundos
        this.refreshIntervalSeconds = environment.refreshIntervalMinutes * 60;
        this.timeRemaining = this.refreshIntervalSeconds;
    }

    // Função auxiliar para obter o valor do evento de input
    // Precisei fazer isso porque o template do Angular não reconhece 'event.target.value' diretamente e estava dando erro
    getTargetValue(event: any): any {
        return event.target.value;
    }

    /**
     * Aplica o filtro de status aos sites
     * - 'all': Mostra todos os sites
     * - 'online': Mostra apenas sites com todos os devices online
     * - 'offline': Mostra sites com pelo menos um device offline
     */
    applyFilter(): void {
        if (this.value === 'all') {
            this.filteredSites = [...this.sites];
        } else if (this.value === 'online') {
            // Sites online = sites SEM nenhum device offline
            this.filteredSites = this.sites.filter(site => !site.hasOfflineDevices());
        } else if (this.value === 'offline') {
            // Sites offline = sites COM pelo menos um device offline
            this.filteredSites = this.sites.filter(site => site.hasOfflineDevices());
        }
    }

    exportCSV() {
        // Preparar dados para exportação sem a coluna "Ações"
        const exportData = this.filteredSites.map(site => ({
            'Site': site.inep,
            'Roteadores': site.routerIsOnline ? '1/1' : '0/1',
            'Switches': `${site.onlineSwitches}/${site.totalSwitches}`,
            'Access Points': `${site.onlineAccessPoints}/${site.totalAccessPoints}`,
        }));

        this.exportFileService.toCSV(exportData, environment.viewGlobalExportFileName);
    }

    ngOnInit(): void {
        // Carregar dados inicialmente
        this.getViewGlobal();

        // Configurar listener de visibilidade da página
        this.visibilityChangeListener = () => {
            const wasVisible = this.isPageVisible;
            this.isPageVisible = !document.hidden;

            // Se a página voltou a ser visível, atualizar dados imediatamente
            if (!wasVisible && this.isPageVisible && !this.isLoading) {
                this.getViewGlobal();
                this.timeRemaining = this.refreshIntervalSeconds;
            }
        };

        document.addEventListener('visibilitychange', this.visibilityChangeListener);

        // Iniciar timer de atualização
        this.startRefreshTimer();
    }

    getViewGlobal(): void {
        // Pausar o contador durante o carregamento
        this.isLoading = true;
        this.loadingModalService.show();
        this.eaceService.getViewGlobalData().subscribe({
            next: (data) => {
                this.refreshedAtFormat = data.refreshedAtFormat;
                this.refreshedAt = new Date(data.refreshedAt);

                this.onlineRouters = data.onlineRouters;
                this.offlineRouters = data.totalRouters - data.onlineRouters;

                this.onlineSwitches = data.onlineSwitches;
                this.offlineSwitches = data.totalSwitches - data.onlineSwitches;

                this.onlineAccessPoints = data.onlineAps;
                this.offlineAccessPoints = data.totalAps - data.onlineAps;

                this.sites = data.data.map((item: ViewGlobalItem) => new SiteModelView(item, data.refreshedAt));
                this.applyFilter();
            },
            error: (err) => {
                this.loadingModalService.hide();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao buscar dados da visão global - ' ${(err?.message ? ` (${err.message})` : '')}`,
                });
            },
            complete: () => {
                this.loadingModalService.hide();
                // Reiniciar contador após finalização do carregamento
                this.isLoading = false;
                this.timeRemaining = this.refreshIntervalSeconds;
            },
        });
    }

    /**
     * Inicia o timer de atualização automática
     */
    private startRefreshTimer(): void {
        // Limpar qualquer intervalo anterior
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Criar novo intervalo que executa a cada segundo
        this.refreshInterval = setInterval(() => {
            // Só decrementar se a página estiver visível E não estiver carregando
            if (this.isPageVisible && !this.isLoading) {
                this.timeRemaining--;

                // Quando chegar a zero, atualizar dados
                if (this.timeRemaining <= 0) {
                    this.getViewGlobal();
                }
            }
        }, 1000);
    }

    /**
     * Formata o tempo restante para exibição
     * Retorna formato "Xm Ys" ou apenas "Ys" se menor que 1 minuto
     */
    getTimeRemainingText(): string {
        if (this.timeRemaining <= 0) {
            return 'Atualizando...';
        }

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;

        if (minutes > 0) {
            return `Restam ${minutes}m ${seconds}s para atualizar`;
        } else {
            return `Restam ${seconds}s para atualizar`;
        }
    }

    seeLastMomentOffline(site: SiteModelView): void {
        this.dialogService.open(WayosLastOfflineMoment, {
            header: `Último Momento Offline - Roteador`,
            width: '45vw',
            data: {
                shopId: site.router.sceneId,
                inep: site.inep,
                deviceStatus: site.router.online,
                deviceSerial: site.router.sn,
                deviceModel: site.router.model,
            },
            closable: true,
            dismissableMask: true,
            style: { 'background-color': '#f1f5f9' },
        });
    }

    ngOnDestroy(): void {
        // Limpar intervalo de atualização
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        // Remover listener de visibilidade
        if (this.visibilityChangeListener) {
            document.removeEventListener('visibilitychange', this.visibilityChangeListener);
        }
    }
}


