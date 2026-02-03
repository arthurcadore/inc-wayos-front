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
import { Lifeline } from '@/components/lifeline/lifeline';

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
        Lifeline,
    ],
    providers: [DialogService],
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

    totalInstalledSites: number = 0;
    totalUninstalledSites: number = 0;

    sites: SiteModelView[] = [];
    filteredSites: SiteModelView[] = [];

    private viewGlobalSubscription: any = null;

    // Variáveis de controle do timer de atualização
    private refreshInterval: any = null;
    private timeRemaining: number = 0;
    private isLoading: boolean = false;
    private readonly refreshIntervalSeconds: number;

    // Opções do filtro de instalação
    installedOptions: any[] = [
        { label: 'Todos', value: 'all' },
        { label: 'Instalados', value: 'installed' },
        { label: 'Entrega Física', value: 'physical_delivery' },
    ]
    selectInstalled: string = 'all';

    // Opções do filtro de status
    statusOptions: any[] = [
        { label: 'Todos', value: 'all' },
        { label: 'Online', value: 'online' },
        { label: 'Offline', value: 'offline' },
    ];
    selectStatus: string = 'all';

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
     * @description Aplica os filtros selecionados de instalação e status aos sites exibidos
     */
    applyFilter(): void {
        if (this.selectInstalled === 'all') {
            // Todos os sites
            this.filteredSites = [...this.sites];
            this.recalculateTotals();
            this.applyStatusFilter();
        } else if (this.selectInstalled === 'installed') {
            // Apenas sites instalados
            this.filteredSites = this.sites.filter(site => site.isInstalled());
            this.recalculateTotals();
            this.applyStatusFilter();
        } else if (this.selectInstalled === 'physical_delivery') {
            // Apenas sites em entrega física
            this.filteredSites = this.sites.filter(site => site.isPhysicalDelivery());
            this.recalculateTotals();
            this.applyStatusFilter();
        }
    }
    
    applyStatusFilter(): void {
        if (this.selectStatus === 'all') {
            this.filteredSites = [...this.filteredSites];
        } else if (this.selectStatus === 'online') {
            // Sites online = sites SEM nenhum device offline
            this.filteredSites = this.filteredSites.filter(site => !site.hasOfflineDevices());
        } else if (this.selectStatus === 'offline') {
            // Sites offline = sites COM pelo menos um device offline
            this.filteredSites = this.filteredSites.filter(site => site.hasOfflineDevices());
        }
    }

    // Com base na lista filtrada, recalcule os totais exibidos nos cards superiores
    recalculateTotals(): void {
        this.onlineRouters = this.filteredSites.filter(site => site.router.online).length;
        this.offlineRouters = this.filteredSites.length - this.onlineRouters;
        this.onlineSwitches = this.filteredSites.reduce((acc, site) => acc + site.switches.filter(sw => sw.online).length, 0);
        this.offlineSwitches = this.filteredSites.reduce((acc, site) => acc + site.switches.filter(sw => !sw.online).length, 0);
        this.onlineAccessPoints = this.filteredSites.reduce((acc, site) => acc + site.aps.filter(ap => ap.online).length, 0);
        this.offlineAccessPoints = this.filteredSites.reduce((acc, site) => acc + site.aps.filter(ap => !ap.online).length, 0);
    }

    exportCSV() {
        const filteredSites = this.filteredSites
            .map(site => site.toFlatTableData(DeviceType.ALL, this.selectStatus as DeviceStatus))
            .flat();

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

                this.totalInstalledSites = data.totalInstalledSites;
                this.totalUninstalledSites = data.totalUninstalledSites;

                this.sites = data.data.map((item: ViewGlobalItem) => new SiteModelView(item, data.refreshedAt));
                this.applyFilter();
            },
            error: (err) => {
                this.isLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao buscar dados da visão global - ' ${(err?.message ? ` (${err.message})` : '')}`,
                    life: 5000,
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


