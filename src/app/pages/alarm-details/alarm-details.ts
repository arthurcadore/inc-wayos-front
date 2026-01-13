import { Component, OnDestroy, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { EaceService } from '../service/eace.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { ExportFileService } from '@/services/export-file';
import { environment } from 'src/environments/environment';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { AlarmCommentViewModel, AlarmViewModel } from '../service/dtos/alarm-log.dto';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { DialogService } from 'primeng/dynamicdialog';
import { AddComment } from './components/add-comment';
import { TooltipModule } from 'primeng/tooltip';
import { EditComment } from './components/edit-comment';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { PopoverModule } from 'primeng/popover';

@Component({
    selector: 'app-alarm-details',
    standalone: true,
    imports: [
    CommonModule,
    // RouterLink,
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
    TooltipModule,
    ConfirmPopupModule,
    PopoverModule,
],
    providers: [DialogService, ConfirmationService],
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
    currentSearchText: string = '';

    isAlarmsLoading: boolean = false;
    private alarmSubscription: any = null;

    isViewGlobalLoading: boolean = false;
    private viewGlobalSubscription: any = null;

    selectedAlarm: AlarmViewModel | null = null;
    alarms: AlarmViewModel[] = [];
    filteredAlarms: AlarmViewModel[] = [];

    menuItens: MenuItem[] = [];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly messageService: MessageService,
        private readonly dialogService: DialogService,
        private readonly confirmationService: ConfirmationService,
        private readonly exportFileService: ExportFileService,
    ) { }

    applyFilter(): void {
        let filtered = [...this.alarms];

        // Aplicar filtro de status baseado em selectedFilterOption
        if (this.selectedFilterOption === 'open') {
            filtered = filtered.filter(alarm => alarm.isSolved === false);
        } else if (this.selectedFilterOption === 'solved') {
            filtered = filtered.filter(alarm => alarm.isSolved === true);
        }
        // 'all' mostra todos os alarmes, sem filtro adicional

        // Aplicar filtro de texto se houver busca ativa
        if (this.currentSearchText && this.currentSearchText.trim() !== '') {
            const searchLower = this.currentSearchText.toLowerCase().trim();
            filtered = filtered.filter(alarm => {
                // Buscar no título do alarme
                const titleMatch = alarm.title.toLowerCase().includes(searchLower);
                // Buscar no texto de qualquer comentário
                const commentMatch = alarm.comments.some(comment =>
                    comment.text.toLowerCase().includes(searchLower)
                );
                return titleMatch || commentMatch;
            });
        }

        this.filteredAlarms = filtered;
    }

    searchAlarms(event: any): void {
        this.currentSearchText = event.target.value || '';
        this.applyFilter();
    }

    async getDeviceDetails(): Promise<void> {
        this.isViewGlobalLoading = true;
        this.viewGlobalSubscription = this.eaceService.getViewGlobalData(true).subscribe({
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
                    life: 5000,
                });
            },
            complete: () => {
                this.isViewGlobalLoading = false;
            },
        });
    }

    async getData(): Promise<void> {
        this.isAlarmsLoading = true;
        this.alarmSubscription = this.eaceService.getAlarms(this.deviceType!, this.value!, 1).subscribe({
            next: (data) => {
                this.isAlarmsLoading = false;
                data.forEach(alarm => alarm.collapsed = alarm.isSolved === true);
                this.alarms = data;
                this.applyFilter();
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

    collapseAlarms(): void {
        this.filteredAlarms.forEach(alarm => alarm.collapsed = true);
    }

    buildMenu(event: any): MenuItem[] {
        if (this.selectedAlarm?.isSolved === false) {
            return [
                {
                    label: 'Comentar',
                    icon: 'pi pi-comment',
                    command: () => {
                        this.dialogService.open(AddComment, {
                            header: 'Adicionar Comentário',
                            styleClass: 'w-full md:w-[45%] mx-auto',
                            data: { alarmId: this.selectedAlarm?.id },
                            closable: true,
                            dismissableMask: true,
                            style: { 'background-color': '#f1f5f9' },
                        }).onClose.subscribe((result) => {
                            if (result) {
                                this.getDeviceDetails();
                                this.getData();
                            }
                            console.log('Comment added:', result);
                        });
                    }
                },
                {
                    label: 'Fechar alarme',
                    icon: 'pi pi-check-circle',
                    command: () => {
                        this.toogleAlarmSolved(this.selectedAlarm!, event);
                    }
                },
            ];
        } else {
            return [
                {
                    label: 'Reabrir alarme',
                    icon: 'pi pi-exclamation-triangle',
                    command: () => {
                        this.toogleAlarmSolved(this.selectedAlarm!, event);
                    }
                },
            ];
        }
    }

    showPopupMenu(menu: any, event: any, alarm: AlarmViewModel): void {
        this.selectedAlarm = alarm;
        this.menuItens = this.buildMenu(event); // Atualiza os itens aqui
        menu.toggle(event);
    }

    editComment(alarm: AlarmViewModel, alarmComment: AlarmCommentViewModel): void {
        this.dialogService.open(EditComment, {
            header: 'Editar Comentário',
            styleClass: 'w-full md:w-[45%] mx-auto',
            data: { alarmId: alarm.id, alarmCommentId: alarmComment.id, text: alarmComment.text },
            closable: true,
            dismissableMask: true,
            style: { 'background-color': '#f1f5f9' },
        }).onClose.subscribe((result) => {
            if (result) {
                this.getDeviceDetails();
                this.getData();
            }
            console.log('Comment edited:', result);
        });
    }

    removeComment(alarm: AlarmViewModel, alarmComment: AlarmCommentViewModel, event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: 'Tem certeza que deseja remover este comentário?',
            header: 'Confirmação',
            icon: 'pi pi-exclamation-triangle',
            rejectButtonProps: {
                label: 'Não',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: 'Sim',
                severity: 'danger',                
            },
            accept: () => {
                this.isAlarmsLoading = true;
                this.eaceService.deleteComment({ alarmId: alarm.id, alarmCommentId: alarmComment.id }).subscribe({
                    next: () => {
                        this.isAlarmsLoading = false;
                        this.getDeviceDetails();
                        this.getData();
                    },
                    error: (err) => {
                        this.isAlarmsLoading = false;
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: `Falha ao remover comentário - ' ${(err?.message ? ` (${err.message})` : '')}`,
                        });
                    },
                    complete: () => {
                        this.isAlarmsLoading = false;
                    },
                });
            }
        });
    }

    toogleAlarmSolved(alarm: AlarmViewModel, event: Event): void {
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: alarm.isSolved ? 'Tem certeza que deseja reabrir este alarme?' : 'Tem certeza que deseja fechar este alarme?',
            header: 'Confirmação',
            icon: 'pi pi-exclamation-triangle',
            rejectButtonProps: {
                label: 'Não',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: 'Sim',
                severity: 'danger',                
            },
            accept: () => {
                this.isAlarmsLoading = true;
                this.eaceService.toogleAlarmSolved(alarm).subscribe({
                    next: () => {
                        this.isAlarmsLoading = false;
                        this.getDeviceDetails();
                        this.getData();
                    },
                    error: (err) => {
                        this.isAlarmsLoading = false;
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: `Falha ao fechar alarme - ' ${(err?.message ? ` (${err.message})` : '')}`,
                        });
                    },
                    complete: () => {
                        this.isAlarmsLoading = false;
                    },
                });
            },
        });
    }

    exportAlarms(): void {
        // Formatar data no padrão brasileiro
        const formatDate = (dateString: string): string => {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        };

        // Construir conteúdo do arquivo TXT
        let content = `RELATÓRIO DE ALARMES\n`;
        content += `Gerado em: ${formatDate(new Date().toISOString())}\n`;
        content += `Total de alarmes: ${this.filteredAlarms.length}\n`;
        content += `\n${'='.repeat(80)}\n\n`;

        this.filteredAlarms.forEach((alarm, index) => {
            content += `ALARME #${index + 1}\n`;
            content += `-`.repeat(80) + `\n`;
            content += `ID: ${alarm.id}\n`;
            content += `Título: ${alarm.title}\n`;
            content += `Status: ${alarm.isSolved ? 'Resolvido' : 'Aberto'}\n`;
            content += `Criado em: ${formatDate(alarm.createdAt)}\n`;
            content += `Atualizado em: ${formatDate(alarm.updatedAt)}\n`;
            content += `\n`;

            if (alarm.comments && alarm.comments.length > 0) {
                content += `COMENTÁRIOS (${alarm.comments.length}):\n`;
                alarm.comments.forEach((comment, commentIndex) => {
                    content += `\n  [${commentIndex + 1}] ${formatDate(comment.createdAt)} ${comment.createdAt !== comment.updatedAt ? `(editado)` : ''}\n`;
                    content += `  ${comment.text.split('\n').join('\n  ')}\n`;
                });
            } else {
                content += `COMENTÁRIOS: Nenhum comentário registrado\n`;
            }

            content += `\n${'='.repeat(80)}\n\n`;
        });

        // Exportar arquivo TXT
        this.exportFileService.toTXT(content, environment.alarmLogsExportFileName);
    }
}