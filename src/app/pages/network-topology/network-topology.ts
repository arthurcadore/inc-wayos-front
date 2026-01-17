import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { Popover } from "primeng/popover";
import { jsPDF } from 'jspdf';
import { EaceService } from "../service/eace.service";
import { DeviceType, TopologyNode } from "../service/dtos/network-topology.dto";
import { MessageService } from "primeng/api";
import { ActivatedRoute } from "@angular/router";

// Interface para uma conexão visual entre dispositivos
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

    // Configuração de dispositivos
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

    // Configuração de layout
    private readonly LAYOUT_CONFIG = {
        LEVEL_1_Y: 80,
        LEVEL_2_Y: 300,
        LEVEL_3_Y: 520,
        NODE_SPACING: 25,
        GROUP_SPACING: 25,
        MARGIN: 25
    };

    // Dados da topologia
    nodes: TopologyNode[] = [];
    connections: TopologyConnection[] = [];

    // Dispositivo selecionado para mostrar no popover
    selectedDevice: TopologyNode | null = null;

    // Configurações do SVG
    svgWidth = 1600;
    svgHeight = 800;
    nodeWidth = 180;
    nodeHeight = 120;

    // Controles de visualização
    scale = 1;
    translateX = 0;
    translateY = 0;
    zoomStep = 0.2;

    // Controle de pan com mouse
    isPanMode = false;
    isDragging = false;
    lastMouseX = 0;
    lastMouseY = 0;

    isLoading: boolean = false;
    subscription: any = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly eaceService: EaceService,
        private readonly messageService: MessageService,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.shopId = params['shopId'] ? +params['shopId'] : null;
            if (!this.shopId) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Parâmetro shopId é obrigatório na URL.',
                    life: 5000,
                });
                return;
            }
            this.loadNetworkTopologyData();
        });
    }

    /**
     * Carrega dados mockados da topologia baseado na imagem de referência
     */
    loadNetworkTopologyData(): void {
        this.isLoading = true;
        this.subscription = this.eaceService.getNetworkTopologyData(this.shopId!).subscribe({
            next: (data) => {
                this.nodes = data;
                this.calculateLayout();
                this.calculateConnections();
            },
            error: (err) => {
                this.isLoading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Falha ao carregar dados da topologia de rede - ' ${(err?.message ? ` (${err.message})` : '')}`,
                    life: 5000,
                });
            },
            complete: () => {
                this.isLoading = false;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    /**
     * Calcula posições dos nós baseado na hierarquia (de baixo para cima)
     */
    private calculateLayout(): void {
        const layers = this.groupNodesByType();
        const groupCenters = this.positionLevel3Nodes(layers);
        this.positionLevel2Nodes(layers, groupCenters);
        this.positionLevel1Nodes(layers);
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

        if (connectedSwitches.length === 0) return;

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
     * Agrupa nós por tipo de dispositivo
     */
    private groupNodesByType(): { routers: TopologyNode[], switches: TopologyNode[], accessPoints: TopologyNode[], stations: TopologyNode[] } {
        return {
            routers: this.nodes.filter(n => n.type === DeviceType.ROUTER),
            switches: this.nodes.filter(n => n.type === DeviceType.SWITCH),
            accessPoints: this.nodes.filter(n => n.type === DeviceType.ACCESS_POINT),
            stations: this.nodes.filter(n => n.type === DeviceType.STATION)
        };
    }

    /**
     * Retorna os IDs dos routers (cached)
     */
    private getRouterIds(): string[] {
        return this.nodes.filter(n => n.type === DeviceType.ROUTER).map(r => r.id);
    }

    /**
     * Retorna nós do nível 2: Switches + APs conectados diretamente ao router
     */
    private getLevel2Nodes(switches: TopologyNode[], accessPoints: TopologyNode[]): TopologyNode[] {
        const routerIds = this.getRouterIds();

        // APs conectados diretamente ao router
        const directAPs = accessPoints.filter(ap => {
            return ap.ports.some(port => routerIds.includes(port.connectedToDeviceId));
        });

        // Combina switches e APs diretos, ordenando: switches primeiro, depois APs
        return [...switches, ...directAPs];
    }

    /**
     * Retorna APs do nível 3: APs conectados aos switches
     */
    private getLevel3AccessPoints(accessPoints: TopologyNode[]): TopologyNode[] {
        const routerIds = this.getRouterIds();

        // APs que NÃO estão conectados diretamente ao router
        return accessPoints.filter(ap => {
            return !ap.ports.some(port => routerIds.includes(port.connectedToDeviceId));
        });
    }

    /**
     * Calcula as conexões entre dispositivos
     */
    private calculateConnections(): void {
        this.connections = [];

        this.nodes.forEach(node => {
            node.ports.forEach(port => {
                const targetNode = this.nodes.find(n => n.id === port.connectedToDeviceId);
                if (targetNode && node.position && targetNode.position) {
                    // Verifica se a conexão já existe (evita duplicatas)
                    const exists = this.connections.some(c =>
                        (c.fromDevice === node.id && c.toDevice === targetNode.id) ||
                        (c.fromDevice === targetNode.id && c.toDevice === node.id)
                    );

                    if (!exists) {
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

    /**
     * Retorna o centro inferior de um nó (ponto de saída)
     */
    getNodeBottomCenter(node: TopologyNode): { x: number, y: number } {
        return {
            x: (node.position?.x || 0) + this.nodeWidth / 2,
            y: (node.position?.y || 0) + this.nodeHeight
        };
    }

    /**
     * Retorna o centro superior de um nó (ponto de entrada)
     */
    getNodeTopCenter(node: TopologyNode): { x: number, y: number } {
        return {
            x: (node.position?.x || 0) + this.nodeWidth / 2,
            y: node.position?.y || 0
        };
    }

    /**
     * Gera o path SVG para uma conexão com linhas verticais e horizontais
     */
    getConnectionPath(connection: TopologyConnection): string {
        const fromNode = this.nodes.find(n => n.id === connection.fromDevice);
        const toNode = this.nodes.find(n => n.id === connection.toDevice);

        if (!fromNode || !toNode || !fromNode.position || !toNode.position) {
            return '';
        }

        const start = this.getNodeBottomCenter(fromNode);
        const end = this.getNodeTopCenter(toNode);

        // Calcula ponto médio vertical para criar conexões em forma de "T"
        const midY = start.y + (end.y - start.y) / 2;

        // Cria path com linhas verticais e horizontais (sem diagonais)
        // Formato: sai verticalmente do dispositivo de origem, 
        // move horizontalmente até alinhar com o destino,
        // e desce/sobe verticalmente até o dispositivo de destino
        const path = `
            M ${start.x} ${start.y}
            L ${start.x} ${midY}
            L ${end.x} ${midY}
            L ${end.x} ${end.y}
        `;

        return path.trim();
    }

    /**
     * Retorna a posição para o label da porta de origem
     */
    getFromPortLabelPosition(connection: TopologyConnection): { x: number, y: number } {
        const toNode = this.nodes.find(n => n.id === connection.toDevice);
        if (!toNode || !toNode.position) return { x: 0, y: 0 };

        const point = this.getNodeTopCenter(toNode);
        return { x: point.x - 30, y: point.y - 48 };
    }

    /**
     * Retorna a posição para o label da porta de destino
     */
    getToPortLabelPosition(connection: TopologyConnection): { x: number, y: number } {
        const toNode = this.nodes.find(n => n.id === connection.toDevice);
        if (!toNode || !toNode.position) return { x: 0, y: 0 };

        const point = this.getNodeTopCenter(toNode);
        return { x: point.x - 30, y: point.y - 20 };
    }

    /**
     * Retorna a classe CSS baseada no tipo de dispositivo
     */
    getDeviceClass(type: DeviceType): string {
        return this.DEVICE_CONFIG[type]?.className || '';
    }

    /**
     * Retorna a imagem PNG baseada no tipo de dispositivo
     */
    getDeviceImage(type: DeviceType): string {
        return this.DEVICE_CONFIG[type]?.image || '';
    }

    /**
     * Retorna o nome do tipo de dispositivo formatado
     */
    getDeviceTypeName(type: DeviceType): string {
        return this.DEVICE_CONFIG[type]?.displayName || 'Dispositivo';
    }

    /**
     * Retorna o nome do dispositivo conectado à porta
     */
    getConnectedDeviceName(deviceId: string): string {
        const device = this.nodes.find(n => n.id === deviceId);
        return device ? device.name : 'Desconhecido';
    }

    /**
     * Mostra o popover com detalhes do dispositivo
     */
    showDeviceDetails(event: MouseEvent, node: TopologyNode): void {
        // Não mostra o popover se estiver em modo pan
        if (this.isPanMode) {
            return;
        }

        this.selectedDevice = node;

        // Calcula a posição na tela do nó considerando zoom e pan
        const nodeX = (node.position?.x || 0) * this.scale + this.translateX;
        const nodeY = (node.position?.y || 0) * this.scale + this.translateY;

        // Posiciona o elemento âncora no centro do dispositivo
        const anchorElement = this.popoverAnchor.nativeElement as HTMLElement;
        anchorElement.style.left = `${nodeX + (this.nodeWidth * this.scale) / 2}px`;
        anchorElement.style.top = `${nodeY + (this.nodeHeight * this.scale) / 2}px`;

        // Mostra o popover usando o elemento âncora como target
        setTimeout(() => {
            this.devicePopover.toggle(event, anchorElement);
        }, 0);
    }

    /**
     * Retorna a transformação SVG para zoom e pan
     */
    getTransform(): string {
        return `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`;
    }

    /**
     * Aumenta o zoom
     */
    zoomIn(): void {
        this.scale = Math.min(this.scale + this.zoomStep, 3); // Máximo 3x
    }

    /**
     * Diminui o zoom
     */
    zoomOut(): void {
        this.scale = Math.max(this.scale - this.zoomStep, 0.5); // Mínimo 0.5x
    }

    /**
     * Restaura o zoom para 1:1
     */
    resetZoom(): void {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
    }

    /**
     * Ativa/desativa o modo de pan com mouse
     */
    togglePanMode(): void {
        this.isPanMode = !this.isPanMode;
        if (!this.isPanMode) {
            this.isDragging = false;
        }
    }

    /**
     * Inicia o arrasto do gráfico
     */
    onMouseDown(event: MouseEvent): void {
        if (this.isPanMode) {
            this.isDragging = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            event.preventDefault();
        }
    }

    /**
     * Move o gráfico enquanto arrasta
     */
    onMouseMove(event: MouseEvent): void {
        if (this.isPanMode && this.isDragging) {
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;

            this.translateX += deltaX;
            this.translateY += deltaY;

            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            event.preventDefault();
        }
    }

    /**
     * Finaliza o arrasto do gráfico
     */
    onMouseUp(event: MouseEvent): void {
        if (this.isPanMode) {
            this.isDragging = false;
            event.preventDefault();
        }
    }

    /**
     * Retorna o cursor CSS baseado no modo de pan
     */
    getCursor(): string {
        if (this.isPanMode) {
            return this.isDragging ? 'grabbing' : 'grab';
        }
        return 'default';
    }

    /**
     * Converte uma imagem para base64 Data URL
     */
    private async imageToDataURL(url: string): Promise<string> {
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
                    reject(new Error('Failed to get canvas context'));
                }
            };

            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    /**
     * Exporta a topologia como PDF
     */
    async exportToPDF(): Promise<void> {
        try {
            const svgClone = this.cloneSvgWithoutTransform();
            await this.convertSvgImagesToBase64(svgClone);
            const svgDataUrl = this.serializeSvgToDataUrl(svgClone);
            await this.renderSvgToPdf(svgDataUrl);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao exportar o PDF. Tente novamente.');
        }
    }

    /**
     * Clona o SVG e remove transformações
     */
    private cloneSvgWithoutTransform(): SVGElement {
        const svg = this.svgElement.nativeElement as SVGElement;
        const svgClone = svg.cloneNode(true) as SVGElement;

        const mainGroup = svgClone.querySelector('g[transform]');
        if (mainGroup) {
            mainGroup.removeAttribute('transform');
        }

        return svgClone;
    }

    /**
     * Converte todas as imagens do SVG para base64
     */
    private async convertSvgImagesToBase64(svgElement: SVGElement): Promise<void> {
        const images = svgElement.querySelectorAll('image');
        const imagePromises: Promise<void>[] = [];

        images.forEach((imageElement) => {
            const href = imageElement.getAttribute('href') || imageElement.getAttribute('xlink:href');
            if (href && !href.startsWith('data:')) {
                const promise = this.imageToDataURL(href)
                    .then(dataUrl => {
                        imageElement.setAttribute('href', dataUrl);
                        imageElement.removeAttribute('xlink:href');
                    })
                    .catch(error => {
                        console.error('Error converting image:', error);
                    });
                imagePromises.push(promise);
            }
        });

        await Promise.all(imagePromises);
    }

    /**
     * Serializa o SVG e converte para Data URL
     */
    private serializeSvgToDataUrl(svgElement: SVGElement): string {
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElement);

        if (!svgString.includes('xmlns')) {
            svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
        return `data:image/svg+xml;base64,${svgBase64}`;
    }

    /**
     * Renderiza SVG em canvas e gera PDF
     */
    private async renderSvgToPdf(svgDataUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = this.svgWidth;
                canvas.height = this.svgHeight;

                if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [canvas.width, canvas.height]
                    });

                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                    pdf.save('topologia-de-rede.pdf');
                    resolve();
                } else {
                    reject(new Error('Failed to get canvas context'));
                }
            };

            img.onerror = (error) => {
                reject(new Error('Erro ao carregar o SVG'));
            };

            img.src = svgDataUrl;
        });
    }
}