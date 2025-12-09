import { Component, OnInit } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { EaceService } from "../service/eace.service";
import { LoadingModalService } from "@/layout/component/app.loading-modal";
import { MessageService } from "primeng/api";
import { ActivatedRoute } from "@angular/router";
import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { InputTextModule } from "primeng/inputtext";
import { InputIconModule } from "primeng/inputicon";
import { IconFieldModule } from "primeng/iconfield";

@Component({
    selector: 'app-connected-devices',
    standalone: true,
    imports: [
        ButtonModule,
        CardModule,
        TableModule,
        InputTextModule,
        InputIconModule,
        IconFieldModule,
    ],
    template: `
    <div class="flex flex-row justify-between items-center mb-3">
        <div>
            <div class="text-3xl font-extrabold">Dispositivos Conectados</div>
            <div class="font-normal">Total de dispositivos: {{totalDevices}}</div>
        </div>
        <p-button label="Exportar Excel" (onClick)="exportCSV()" />
    </div>
    <p-card>
        <p-table
            #dt2
            [value]="devices"
            dataKey="id"
            [paginator]="true"
            [globalFilterFields]="['inep', 'city']"
            [rows]="5"
            [rowsPerPageOptions]="[5, 10, 20]"
            [tableStyle]="{ 'min-width': '50rem' }"
        >
            <ng-template #caption>
                <div class="flex">
                    <p-iconfield iconPosition="left" class="ml-auto">
                        <p-inputicon>
                            <i class="pi pi-search"></i>
                        </p-inputicon>
                        <input pInputText type="text" (input)="dt2.filterGlobal(getTargetValue($event), 'contains')" placeholder="Pesquisar por Site" />
                    </p-iconfield>
                </div>
            </ng-template>
            <ng-template #header>
                <tr>
                    <th pSortableColumn="inep" style="width:16.66%">
                        <div class="font-extrabold">Tipo <p-sortIcon field="inep" /></div>
                    </th>
                    <th style="width:16.66%">
                        <div class="font-extrabold">Sistema Operacional</div>
                    </th>
                    <th style="width:16.66%">
                        <div class="font-extrabold">Marca</div>
                    </th>
                    <th style="width:16.66%">
                        <div class="font-extrabold">Endereço MAC</div>
                    </th>
                    <th style="width: 16.66%">
                        <div class="font-extrabold">Endereço IP</div>
                    </th>
                </tr>
            </ng-template>
            <ng-template #body let-device>
                <tr>
                    <td>
                        @switch (device.type) {
                            @case('notebook') {
                                <!-- <i class="pi pi-table text-green-500"></i>&nbsp; -->
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="width: 14px;display: inline-block;">
                                    <path fill="#22c55e" d="m 31.635443,22.521604 v 1.771075 c 0,1.103822 -0.888637,1.992459 -1.992458,1.992459 H 2.3241545 c -1.1038224,0 -1.99245914,-0.888637 -1.99245914,-1.992459 V 22.521604 Z M 3.5865206,4.7908101 A 0.9832075,0.9832075 0 0 0 2.6034113,5.7739194 V 21.257889 H 4.5696298 V 6.7570285 H 27.334751 V 21.257889 H 29.30097 V 5.7739194 A 0.9832075,0.9832075 0 0 0 28.31786,4.7908101 Z"/>
                                </svg>&nbsp;
                            }
                            @case('desktop') {
                                <i class="pi pi-desktop text-green-500"></i>&nbsp;
                            }
                            @case('tablet') {
                                <i class="pi pi-tablet text-green-500"></i>&nbsp;
                            }
                            @case('smartphone') {
                                <i class="pi pi-mobile text-green-500"></i>&nbsp;
                            }
                            @case('smart-tv') {
                                <i class="pi pi-desktop text-green-500"></i>&nbsp;
                            }
                            @default {
                                <i class="pi pi-question-circle text-green-500"></i>&nbsp;
                            }
                        }
                        <span>{{ device.type }}</span>
                    </td>
                    <td>{{ device.operatingSystem }}</td>
                    <td>{{ device.brand }}</td>
                    <td>{{ device.macAddress }}</td>
                    <td>{{ device.ipAddress }}</td>
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
    `
})
export class ConnectedDevices implements OnInit {
    inep: string = '';
    totalDevices: number = 0;
    devices: {
        type: 'notebook' | 'desktop' | 'tablet' | 'smartphone' | 'smart-tv' | 'other';
        operatingSystem: string;
        brand: string;
        macAddress: string;
        ipAddress: string;
    }[] = [];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly loadingModalService: LoadingModalService,
        private readonly messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.loadingModalService.show();
        setTimeout(() => {
            // Simulated data fetch
            this.devices = [
                {
                    type: 'notebook',
                    operatingSystem: 'Windows 10',
                    brand: 'Dell',
                    macAddress: '00:1A:2B:3C:4D:5E',
                    ipAddress: '192.168.1.100'
                },
                {
                    type: 'smartphone',
                    operatingSystem: 'Android 11',
                    brand: 'Samsung',
                    macAddress: '11:22:33:44:55:66',
                    ipAddress: '192.168.1.101'
                },
                {
                    type: 'tablet',
                    operatingSystem: 'iOS 14',
                    brand: 'Apple',
                    macAddress: 'AA:BB:CC:DD:EE:FF',
                    ipAddress: '192.168.1.102'
                },
                {
                    type: 'desktop',
                    operatingSystem: 'Ubuntu 20.04',
                    brand: 'HP',
                    macAddress: '77:88:99:AA:BB:CC',
                    ipAddress: '192.168.1.103'
                },
                {
                    type: 'smart-tv',
                    operatingSystem: 'Tizen',
                    brand: 'LG',
                    macAddress: 'DD:EE:FF:00:11:22',
                    ipAddress: '192.168.1.104'
                },
            ];
            this.totalDevices = this.devices.length;
            this.loadingModalService.hide();            
        }, 1500);

        // this.loadingModalService.show();
        // this.eaceService.getViewGlobalData().subscribe({
        //     next: (data) => {
        //         // Extrair o parâmetro 'inep' da URL
        //     },
        //     error: (err) => {
        //         this.messageService.add({
        //             severity: 'error',
        //             summary: 'Erro',
        //             detail: `Falha ao buscar dados da visão global - ' ${(err?.message ? ` (${err.message})` : '')}`,
        //         });
        //     },
        //     complete: () => {
        //         this.loadingModalService.hide();
        //     },
        // });
    }

    // Função auxiliar para obter o valor do evento de input
    // Precisei fazer isso porque o template do Angular não reconhece 'event.target.value' diretamente e estava dando erro
    getTargetValue(event: any): any {
        return event.target.value;
    }

    loadData(): void {
        // 
    }

    exportCSV(): void {
        // Export CSV logic here
    }
}