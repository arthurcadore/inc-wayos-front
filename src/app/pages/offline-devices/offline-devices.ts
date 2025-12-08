import { CommonModule } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { Table, TableModule } from "primeng/table";
import { ActivatedRoute } from '@angular/router';
import { EaceService, ViewGlobalItem } from "../service/eace.service";
import { LoadingModalService } from "@/layout/component/app.loading-modal";
import { MessageService } from "primeng/api";
import { DeviceType, OfflineDevice, SiteModelView } from "../view-global/view-model";

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
    styles: [`
    .capsule {
        color: white;
        background-color: #d10000;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: smaller;
    }    
    `],
    template: `
        <div class="flex flex-row justify-between items-center mb-3">
            <div class="text-3xl font-extrabold">Dispositivos Offline</div>
            <p-button label="Exportar Excel" (onClick)="exportCSV()" />
        </div>
        <p-card>
            <p-table
                #dt2
                [value]="offlineDevices"
                dataKey="id"
                [paginator]="true"
                [globalFilterFields]="['inep']"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20]"
                [tableStyle]="{ 'min-width': '50rem' }"
            >
                <ng-template #caption>
                    <div class="flex">
                        <div class="font-bold">
                            <span class="text-gray-500">Total de </span>
                            <span class="text-red-500 font-extrabold"> {{ offlineDevices.length }} </span>
                            <span class="text-gray-500"> {{ deviceType }}(s)</span>
                        </div>
                        <p-iconfield iconPosition="left" class="ml-auto">
                            <p-inputicon>
                                <i class="pi pi-search"></i>
                            </p-inputicon>
                            <input pInputText type="text" (input)="dt2.filterGlobal(getTargetValue($event), 'contains')" placeholder="Pesquisar por INEP" />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th style="width:16.66%">
                            <div class="font-extrabold">Tipo</div>
                        </th>
                        <th pSortableColumn="name" style="width:16.66%">
                            <div class="font-extrabold">Nome <p-sortIcon field="name" /></div>
                        </th>
                        <th style="width:16.66%">
                            <div class="font-extrabold">Status</div>
                        </th>
                        <th pSortableColumn="inep" style="width:16.66%">
                            <div class="font-extrabold">INEP <p-sortIcon field="inep" /></div>
                        </th>
                        <th pSortableColumn="lastMomentOnline" style="width: 16.66%">
                            <div class="font-extrabold">Último momento online <p-sortIcon field="lastMomentOnline" /></div>
                        </th>
                        <th style="width:16.66%">
                            <div class="font-extrabold">Ações</div>
                        </th>
                    </tr>
                </ng-template>
                <ng-template #body let-site>
                    <tr>
                        <td>
                            <i class="pi pi-wifi" style="color:gray;"></i>&nbsp;
                            <span>{{ site.devType }}</span>
                        </td>
                        <td>
                            <span>{{ site.name }}</span>
                        </td>
                        <td>
                            <span class="capsule">Offiline</span>
                        </td>
                        <td>
                            <span>{{ site.inep }}</span>
                        </td>
                        <td>
                            <span>{{ site.lastMomentOnline }}</span>
                        </td>
                        <td>
                            <div class="text-green-500 cursor-pointer">Alarmes</div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6">
                            <div class="text-center text-red-400">
                                Não há dados disponíveis.
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </p-card>
    `,
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
        private readonly messageService: MessageService
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
        // Preparar dados para exportação com as colunas: Tipo, Nome, INEP, Último momento online
        const exportData = this.offlineDevices.map(device => ({
            'Tipo': device.devType,
            'Nome': device.name,
            'INEP': device.inep,
            'Último momento online': device.lastMomentOnline,
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
}
