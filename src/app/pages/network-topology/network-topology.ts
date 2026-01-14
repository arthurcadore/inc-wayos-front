import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { Popover } from "primeng/popover";
import { jsPDF } from 'jspdf';

// Tipos de dispositivos na topologia
export enum DeviceType {
    ROUTER = 'ROUTER',
    SWITCH = 'SWITCH',
    ACCESS_POINT = 'ACCESS_POINT'
}

// Interface para definir uma conexão de porta
export interface PortConnection {
    portName: string;           // Ex: "GE 1/0/1"
    connectedToDeviceId: string;
    connectedToPort: string;
}

// Interface para um nó de dispositivo na topologia
export interface TopologyNode {
    id: string;
    name: string;
    model: string;
    type: DeviceType;
    image?: string;             // URL da imagem do dispositivo (opcional)
    ports: PortConnection[];
    position?: { x: number; y: number }; // Calculado dinamicamente
}

// Interface para uma conexão visual entre dispositivos
export interface TopologyConnection {
    fromDevice: string;
    fromPort: string;
    toDevice: string;
    toPort: string;
    path?: string;              // SVG path calculado
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
    
    ngOnInit(): void {
        this.loadMockData();
        this.calculateLayout();
        this.calculateConnections();
    }
    
    ngOnDestroy(): void {
        // Cleanup logic here
    }
    
    /**
     * Carrega dados mockados da topologia baseado na imagem de referência
     */
    private loadMockData(): void {
        this.nodes = [
            // Router no topo
            {
                id: 'router-1',
                name: 'Router',
                model: 'Model XPTO',
                type: DeviceType.ROUTER,
                ports: [
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'switch-1', connectedToPort: 'GE 1/0/1' },
                    { portName: 'GE 1/0/2', connectedToDeviceId: 'switch-2', connectedToPort: 'GE 2/0/1' },
                    { portName: 'GE 1/0/3', connectedToDeviceId: 'ap-7', connectedToPort: 'GE 1/0/1' }
                ]
            },
            // Switches no nível intermediário
            {
                id: 'switch-1',
                name: 'SWITCH - 01',
                model: 'Model 123ABC',
                type: DeviceType.SWITCH,
                ports: [
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'router-1', connectedToPort: 'GE 1/0/1' },
                    { portName: 'GE 1/0/2', connectedToDeviceId: 'ap-2', connectedToPort: 'GE 1/0/1' },
                    { portName: 'GE 1/0/3', connectedToDeviceId: 'ap-3', connectedToPort: 'GE 1/0/1' },
                    { portName: 'GE 1/0/4', connectedToDeviceId: 'ap-4', connectedToPort: 'GE 1/0/1' }
                ]
            },
            {
                id: 'switch-2',
                name: 'SWITCH - 02',
                model: 'Model 123ABC',
                type: DeviceType.SWITCH,
                ports: [
                    { portName: 'GE 2/0/1', connectedToDeviceId: 'router-1', connectedToPort: 'GE 1/0/2' },
                    { portName: 'GE 7/0/2', connectedToDeviceId: 'ap-1', connectedToPort: 'GE 7/0/2' },
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'ap-5', connectedToPort: 'GE 1/0/1' },
                    { portName: 'GE 1/0/2', connectedToDeviceId: 'ap-6', connectedToPort: 'GE 1/0/1' }
                ]
            },
            // Access Points no nível inferior
            {
                id: 'ap-1',
                name: 'AP - 01',
                model: 'MODEL FOOBAR',
                type: DeviceType.ACCESS_POINT,
                ports: [
                    { portName: 'GE 2/0/2', connectedToDeviceId: 'switch-2', connectedToPort: 'GE 2/0/2' }
                ]
            },
            {
                id: 'ap-2',
                name: 'AP - 02',
                model: 'MODEL FOOBAR',
                type: DeviceType.ACCESS_POINT,
                ports: [
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'switch-1', connectedToPort: 'GE 1/0/2' }
                ]
            },
            {
                id: 'ap-3',
                name: 'AP - 03',
                model: 'MODEL FOOBAR',
                type: DeviceType.ACCESS_POINT,
                ports: [
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'switch-1', connectedToPort: 'GE 1/0/3' }
                ]
            },
            {
                id: 'ap-4',
                name: 'AP - 04',
                model: 'MODEL FOOBAR',
                type: DeviceType.ACCESS_POINT,
                ports: [
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'switch-1', connectedToPort: 'GE 1/0/4' }
                ]
            },
            {
                id: 'ap-5',
                name: 'AP - 05',
                model: 'MODEL FOOBAR',
                type: DeviceType.ACCESS_POINT,
                ports: [
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'switch-2', connectedToPort: 'GE 1/0/1' }
                ]
            },
            {
                id: 'ap-6',
                name: 'AP - 06',
                model: 'MODEL FOOBAR',
                type: DeviceType.ACCESS_POINT,
                ports: [
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'switch-2', connectedToPort: 'GE 1/0/2' }
                ]
            },
            // Access Point conectado diretamente ao router (nível 2)
            {
                id: 'ap-7',
                name: 'AP - 07',
                model: 'MODEL FOOBAR',
                type: DeviceType.ACCESS_POINT,
                ports: [
                    { portName: 'GE 1/0/1', connectedToDeviceId: 'router-1', connectedToPort: 'GE 1/0/3' }
                ]
            }
        ];
    }
    
    /**
     * Calcula posições dos nós baseado na hierarquia
     */
    private calculateLayout(): void {
        const layers = this.groupNodesByType();
        const verticalSpacing = 220;
        const horizontalSpacing = 250;
        
        let currentY = 80;
        
        // Router (topo)
        if (layers.routers.length > 0) {
            const totalWidth = layers.routers.length * this.nodeWidth + (layers.routers.length - 1) * horizontalSpacing;
            let currentX = (this.svgWidth - totalWidth) / 2;
            
            layers.routers.forEach(node => {
                node.position = { x: currentX, y: currentY };
                currentX += this.nodeWidth + horizontalSpacing;
            });
            
            currentY += verticalSpacing;
        }
        
        // Nível 2: Switches e APs conectados diretamente ao router
        const level2Nodes = this.getLevel2Nodes(layers.switches, layers.accessPoints);
        if (level2Nodes.length > 0) {
            const totalWidth = level2Nodes.length * this.nodeWidth + (level2Nodes.length - 1) * horizontalSpacing;
            let currentX = (this.svgWidth - totalWidth) / 2;
            
            level2Nodes.forEach(node => {
                node.position = { x: currentX, y: currentY };
                currentX += this.nodeWidth + horizontalSpacing;
            });
            
            currentY += verticalSpacing;
        }
        
        // Nível 3: Access Points conectados aos switches (base)
        const level3APs = this.getLevel3AccessPoints(layers.accessPoints);
        if (level3APs.length > 0) {
            const apSpacing = 60;
            const groupSpacing = 120; // Espaço entre grupos de APs
            
            // Agrupa APs por switch ao qual estão conectados
            const apGroups = this.groupAPsBySwitch(level3APs, layers.switches);
            
            // Calcula largura total incluindo espaçamento entre grupos
            const totalWidth = level3APs.length * this.nodeWidth + 
                              (level3APs.length - 1) * apSpacing +
                              (apGroups.length - 1) * groupSpacing;
            
            let currentX = (this.svgWidth - totalWidth) / 2;
            
            // Posiciona cada grupo de APs
            apGroups.forEach((group, groupIndex) => {
                group.forEach(node => {
                    node.position = { x: currentX, y: currentY };
                    currentX += this.nodeWidth + apSpacing;
                });
                
                // Adiciona espaço extra entre grupos (exceto após o último)
                if (groupIndex < apGroups.length - 1) {
                    currentX += groupSpacing;
                }
            });
        }
    }
    
    /**
     * Agrupa nós por tipo de dispositivo
     */
    private groupNodesByType(): { routers: TopologyNode[], switches: TopologyNode[], accessPoints: TopologyNode[] } {
        return {
            routers: this.nodes.filter(n => n.type === DeviceType.ROUTER),
            switches: this.nodes.filter(n => n.type === DeviceType.SWITCH),
            accessPoints: this.nodes.filter(n => n.type === DeviceType.ACCESS_POINT)
        };
    }
    
    /**
     * Retorna nós do nível 2: Switches + APs conectados diretamente ao router
     */
    private getLevel2Nodes(switches: TopologyNode[], accessPoints: TopologyNode[]): TopologyNode[] {
        const routers = this.nodes.filter(n => n.type === DeviceType.ROUTER);
        const routerIds = routers.map(r => r.id);
        
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
        const routers = this.nodes.filter(n => n.type === DeviceType.ROUTER);
        const routerIds = routers.map(r => r.id);
        
        // APs que NÃO estão conectados diretamente ao router
        return accessPoints.filter(ap => {
            return !ap.ports.some(port => routerIds.includes(port.connectedToDeviceId));
        });
    }
    
    /**
     * Agrupa Access Points pelo switch ao qual estão conectados
     */
    private groupAPsBySwitch(aps: TopologyNode[], switches: TopologyNode[]): TopologyNode[][] {
        const groups: TopologyNode[][] = [];
        
        // Para cada switch, encontra os APs conectados a ele
        switches.forEach(switchNode => {
            const connectedAPs = aps.filter(ap => {
                return ap.ports.some(port => port.connectedToDeviceId === switchNode.id);
            });
            
            if (connectedAPs.length > 0) {
                groups.push(connectedAPs);
            }
        });
        
        // Adiciona APs não conectados em um grupo separado (se houver)
        const unconnectedAPs = aps.filter(ap => {
            return !ap.ports.some(port => 
                switches.some(sw => sw.id === port.connectedToDeviceId)
            );
        });
        
        if (unconnectedAPs.length > 0) {
            groups.push(unconnectedAPs);
        }
        
        return groups;
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
        const fromNode = this.nodes.find(n => n.id === connection.fromDevice);
        if (!fromNode || !fromNode.position) return { x: 0, y: 0 };
        
        const point = this.getNodeBottomCenter(fromNode);
        return { x: point.x - 30, y: point.y + 15 };
    }
    
    /**
     * Retorna a posição para o label da porta de destino
     */
    getToPortLabelPosition(connection: TopologyConnection): { x: number, y: number } {
        const toNode = this.nodes.find(n => n.id === connection.toDevice);
        if (!toNode || !toNode.position) return { x: 0, y: 0 };
        
        const point = this.getNodeTopCenter(toNode);
        return { x: point.x - 30, y: point.y - 5 };
    }
    
    /**
     * Retorna a classe CSS baseada no tipo de dispositivo
     */
    getDeviceClass(type: DeviceType): string {
        switch (type) {
            case DeviceType.ROUTER:
                return 'device-router';
            case DeviceType.SWITCH:
                return 'device-switch';
            case DeviceType.ACCESS_POINT:
                return 'device-ap';
            default:
                return '';
        }
    }
    
    /**
     * Retorna o ícone PrimeIcons baseado no tipo de dispositivo
     */
    getDeviceIcon(type: DeviceType): string {
        switch (type) {
            case DeviceType.ROUTER:
                return 'pi pi-server';
            case DeviceType.SWITCH:
                return 'pi pi-sitemap';
            case DeviceType.ACCESS_POINT:
                return 'pi pi-wifi';
            default:
                return 'pi pi-box';
        }
    }
    
    /**
     * Retorna a imagem PNG baseada no tipo de dispositivo
     */
    getDeviceImage(type: DeviceType): string {
        switch (type) {
            case DeviceType.ROUTER:
                return 'assets/imgs/router.png';
            case DeviceType.SWITCH:
                return 'assets/imgs/switche.png';
            case DeviceType.ACCESS_POINT:
                return 'assets/imgs/ap.png';
            default:
                return '';
        }
    }
    
    /**
     * Retorna o nome do tipo de dispositivo formatado
     */
    getDeviceTypeName(type: DeviceType): string {
        switch (type) {
            case DeviceType.ROUTER:
                return 'Roteador';
            case DeviceType.SWITCH:
                return 'Switch';
            case DeviceType.ACCESS_POINT:
                return 'Access Point';
            default:
                return 'Dispositivo';
        }
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
        const svgRect = this.svgElement.nativeElement.getBoundingClientRect();
        const containerRect = this.svgElement.nativeElement.parentElement.getBoundingClientRect();
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
            const svg = this.svgElement.nativeElement as SVGElement;
            
            // Clona o SVG para não afetar o original
            const svgClone = svg.cloneNode(true) as SVGElement;
            
            // Remove o transform do grupo principal para exportar sem zoom/pan
            const mainGroup = svgClone.querySelector('g[transform]');
            if (mainGroup) {
                mainGroup.removeAttribute('transform');
            }
            
            // Converte todas as imagens para base64
            const images = svgClone.querySelectorAll('image');
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
            
            // Aguarda todas as imagens serem convertidas
            await Promise.all(imagePromises);
            
            // Serializa o SVG
            const serializer = new XMLSerializer();
            let svgString = serializer.serializeToString(svgClone);
            
            // Adiciona namespace se não existir
            if (!svgString.includes('xmlns')) {
                svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            
            // Converte SVG para Data URL diretamente
            const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
            const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
            
            // Cria uma imagem a partir do SVG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            
            img.onload = () => {
                canvas.width = this.svgWidth;
                canvas.height = this.svgHeight;
                
                if (ctx) {
                    // Fundo branco
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Desenha o SVG
                    ctx.drawImage(img, 0, 0);
                    
                    // Converte canvas para imagem
                    const imgData = canvas.toDataURL('image/png');
                    
                    // Cria o PDF
                    const pdf = new jsPDF({
                        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [canvas.width, canvas.height]
                    });
                    
                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                    pdf.save('topologia-de-rede.pdf');
                }
            };
            
            img.onerror = (error) => {
                console.error('Erro ao carregar o SVG:', error);
                alert('Erro ao exportar o PDF. Tente novamente.');
            };
            
            // Usa Data URL em vez de Blob URL para evitar problemas de CORS
            img.src = svgDataUrl;
            
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao exportar o PDF. Tente novamente.');
        }
    }
}