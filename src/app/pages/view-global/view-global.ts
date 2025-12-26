import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { EaceService } from '../service/eace.service';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
import { RouterLink } from "@angular/router";
import { DeviceStatus, DeviceType, SiteModelView } from './view-model';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { ViewGlobalItem } from '../service/dtos/view-global.dtos';
import { DialogService } from 'primeng/dynamicdialog';
import { WayosLastOfflineMoment } from '@/components/last-offline-moment/wayos-last-offline-moment';
import { ExportFileService } from '@/services/export-file';
import { PopoverModule } from 'primeng/popover';

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
        PopoverModule,
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

    private viewGlobalSubscription: any = null;

    // Variáveis de controle do timer de atualização
    private refreshInterval: any = null;
    private timeRemaining: number = 0;
    private isLoading: boolean = false;
    private readonly refreshIntervalSeconds: number;

    // Opções do filtro de status
    stateOptions: any[] = [
        { label: 'Todos', value: 'all' },
        { label: 'Online', value: 'online' },
        { label: 'Offline', value: 'offline' },
    ];
    value: string = 'all';

    constructor(
        private readonly eaceService: EaceService,
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
        const filteredSites = this.sites.map(site => site.toFlatTableData(DeviceType.ALL, this.value as DeviceStatus)).flat();
        this.exportFileService.toCSV(filteredSites, environment.viewGlobalExportFileName);
    }

    ngOnInit(): void {
        // Carregar dados inicialmente
        this.getViewGlobal();

        // Iniciar timer de atualização
        this.startRefreshTimer();
    }

    getViewGlobal(): void {
        this.isLoading = true;
        this.refreshedAtFormat = 'Atualizando...';
        this.viewGlobalSubscription = this.eaceService.getViewGlobalData().subscribe({
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
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao buscar dados da visão global - ' ${(err?.message ? ` (${err.message})` : '')}`,
                });
            },
            complete: () => {
                this.isLoading = false;
                this.timeRemaining = this.refreshIntervalSeconds;
            },
        });
    }

    private startRefreshTimer(): void {
        // Limpar qualquer intervalo anterior
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Criar novo intervalo que executa a cada segundo
        this.refreshInterval = setInterval(() => {
            // Só decrementar se não estiver carregando
            if (!this.isLoading) {
                this.timeRemaining--;

                // Quando chegar a zero, atualizar dados
                if (this.timeRemaining <= 0) {
                    this.getViewGlobal();
                }
            } else {
                this.refreshedAtFormat = 'Atualizando...';
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
            styleClass: 'w-full md:w-[45%] mx-auto',
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
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        if (this.viewGlobalSubscription) {
            this.viewGlobalSubscription.unsubscribe();
        }
    }
}


