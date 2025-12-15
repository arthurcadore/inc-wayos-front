import { CommonModule } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { Table, TableModule } from "primeng/table";
import { ActivatedRoute } from '@angular/router';
import { EaceService } from "../service/eace.service";
import { LoadingModalService } from "@/layout/component/app.loading-modal";
import { MessageService } from "primeng/api";
import { DeviceType, OfflineDevice, SiteModelView } from "../view-global/view-model";
import { IncCloudDevice, ViewGlobalItem, WayosRouterInfo } from "../service/dtos/view-global.dtos";
import { IncCloudLastOfflineMoment } from "@/components/last-offline-moment/inccloud-last-offline-moment";
import { DialogService } from "primeng/dynamicdialog";
import { WayosLastOfflineMoment } from "@/components/last-offline-moment/wayos-last-offline-moment";

@Component({
    selector: 'app-offline-devices',
    standalone: true,
    imports: [
        CardModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        InputIconModule,
        CommonModule,
        IconFieldModule,
    ],
    providers: [MessageService, DialogService],
    styles: [`
    .capsule {
        color: white;
        background-color: #d10000;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: smaller;
    }    
    `],
    templateUrl: './offline-devices.html',
})
export class OfflineDevices implements OnInit {
    @ViewChild('dt2') dt2!: Table;

    deviceType: DeviceType = DeviceType.ROUTER;
    sites: SiteModelView[] = [];
    offlineDevices: OfflineDevice[] = [];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly loadingModalService: LoadingModalService,
        private readonly messageService: MessageService,
        private readonly dialogService: DialogService,
    ) { }

    deviceTypeMapping = {
        'router': DeviceType.ROUTER,
        'switch': DeviceType.SWITCH,
        'accessPoint': DeviceType.ACCESS_POINT,
    };

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.deviceType = this.deviceTypeMapping[params['device'] as keyof typeof this.deviceTypeMapping] || DeviceType.ROUTER;
            this.loadData();
        });
    }

    async loadData(): Promise<void> {
        this.loadingModalService.show();
        this.eaceService.getViewGlobalData().subscribe({
            next: (data) => {
                this.sites = data.data.map((item: ViewGlobalItem) => new SiteModelView(item, data.refreshedAt));
                const offlineDevices: OfflineDevice[] = [];

                for (const site of this.sites) {
                    const siteOfflineDevices = site.getOfflineDevicesByType(this.deviceType);
                    if (siteOfflineDevices.length > 0) {
                        offlineDevices.push(...siteOfflineDevices);
                    }
                }

                this.offlineDevices = offlineDevices;
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
            },
        });
    }

    // Função auxiliar para obter o valor do evento de input
    // Precisei fazer isso porque o template do Angular não reconhece 'event.target.value' diretamente e estava dando erro
    getTargetValue(event: any): any {
        return event.target.value;
    }

    exportCSV() {
        // Preparar dados para exportação com as colunas: Tipo, Nome, INEP
        const exportData = this.offlineDevices.map(device => ({
            'Tipo': device.devType,
            'Nome': device.name,
            'INEP': device.inep,
        }));

        // Criar CSV manualmente
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
            headers.join(','),
            ...exportData.map(row => headers.map(header => {
                const value = row[header as keyof typeof row];
                // Escapar valores que contêm vírgula ou aspas
                return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                    ? `"${value.replace(/"/g, '""')}`
                    : value;
            }).join(','))
        ].join('\n');

        // Criar blob e fazer download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        // Formatar nome do arquivo: offline-device_dd-MM-yyyy_HH-mm
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const formattedDate = `${day}-${month}-${year}_${hours}-${minutes}`;

        link.setAttribute('download', `offline-device_${formattedDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    seeLastMomentOffline(device: OfflineDevice): void {
        if (device.devType === DeviceType.ROUTER) {
            this.dialogService.open(WayosLastOfflineMoment, {
                header: `Último Momento Offline - Roteador`,
                width: '45vw',
                data: {
                    shopId: (device.data as WayosRouterInfo).sceneId,
                    inep: device.inep,
                    deviceStatus: (device.data as WayosRouterInfo).online,
                    deviceSerial: (device.data as WayosRouterInfo).sn,
                    deviceModel: (device.data as WayosRouterInfo).model,
                },
                closable: true,
                dismissableMask: true,
                style: { 'background-color': '#f1f5f9' },
            });
        } else {
            this.dialogService.open(IncCloudLastOfflineMoment, {
                header: `Último Momento Offline - ${device.devType}`,
                width: '45vw',
                data: {
                    inep: device.inep,
                    deviceStatus: (device.data as IncCloudDevice).online,
                    deviceSerial: (device.data as IncCloudDevice).sn,
                    deviceModel: (device.data as IncCloudDevice).aliasName,
                },
                closable: true,
                dismissableMask: true,
                style: { 'background-color': '#f1f5f9' },
            });
        }
    }
}
