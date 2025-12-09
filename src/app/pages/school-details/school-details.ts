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
    template: `
        <div class="flex flex-row justify-between items-center mb-3">
            <div>
                <div class="text-3xl font-extrabold mb-2">Detalhes por Escola</div>
                <div class="font-normal">Visão detalhada da infraestrutura e conectividade</div>
            </div>
        </div>
        <p-card>
            <div class="text-xl font-extrabold mb-2">Hierarquia da Escola</div>
            <hr>
            <div class="grid grid-cols-5">
                <!-- Localidade -->

                <div class="margin-padding font-bold">
                    <i class="pi pi-sitemap text-green-600"></i>&nbsp;
                    <span>{{stateInfo.name}}</span>
                </div>
                <div class="margin-padding">
                    @if(stateInfo.online) {
                        <span>Online</span>
                    } @else {
                        <span class="text-red-600">Offline</span>
                    }
                </div>
                <div class="margin-padding">Última atualização: {{stateInfo.lastMomentOnline}}</div>
                <div class="margin-padding">Dispositivos: {{stateInfo.totalDevices}}</div>
                <div class="margin-padding"></div>

                <div class="margin-padding font-bold" style="margin-left: 1rem;">
                    <i class="pi pi-map text-green-600"></i>&nbsp;
                    <span>{{cityInfo.name}}</span>
                </div>
                <div class="margin-padding">
                    @if(cityInfo.online) {
                        <span>Online</span>
                    } @else {
                        <span class="text-red-600">Offline</span>
                    }
                </div>
                <div class="margin-padding">Última atualização: {{cityInfo.lastMomentOnline}}</div>
                <div class="margin-padding">Dispositivos: {{cityInfo.totalDevices}}</div>
                <div class="margin-padding"></div>

                <div class="margin-padding font-bold" style="margin-left: 2rem;">
                    <i class="pi pi-graduation-cap text-green-600"></i>&nbsp;
                    <span>{{inepInfo.inep}}</span>
                </div>
                <div class="margin-padding">
                    @if(inepInfo.online) {
                        <span>Online</span>
                    } @else {
                        <span class="text-red-600">Offline</span>
                    }
                </div>
                <div class="margin-padding">Última atualização: {{inepInfo.lastMomentOnline}}</div>
                <div class="margin-padding">Dispositivos: {{inepInfo.totalDevices}}</div>
                <div class="margin-padding text-green-500 cursor-pointer">
                    <a [routerLink]="['/connected-devices']" [queryParams]="{ inep: inepInfo.inep }">Dispositivos Online</a>
                </div>

                <!-- Dispositivos da Escola -->
                <!-- Roteadores -->
                @if (siteModelView?.router) {
                    <div class="border-left margin-padding" style="margin-left: 3rem;">{{siteModelView?.router?.model || 'n/d'}}</div>
                    <div class="border-center margin-padding">
                        @if(siteModelView?.router?.online) {
                            <span>Online</span>
                        } @else {
                            <span class="text-red-600">Offline</span>
                        }
                    </div>
                    <div class="border-center margin-padding">IP: {{siteModelView?.router?.lanIp}}</div>
                    <div class="border-center margin-padding text-green-500 cursor-pointer">Template do Firewall</div>
                    <div class="border-right margin-padding text-green-500 cursor-pointer">Alarmes</div>
                }
                
                <!-- Switches -->
                @for (item of siteModelView?.switches; track item) {
                    <div class="border-left margin-padding" style="margin-left: 3rem;">{{item.aliasName || 'n/d'}}</div>
                    <div class="border-center margin-padding">
                        @if(item.online) {
                            <span>Online</span>
                        } @else {
                            <span class="text-red-600">Offline</span>
                        }
                    </div>
                    <div class="border-center margin-padding">IP: (campo n/d)</div>
                    <div class="border-center margin-padding"></div>
                    <div class="border-right margin-padding text-green-500 cursor-pointer">Alarmes</div>
                }

                <!-- Access Points -->
                @for (item of siteModelView?.aps; track item) {
                    <div class="border-left margin-padding" style="margin-left: 3rem;">{{item.aliasName || 'n/d'}}</div>
                    <div class="border-center margin-padding">
                        @if(item.online) {
                            <span>Online</span>
                        } @else {
                            <span class="text-red-600">Offline</span>
                        }
                    </div>
                    <div class="border-center margin-padding">IP: (campo n/d)</div>
                    <div class="border-center margin-padding"></div>
                    <div class="border-right margin-padding text-green-500 cursor-pointer">Alarmes</div>
                }
            </div>
        </p-card>
    `,
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
                    this.inepInfo.lastMomentOnline = this.siteModelView.getOfflineDuration();
                    this.inepInfo.totalDevices = this.siteModelView.switches.length + this.siteModelView.aps.length + 1; // +1 para o roteador
                }
            },
            error: (err) => {
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
