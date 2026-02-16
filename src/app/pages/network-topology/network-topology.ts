import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { Popover } from "primeng/popover";
import { jsPDF } from 'jspdf';
import { firstValueFrom, Subscription } from 'rxjs';
import { EaceService } from "../service/eace.service";
import { DeviceType, TopologyNode } from "../service/dtos/network-topology.dto";
import { MessageService } from "primeng/api";
import { ActivatedRoute } from "@angular/router";
import { WayosRouterInfo } from "../service/dtos/view-global.dtos";

export interface TopologyConnection {
    fromDevice: string;
    fromPort: string;
    toDevice: string;
    toPort: string;
    path?: string;
}

@Component({
    selector: "app-network-topology",
    standalone: true,
    templateUrl: "./network-topology.html",
    styleUrls: ["./network-topology.scss"],
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        TooltipModule,
        Popover,
    ]
})
export class NetworkTopology implements OnInit, OnDestroy {
    @ViewChild('topologySvg', { read: ElementRef }) svgElement!: ElementRef;
    @ViewChild('devicePopover') devicePopover!: Popover;
    @ViewChild('popoverAnchor', { read: ElementRef }) popoverAnchor!: ElementRef;

    shopId: number | null = null;
    routerDevice: WayosRouterInfo | null = null;

    private readonly DEVICE_CONFIG = {
        [DeviceType.ROUTER]: {
            className: 'device-router',
            image: 'assets/imgs/router.png',
            displayName: 'Roteador'
        },
        [DeviceType.SWITCH]: {
            className: 'device-switch',
            image: 'assets/imgs/switche.png',
            displayName: 'Switch'
        },
        [DeviceType.ACCESS_POINT]: {
            className: 'device-ap',
            image: 'assets/imgs/ap.png',
            displayName: 'Access Point'
        },
        [DeviceType.STATION]: {
            className: 'device-station',
            image: 'assets/imgs/station.png',
            displayName: 'Estação'
        }
    };

    private readonly LAYOUT_CONFIG = {
        LEVEL_1_Y: 80,
        LEVEL_2_Y: 240,
        LEVEL_3_Y: 460,
        LEVEL_4_Y: 580,
        NODE_SPACING: 25,
        GROUP_SPACING: 25,
        MARGIN: 25
    };

    private readonly ZOOM_CONFIG = {
        MIN: 0.5,
        MAX: 3,
        STEP: 0.2
    };

    private readonly LABEL_OFFSET = {
        X: -30,
        FROM_Y: -48,
        TO_Y: -20
    };

    nodes: TopologyNode[] = [];
    connections: TopologyConnection[] = [];
    selectedDevice: TopologyNode | null = null;

    svgWidth = 1600;
    svgHeight = 800;
    nodeWidth = 180;
    nodeHeight = 120;

    scale = 1;
    translateX = 0;
    translateY = 0;

    isPanMode = false;
    isDragging = false;
    lastMouseX = 0;
    lastMouseY = 0;

    isLoading = false;
    private queryParamsSubscription: Subscription | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly messageService: MessageService,
    ) { }

    ngOnInit(): void {
        this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
            this.shopId = params['shopId'] ? +params['shopId'] : null;
            if (!this.shopId) {
                this.showError('Parâmetro shopId é obrigatório na URL.');
                return;
            }
            this.loadData();
        });
    }

    async loadData(): Promise<void> {
        this.isLoading = true;
        try {
            const data = await firstValueFrom(this.eaceService.getViewGlobalData(true));
            const viewGlobalItem = data.data.find(item => item.shopId === this.shopId);

            if (!viewGlobalItem) {
                this.showError(`Nenhum dispositivo encontrado para o shopId ${this.shopId}.`);
                return;
            }

            this.routerDevice = viewGlobalItem.router;
            await this.loadNetworkTopologyData();
        } catch (err: any) {
            this.showError(err.message || 'Falha ao buscar dados da visão global');
        } finally {
            this.isLoading = false;
        }
    }

    private async loadNetworkTopologyData(): Promise<void> {
        try {
            this.nodes = await firstValueFrom(this.eaceService.getNetworkTopologyData(this.shopId!));            
            const routerNode = this.nodes.find(n => n.type === DeviceType.ROUTER);

            if (routerNode) {
                routerNode.name = 'Roteador';
                routerNode.model = this.routerDevice?.model || '(n/d)';
            }
            
            this.calculateLayout();
            this.calculateConnections();
        } catch (err: any) {
            this.showError(`Falha ao carregar dados da topologia de rede${err.message ? ` (${err.message})` : ''}`);
        }
    }

    ngOnDestroy(): void {
        this.queryParamsSubscription?.unsubscribe();
    }

    /**
     * Calcula posições dos nós baseado na hierarquia (de baixo para cima)
     */
    private calculateLayout(): void {
        const layers = this.groupNodesByType();
        const groupCenters = this.positionLevel3Nodes(layers);
        this.positionLevel2Nodes(layers, groupCenters);
        this.positionLevel1Nodes(layers);
        this.positionLevel4Nodes(layers);
    }

    /**
     * Posiciona nós do nível 3 (APs e Stations conectados aos switches)
     */
    private positionLevel3Nodes(layers: ReturnType<typeof this.groupNodesByType>): Map<string, number> {
        const level3APs = this.getLevel3AccessPoints(layers.accessPoints);
        const level3Nodes = [...level3APs, ...layers.stations];

        const level3Groups: { switchId: string, nodes: TopologyNode[] }[] = [];

        layers.switches.forEach(sw => {
            const connectedNodes = level3Nodes.filter(n =>
                n.ports.some(port => port.connectedToDeviceId === sw.id)
            );

            if (connectedNodes.length > 0) {
                level3Groups.push({ switchId: sw.id, nodes: connectedNodes });
            }
        });

        let currentX = this.LAYOUT_CONFIG.MARGIN;
        const groupCenters = new Map<string, number>();

        level3Groups.forEach(group => {
            const groupWidth = group.nodes.length * this.nodeWidth +
                (group.nodes.length - 1) * this.LAYOUT_CONFIG.NODE_SPACING;
            const groupCenterX = currentX + groupWidth / 2;
            groupCenters.set(group.switchId, groupCenterX);

            let nodeX = currentX;
            group.nodes.forEach(node => {
                node.position = { x: nodeX, y: this.LAYOUT_CONFIG.LEVEL_3_Y };
                nodeX += this.nodeWidth + this.LAYOUT_CONFIG.NODE_SPACING;
            });

            currentX += groupWidth + this.LAYOUT_CONFIG.GROUP_SPACING;
        });

        return groupCenters;
    }

    /**
     * Posiciona nós do nível 2 (Switches e APs diretos ao router)
     */
    private positionLevel2Nodes(
        layers: ReturnType<typeof this.groupNodesByType>,
        groupCenters: Map<string, number>
    ): void {
        // Posiciona switches centralizados sobre seus grupos de filhos
        layers.switches.forEach(sw => {
            const centerX = groupCenters.get(sw.id);
            if (centerX !== undefined) {
                sw.position = {
                    x: centerX - this.nodeWidth / 2,
                    y: this.LAYOUT_CONFIG.LEVEL_2_Y
                };
            }
        });

        // Posiciona APs conectados diretamente ao router
        const level2Nodes = this.getLevel2Nodes(layers.switches, layers.accessPoints);
        const directAPs = level2Nodes.filter(n => n.type === DeviceType.ACCESS_POINT);

        if (directAPs.length > 0) {
            const lastSwitch = layers.switches[layers.switches.length - 1];
            let apX = lastSwitch?.position
                ? lastSwitch.position.x + this.nodeWidth + this.LAYOUT_CONFIG.GROUP_SPACING
                : this.LAYOUT_CONFIG.MARGIN;

            directAPs.forEach(ap => {
                ap.position = { x: apX, y: this.LAYOUT_CONFIG.LEVEL_2_Y };
                apX += this.nodeWidth + this.LAYOUT_CONFIG.GROUP_SPACING;
            });
        }
    }

    /**
     * Posiciona nós do nível 1 (Router)
     */
    private positionLevel1Nodes(layers: ReturnType<typeof this.groupNodesByType>): void {
        if (layers.routers.length === 0) return;

        const connectedSwitches = layers.switches.filter(sw =>
            sw.ports.some(port =>
                layers.routers.some(router => router.id === port.connectedToDeviceId)
            )
        );

        // Se não há switches, posiciona o router baseado nos APs diretos
        if (connectedSwitches.length === 0) {
            const level2Nodes = this.getLevel2Nodes(layers.switches, layers.accessPoints);
            const directAPs = level2Nodes.filter(n => n.type === DeviceType.ACCESS_POINT);
            
            if (directAPs.length > 0 && directAPs[0].position && directAPs[directAPs.length - 1].position) {
                const firstAP = directAPs[0];
                const lastAP = directAPs[directAPs.length - 1];
                const centerX = (firstAP.position!.x + lastAP.position!.x + this.nodeWidth) / 2;
                const routerX = centerX - this.nodeWidth / 2;
                
                layers.routers.forEach(router => {
                    router.position = { x: routerX, y: this.LAYOUT_CONFIG.LEVEL_1_Y };
                });
            } else {
                // Fallback: posiciona o router no centro se não houver nós de referência
                layers.routers.forEach(router => {
                    router.position = { x: this.LAYOUT_CONFIG.MARGIN, y: this.LAYOUT_CONFIG.LEVEL_1_Y };
                });
            }
            return;
        }

        const firstSwitch = connectedSwitches[0];
        const lastSwitch = connectedSwitches[connectedSwitches.length - 1];

        if (firstSwitch.position && lastSwitch.position) {
            const centerX = (firstSwitch.position.x + lastSwitch.position.x + this.nodeWidth) / 2;
            const routerX = centerX - this.nodeWidth / 2;

            layers.routers.forEach(router => {
                router.position = { x: routerX, y: this.LAYOUT_CONFIG.LEVEL_1_Y };
            });
        }
    }

    /**
     * Posiciona nós do nível 4 (Dispositivos sem portas - isolados)
     */
    private positionLevel4Nodes(layers: ReturnType<typeof this.groupNodesByType>): void {
        if (layers.noPortsDevices.length === 0) return;
        
        let currentX = this.LAYOUT_CONFIG.MARGIN;
        
        layers.noPortsDevices.forEach(node => {
            node.position = { x: currentX, y: this.LAYOUT_CONFIG.LEVEL_4_Y };
            currentX += this.nodeWidth + this.LAYOUT_CONFIG.NODE_SPACING;
        });
    }

    private groupNodesByType() {
        const groups = {
            routers: [] as TopologyNode[],
            switches: [] as TopologyNode[],
            accessPoints: [] as TopologyNode[],
            stations: [] as TopologyNode[],
            noPortsDevices: [] as TopologyNode[]
        };
        
        this.nodes.forEach(node => {
            if (!node.ports?.length) {
                groups.noPortsDevices.push(node);
            } else {
                switch (node.type) {
                    case DeviceType.ROUTER:
                        groups.routers.push(node);
                        break;
                    case DeviceType.SWITCH:
                        groups.switches.push(node);
                        break;
                    case DeviceType.ACCESS_POINT:
                        groups.accessPoints.push(node);
                        break;
                    case DeviceType.STATION:
                        groups.stations.push(node);
                        break;
                }
            }
        });
        
        return groups;
    }

    private getRouterIds(): string[] {
        return this.nodes.filter(n => n.type === DeviceType.ROUTER).map(r => r.id);
    }

    private getLevel2Nodes(switches: TopologyNode[], accessPoints: TopologyNode[]): TopologyNode[] {
        const routerIds = this.getRouterIds();
        const directAPs = accessPoints.filter(ap =>
            ap.ports.some(port => routerIds.includes(port.connectedToDeviceId))
        );
        return [...switches, ...directAPs];
    }

    private getLevel3AccessPoints(accessPoints: TopologyNode[]): TopologyNode[] {
        const routerIds = this.getRouterIds();
        return accessPoints.filter(ap =>
            !ap.ports.some(port => routerIds.includes(port.connectedToDeviceId))
        );
    }

    private calculateConnections(): void {
        this.connections = [];
        const seen = new Set<string>();

        this.nodes
            .filter(node => node.ports?.length > 0)
            .forEach(node => {
                node.ports.forEach(port => {
                    const targetNode = this.nodes.find(n => n.id === port.connectedToDeviceId);
                    if (targetNode?.position && node.position) {
                        const key = [node.id, targetNode.id].sort().join('|');
                        if (!seen.has(key)) {
                            seen.add(key);
                            this.connections.push({
                                fromDevice: node.id,
                                fromPort: port.portName,
                                toDevice: targetNode.id,
                                toPort: port.connectedToPort
                            });
                        }
                    }
                });
            });
    }

    getNodeTopCenter(node: TopologyNode): { x: number, y: number } {
        return {
            x: (node.position?.x || 0) + this.nodeWidth / 2,
            y: node.position?.y || 0
        };
    }

    private getNodeBottomCenter(node: TopologyNode): { x: number, y: number } {
        return {
            x: (node.position?.x || 0) + this.nodeWidth / 2,
            y: (node.position?.y || 0) + this.nodeHeight
        };
    }

    getConnectionPath(connection: TopologyConnection): string {
        const fromNode = this.nodes.find(n => n.id === connection.fromDevice);
        const toNode = this.nodes.find(n => n.id === connection.toDevice);

        if (!fromNode?.position || !toNode?.position) return '';

        const start = this.getNodeBottomCenter(fromNode);
        const end = this.getNodeTopCenter(toNode);
        const midY = start.y + (end.y - start.y) / 2;

        return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
    }

    getFromPortLabelPosition(connection: TopologyConnection): { x: number, y: number } {
        return this.getPortLabelPosition(connection.toDevice, this.LABEL_OFFSET.FROM_Y);
    }

    getToPortLabelPosition(connection: TopologyConnection): { x: number, y: number } {
        return this.getPortLabelPosition(connection.toDevice, this.LABEL_OFFSET.TO_Y);
    }

    private getPortLabelPosition(deviceId: string, yOffset: number): { x: number, y: number } {
        const node = this.nodes.find(n => n.id === deviceId);
        if (!node?.position) return { x: 0, y: 0 };
        
        const point = this.getNodeTopCenter(node);
        return { x: point.x + this.LABEL_OFFSET.X, y: point.y + yOffset };
    }

    getDeviceClass(type: DeviceType): string {
        return this.getDeviceConfigValue(type, 'className', '');
    }

    getDeviceImage(type: DeviceType): string {
        return this.getDeviceConfigValue(type, 'image', '');
    }

    getDeviceTypeName(type: DeviceType): string {
        return this.getDeviceConfigValue(type, 'displayName', 'Dispositivo');
    }

    private getDeviceConfigValue<K extends keyof (typeof this.DEVICE_CONFIG)[DeviceType]>(
        type: DeviceType,
        key: K,
        fallback: any
    ) {
        return this.DEVICE_CONFIG[type]?.[key] ?? fallback;
    }

    getConnectedDeviceName(deviceId: string): string {
        const device = this.nodes.find(n => n.id === deviceId);
        return device ? device.name : 'Desconhecido';
    }

    showDeviceDetails(event: MouseEvent, node: TopologyNode): void {
        if (this.isPanMode) return;

        this.selectedDevice = node;

        const nodeX = (node.position?.x || 0) * this.scale + this.translateX;
        const nodeY = (node.position?.y || 0) * this.scale + this.translateY;

        const anchorElement = this.popoverAnchor.nativeElement as HTMLElement;
        anchorElement.style.left = `${nodeX + (this.nodeWidth * this.scale) / 2}px`;
        anchorElement.style.top = `${nodeY + (this.nodeHeight * this.scale) / 2}px`;

        setTimeout(() => this.devicePopover.toggle(event, anchorElement), 0);
    }

    getTransform(): string {
        return `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`;
    }

    zoomIn(): void {
        this.scale = Math.min(this.scale + this.ZOOM_CONFIG.STEP, this.ZOOM_CONFIG.MAX);
    }

    zoomOut(): void {
        this.scale = Math.max(this.scale - this.ZOOM_CONFIG.STEP, this.ZOOM_CONFIG.MIN);
    }

    resetZoom(): void {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
    }

    togglePanMode(): void {
        this.isPanMode = !this.isPanMode;
        if (!this.isPanMode) {
            this.isDragging = false;
        }
    }

    onMouseDown(event: MouseEvent): void {
        if (!this.isPanMode) return;
        
        this.isDragging = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        event.preventDefault();
    }

    onMouseMove(event: MouseEvent): void {
        if (!this.isPanMode || !this.isDragging) return;
        
        this.translateX += event.clientX - this.lastMouseX;
        this.translateY += event.clientY - this.lastMouseY;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        event.preventDefault();
    }

    onMouseUp(event: MouseEvent): void {
        if (!this.isPanMode) return;
        
        this.isDragging = false;
        event.preventDefault();
    }

    getCursor(): string {
        if (this.isPanMode) {
            return this.isDragging ? 'grabbing' : 'grab';
        }
        return 'default';
    }

    private showError(detail: string, life = 5000): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail,
            life
        });
    }

    /**
     * Converte uma imagem para base64 data URL
     */
    private async convertImageToBase64(imagePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } else {
                    reject(new Error('Falha ao criar contexto do canvas'));
                }
            };
            img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${imagePath}`));
            img.src = imagePath;
        });
    }

    /**
     * Exporta a topologia de rede para PDF no formato A4 horizontal
     */
    async exportToPDF(): Promise<void> {
        if (!this.svgElement) {
            this.showError('Elemento SVG não encontrado');
            return;
        }

        this.isLoading = true;
        try {
            // Obter o elemento SVG
            const svgElement = this.svgElement.nativeElement as SVGElement;
            
            // Salvar estado atual de transformação
            const currentScale = this.scale;
            const currentTranslateX = this.translateX;
            const currentTranslateY = this.translateY;

            // Resetar transformações temporariamente
            this.scale = 1;
            this.translateX = 0;
            this.translateY = 0;

            // Aguardar um pequeno delay para a atualização do DOM
            await new Promise(resolve => setTimeout(resolve, 100));

            // Converter todas as imagens de dispositivos para base64
            const imageElements = svgElement.querySelectorAll('image');
            const imageConversions = Array.from(imageElements).map(async (imgElement) => {
                const href = imgElement.getAttribute('href') || imgElement.getAttribute('xlink:href');
                if (href && !href.startsWith('data:')) {
                    try {
                        const dataUrl = await this.convertImageToBase64(href);
                        imgElement.setAttribute('href', dataUrl);
                        // Remover o atributo xlink:href se existir
                        imgElement.removeAttribute('xlink:href');
                    } catch (err) {
                        console.warn(`Falha ao converter imagem ${href}:`, err);
                    }
                }
            });

            await Promise.all(imageConversions);

            // Serializar SVG para string
            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(svgElement);
            
            // Adicionar namespace XML se necessário
            if (!svgString.includes('xmlns')) {
                svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            }

            // Criar blob do SVG
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Criar imagem a partir do SVG
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Falha ao carregar SVG como imagem'));
                img.src = svgUrl;
            });

            // Criar canvas para renderizar o SVG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error('Falha ao criar contexto do canvas');
            }

            // Dimensões A4 em pixels (300 DPI para alta qualidade)
            const dpi = 300;
            const a4WidthMm = 297;
            const a4HeightMm = 210;
            const a4WidthPx = (a4WidthMm / 25.4) * dpi;
            const a4HeightPx = (a4HeightMm / 25.4) * dpi;

            canvas.width = a4WidthPx;
            canvas.height = a4HeightPx;

            // Preencher com fundo branco
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Margens fixas de segurança (10mm de cada lado convertidas para pixels)
            const marginMm = 10;
            const marginPx = (marginMm / 25.4) * dpi;
            const availableWidth = a4WidthPx - (2 * marginPx);
            const availableHeight = a4HeightPx - (2 * marginPx);

            // Calcular escala para caber dentro da área disponível mantendo proporção
            const scaleX = availableWidth / this.svgWidth;
            const scaleY = availableHeight / this.svgHeight;
            let scale = Math.min(scaleX, scaleY);

            // Reduzir mais 5% da escala como segurança adicional
            scale = scale * 0.95;

            // Dimensões finais do SVG no canvas
            const finalWidth = this.svgWidth * scale;
            const finalHeight = this.svgHeight * scale;

            // Garantir que as dimensões finais são menores que a área disponível
            if (finalWidth > availableWidth || finalHeight > availableHeight) {
                console.warn('Ajustando escala para garantir enquadramento completo');
                const adjustedScale = Math.min(availableWidth / this.svgWidth, availableHeight / this.svgHeight) * 0.90;
                scale = adjustedScale;
            }

            // Recalcular dimensões finais com a escala ajustada
            const adjustedWidth = this.svgWidth * scale;
            const adjustedHeight = this.svgHeight * scale;

            // Centralizar na página
            const x = (a4WidthPx - adjustedWidth) / 2;
            const y = (a4HeightPx - adjustedHeight) / 2;

            // Desenhar a imagem no canvas
            ctx.drawImage(img, x, y, adjustedWidth, adjustedHeight);

            // Limpar URL temporária
            URL.revokeObjectURL(svgUrl);

            // Restaurar transformações originais
            this.scale = currentScale;
            this.translateX = currentTranslateX;
            this.translateY = currentTranslateY;

            // Criar PDF A4 horizontal
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Adicionar a imagem do canvas ao PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, a4WidthMm, a4HeightMm);

            // Gerar nome do arquivo com timestamp
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/T/, '_')
                .replace(/\..+/, '')
                .replace(/:/g, '-');
            const filename = `topologia-de-rede_${timestamp}.pdf`;

            // Fazer download
            pdf.save(filename);

            this.messageService.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'PDF exportado com sucesso',
                life: 3000
            });
        } catch (err: any) {
            console.error('Erro ao exportar PDF:', err);
            this.showError(err.message || 'Falha ao exportar PDF');
        } finally {
            this.isLoading = false;
        }
    }

    toBack(): void {
        globalThis.history.back();
    }
}