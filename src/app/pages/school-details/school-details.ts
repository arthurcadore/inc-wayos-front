import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { EaceService } from '../service/eace.service';
import { LoadingModalService } from '@/layout/component/app.loading-modal';
import { MessageService } from 'primeng/api';
import { SiteModelView } from '../view-global/view-model';

@Component({
    selector: 'app-school-details',
    standalone: true,
    imports: [
        CardModule,
        RouterLink,
    ],
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
export class SchoolDetails implements OnInit {
    stateInfo: any = {
        name: 'n/d',
        online: false,
        lastMomentOnline: 'n/d',
        totalDevices: 0,
    };

    cityInfo: any = {
        name: 'n/d',
        online: false,
        lastMomentOnline: 'n/d',
        totalDevices: 0,
    };

    inepInfo: any = {
        inep: 'n/d',
        online: false,
        lastMomentOnline: 'n/d',
        totalDevices: 0,
    };

    siteModelView: SiteModelView | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly loadingModalService: LoadingModalService,
        private readonly messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.inepInfo.inep = params['inep'] || 'n/d';
            this.loadData();
        });
    }

    async loadData(): Promise<void> {
        this.loadingModalService.show();
        this.eaceService.getViewGlobalData().subscribe({
            next: (data) => {
                const devices = data.data.find(item => item.inep === this.inepInfo.inep);
                if (devices) {
                    this.siteModelView = new SiteModelView(devices, data.refreshedAt);

                    // Popule as informações da escola
                    this.inepInfo.online = this.siteModelView.hasOfflineDevices() ? false : true;
                    this.inepInfo.lastMomentOnline = '💀'; // this.siteModelView.getOfflineDuration();
                    this.inepInfo.totalDevices = this.siteModelView.switches.length + this.siteModelView.aps.length + 1; // +1 para o roteador
                }
            },
            error: (err) => {
                this.loadingModalService.show();
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao buscar dados da visão global - ' ${(err?.message ? ` (${err.message})` : '')}`,
                });
            },
            complete: () => {
                this.loadingModalService.hide();
            },
        });
    }
}
