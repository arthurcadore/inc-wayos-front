import { Component, OnDestroy, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { EaceService } from '../service/eace.service';
import { MenuItem, MessageService } from 'primeng/api';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { AlarmViewModel } from '../service/dtos/alarm-log.dto';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { DialogService } from 'primeng/dynamicdialog';
import { AddComment } from './components/add-comment';

@Component({
    selector: 'app-alarm-details',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        PanelModule,
        CardModule,
        TagModule,
        ButtonModule,
        MenuModule,
        InputTextModule,
        InputIconModule,
        IconFieldModule,
        SelectButtonModule,
        FormsModule,
    ],
    providers: [MessageService, DialogService],
    templateUrl: './alarm-details.html',
})
export class AlarmDetails implements OnInit, OnDestroy {
    value?: number | string;
    deviceType?: 'router' | 'switch' | 'ap';
    deviceModel: string = 'n/d';
    deviceIsOnline: boolean = false;
    deviceIp: string = 'n/d';
    deviceSn: string = 'n/d';
    deviceMac: string = 'n/d';

    get deviceTypeName(): string {
        switch (this.deviceType) {
            case 'router':
                return 'Roteador';
            case 'switch':
                return 'Switch';
            case 'ap':
                return 'Ponto de Acesso';
            default:
                return 'Dispositivo Desconhecido';
        }
    }

    // Opções do filtro de status
    filterOptions: any[] = [
        { label: 'Todos', value: 'all' },
        { label: 'Abertos', value: 'open' },
        { label: 'Fechados', value: 'solved' },
    ];
    selectedFilterOption: string = 'all';

    isAlarmsLoading: boolean = false;
    private alarmSubscription: any = null;

    isViewGlobalLoading: boolean = false;
    private viewGlobalSubscription: any = null;

    selectedAlarm: AlarmViewModel | null = null;
    alarms: AlarmViewModel[] = [];

    menuItens: MenuItem[] = [];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly messageService: MessageService,
        private readonly dialogService: DialogService,
    ) { }

    applyFilter(): void {
        // if (this.value === 'all') {
        //     this.filteredSites = [...this.sites];
        // } else if (this.value === 'online') {
        //     // Sites online = sites SEM nenhum device offline
        //     this.filteredSites = this.sites.filter(site => !site.hasOfflineDevices());
        // } else if (this.value === 'offline') {
        //     // Sites offline = sites COM pelo menos um device offline
        //     this.filteredSites = this.sites.filter(site => site.hasOfflineDevices());
        // }
    }

    searchAlarms(event: any): void {
        // Placeholder for search functionality
        console.log('Search input:', event.target.value);
    }

    async getDeviceDetails(): Promise<void> {
        this.isViewGlobalLoading = true;
        this.viewGlobalSubscription = this.eaceService.getViewGlobalData().subscribe({
            next: (data) => {
                this.isViewGlobalLoading = false;
                let device: any = null;

                if (this.deviceType === 'router') {
                    device = data.data.find(d => d.router && d.router.sceneId === this.value as number)?.router;
                    this.deviceModel = device.model;
                    this.deviceIsOnline = device.online;
                    this.deviceIp = device.wanIp;
                    this.deviceSn = device.sn;
                    this.deviceMac = device.lanMac;
                } else {
                    device = data.data
                        .flatMap(d => this.deviceType === 'switch' ? d.switches : d.aps)
                        .find(dev => dev.sn === this.value as string);

                    this.deviceModel = device.aliasName;
                    this.deviceIsOnline = device.online;
                    this.deviceIp = device.devIp;
                    this.deviceSn = device.sn;
                    this.deviceMac = 'n/d'; // MAC não está disponível para switches e APs
                }
            },
            error: (err) => {
                this.isViewGlobalLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao buscar dados do dispositivo - ' ${(err?.message ? ` (${err.message})` : '')}`,
                });
            },
            complete: () => {
                this.isViewGlobalLoading = false;
            },
        });
    }

    async getData(): Promise<void> {
        this.isAlarmsLoading = true;
        this.alarmSubscription = this.eaceService.getAlarms(this.deviceType!, this.value!, 15).subscribe({
            next: (data) => {
                this.isAlarmsLoading = false;
                this.alarms = data;
            },
            error: (err) => {
                this.isAlarmsLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao buscar dados da alarmes - ' ${(err?.message ? ` (${err.message})` : '')}`,
                });
            },
            complete: () => {
                this.isAlarmsLoading = false;
            }
        });
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.deviceType = params['deviceType'];
            this.value = this.deviceType === 'router' ? Number(params['value']) : params['value'];
            this.getDeviceDetails();
            this.getData();
        });
    }

    ngOnDestroy(): void {
        if (this.alarmSubscription) {
            this.alarmSubscription.unsubscribe();
        }

        if (this.viewGlobalSubscription) {
            this.viewGlobalSubscription.unsubscribe();
        }
    }

    buildMenu(alarm: AlarmViewModel): MenuItem[] {
        if (this.selectedAlarm?.isSolved === false) {
            return [
                {
                    label: 'Comentar',
                    icon: 'pi pi-comment',
                    command: () => {
                        console.log('Open add comment dialog');
                        this.dialogService.open(AddComment, {
                            header: 'Adicionar Comentário',
                            styleClass: 'w-full md:w-[45%] mx-auto',
                            data: { alarmId: this.selectedAlarm?.id },
                            closable: true,
                            dismissableMask: true,
                            style: { 'background-color': '#f1f5f9' },
                        }).onClose.subscribe((result) => {
                            if (result) {
                                // Handle result if needed
                            }
                            console.log('Comment added:', result);
                        });
                    }
                },
                {
                    label: 'Fechar alarme',
                    icon: 'pi pi-check-circle',
                    command: () => {
                        // Placeholder for close alarm action
                    }
                },
            ];
        } else {
            return [
                {
                    label: 'Reabrir alarme',
                    icon: 'pi pi-exclamation-triangle',
                    command: () => {
                        // Placeholder for comment action
                    }
                },
            ];
        }
    }

    showPopupMenu(menu: any, event: any, alarm: AlarmViewModel): void {
        this.selectedAlarm = alarm;
        this.menuItens = this.buildMenu(alarm); // Atualiza os itens aqui
        menu.toggle(event);
    }
}