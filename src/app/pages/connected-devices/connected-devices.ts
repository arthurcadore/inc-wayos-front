import { Component, OnDestroy, OnInit } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { EaceService } from "../service/eace.service";
import { MessageService } from "primeng/api";
import { ActivatedRoute } from "@angular/router";
import { CardModule } from "primeng/card";
import { TableModule } from "primeng/table";
import { InputTextModule } from "primeng/inputtext";
import { InputIconModule } from "primeng/inputicon";
import { IconFieldModule } from "primeng/iconfield";
import { environment } from "src/environments/environment";
import { ExportFileService } from "@/services/export-file";

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
    templateUrl: './connected-devices.html',
})
export class ConnectedDevices implements OnInit, OnDestroy {
    devSn: string = '';
    totalDevices: number = 0;
    devices: {
        type: string;
        hostname: string;
        macAddress: string;
        ipAddress: string;
    }[] = [];

    private cinnedtedDevicesSubscription: any = null;
    isLoading: boolean = false;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly messageService: MessageService,
        private readonly exportFileService: ExportFileService,
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.devSn = params['devSn'] || '';
            this.loadData();
        });
    }

    // Função auxiliar para obter o valor do evento de input
    // Precisei fazer isso porque o template do Angular não reconhece 'event.target.value' diretamente e estava dando erro
    getTargetValue(event: any): any {
        return event.target.value;
    }

    loadData(): void {
        this.isLoading = true;
        this.cinnedtedDevicesSubscription = this.eaceService.getConnectedDevices(this.devSn).subscribe({
            next: (data) => {
                this.devices = data.map(device => ({
                    type: device.ua || '(n/d)',
                    hostname: device.name || '(n/d)',
                    macAddress: device.mac,
                    ipAddress: device.ip,
                }));
                this.totalDevices = this.devices.length;
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

    exportCSV(): void {
        // Preparar dados para exportação com as colunas: Tipo, Sistema Operacional, Marca, Endereço MAC, Endereço IP
        const exportData = this.devices.map(device => ({
            'Tipo': device.type,
            'Hostname': device.hostname,
            'Endereço MAC': device.macAddress,
            'Endereço IP': device.ipAddress,
        }));

        this.exportFileService.toCSV(exportData, environment.connectedDevicesExportFileName);
    }

    ngOnDestroy(): void {
        if (this.cinnedtedDevicesSubscription) {
            this.cinnedtedDevicesSubscription.unsubscribe();
        }
    }

    toBack(): void {
        globalThis.history.back();
    }
}
