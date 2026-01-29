import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { EaceService } from '../service/eace.service';
import { MessageService } from 'primeng/api';
import { SiteModelView } from '../view-global/view-model';
import { CommonModule } from '@angular/common';
import { DialogService } from 'primeng/dynamicdialog';
import { WayosLastOfflineMoment } from '@/components/last-offline-moment/wayos-last-offline-moment';
import { IncCloudDevice, WayosRouterInfo } from '../service/dtos/view-global.dtos';
import { IncCloudLastOfflineMoment } from '@/components/last-offline-moment/inccloud-last-offline-moment';

@Component({
    selector: 'app-school-details',
    standalone: true,
    imports: [
        CardModule,
        RouterLink,
        CommonModule,
        TooltipModule,
    ],
    providers: [DialogService],
    styles: `
    .margin-padding {
        padding: 8px 0px 8px 8px;
        margin: 3px 0px 3px 0px;
    }
    .border-left {
        border-left: 1px solid lightgray;
        border-top: 1px solid lightgray;
        border-bottom: 1px solid lightgray;
        border-radius: 6px 0px 0px 6px;
    }
    .border-center {
        border-top: 1px solid lightgray;
        border-bottom: 1px solid lightgray;
    }
    .border-right {
        border-right: 1px solid lightgray;
        border-top: 1px solid lightgray;
        border-bottom: 1px solid lightgray;
        border-radius: 0px 6px 6px 0px;
    }
    `,
    templateUrl: './school-details.html',
})
export class SchoolDetails implements OnInit, OnDestroy {
    inepInfo: any = {
        cityName: 'n/d',
        inep: 'n/d',
        devSn: 'n/d',
        online: false,
        lastMomentOnline: 'n/d',
        totalDevices: 0,
    };

    siteModelView: SiteModelView | null = null;
    isLoading: boolean = false;
    private viewGlobalSubscription: any = null;
    isLoadingLastMoment: boolean = false;
    private lastMomentSubscription: any = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly messageService: MessageService,
        private readonly dialogService: DialogService,
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.inepInfo.inep = params['inep'] || 'n/d';
            this.loadData();
        });
    }

    async loadData(): Promise<void> {
        this.isLoading = true;
        this.viewGlobalSubscription = this.eaceService.getViewGlobalData(true).subscribe({
            next: (data) => {
                const device = data.data.find(item => item.inep === this.inepInfo.inep);
                if (device) {
                    this.siteModelView = new SiteModelView(device, data.refreshedAt);

                    // Popule as informações da escola
                    this.inepInfo.cityName = this.siteModelView.city;
                    this.inepInfo.devSn = this.siteModelView.router.sn;
                    this.inepInfo.online = this.siteModelView.hasOfflineDevices() ? false : true;
                    this.inepInfo.lastMomentOnline = 'Atualizando...';
                    this.inepInfo.totalDevices = this.siteModelView.switches.length + this.siteModelView.aps.length + 1; // +1 para o roteador
                    this.loadLastMomentOnline();
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao buscar dados da visão global - ' ${(err?.message ? ` (${err.message})` : '')}`,
                });
            },
            complete: () => {
                this.isLoading = false;
            },
        });
    }

    async loadLastMomentOnline(): Promise<void> {
        this.isLoadingLastMoment = true;
        this.lastMomentSubscription = this.lastMomentSubscription = this.eaceService.getWayosLastOfflineMomentList(this.siteModelView?.router.sceneId!).subscribe({
            next: (data) => {
                this.inepInfo.lastMomentOnline = data.length > 0 ? data[0].happen_at : null;
            },
            error: (err) => {
                this.isLoadingLastMoment = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao buscar último momento online - ' ${(err?.message ? ` (${err.message})` : '')}`,
                });
            },
            complete: () => {
                this.isLoadingLastMoment = false;
            },
        });
    }

    async seeLastMomentOfflineWayos(site: SiteModelView): Promise<void> {
        this.dialogService.open(WayosLastOfflineMoment, {
            header: `Último Momento Offline - Roteador`,
            styleClass: 'w-full md:w-[45%] mx-auto',
            data: {
                shopId: (site.router as WayosRouterInfo).sceneId,
                inep: site.inep,
                deviceStatus: (site.router as WayosRouterInfo).online,
                deviceSerial: (site.router as WayosRouterInfo).sn,
                deviceModel: (site.router as WayosRouterInfo).model,
            },
            closable: true,
            dismissableMask: true,
            style: { 'background-color': '#f1f5f9' },
        });
    }

    async seeLastMomentOfflineIncCloud(device: IncCloudDevice): Promise<void> {
        this.dialogService.open(IncCloudLastOfflineMoment, {
            header: `Último Momento Offline - ${device.devType}`,
            styleClass: 'w-full md:w-[45%] mx-auto',
            data: {
                inep: this.inepInfo.inep,
                deviceStatus: (device as IncCloudDevice).online,
                deviceSerial: (device as IncCloudDevice).sn,
                deviceModel: (device as IncCloudDevice).aliasName,
            },
            closable: true,
            dismissableMask: true,
            style: { 'background-color': '#f1f5f9' },
        });
    }

    async ngOnDestroy(): Promise<void> {
        if (this.viewGlobalSubscription) {
            this.viewGlobalSubscription.unsubscribe();
        }

        if (this.lastMomentSubscription) {
            this.lastMomentSubscription.unsubscribe();
        }
    }
}
