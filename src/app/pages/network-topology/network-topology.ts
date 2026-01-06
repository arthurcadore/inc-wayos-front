import { Component, OnDestroy, OnInit, ElementRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import jsPDF from 'jspdf';

export interface NetworkNode {
    id: string;
    description: string;
    parentId?: string;
}

export interface PositionedNode extends NetworkNode {
    x: number;
    y: number;
    level: number;
}

export interface NodeConnection {
    from: PositionedNode;
    to: PositionedNode;
}

@Component({
    selector: "app-network-topology",
    standalone: true,
    templateUrl: "./network-topology.html",
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        TooltipModule,
    ]
})
export class NetworkTopology implements OnInit, OnDestroy {
    @ViewChild('topologySvg', { static: false }) svgElement?: ElementRef<SVGElement>;
    
    topologyData: NetworkNode[] = [];
    positionedNodes: PositionedNode[] = [];
    connections: NodeConnection[] = [];
    
    // Configurações do SVG
    svgWidth = 1200;
    svgHeight = 800;
    nodeWidth = 140;
    nodeHeight = 80;
    levelHeight = 150;
    nodeGap = 20; // Espaçamento mínimo entre nós
    
    // Controles de zoom e pan
    scale = 1;
    translateX = 0;
    translateY = 0;
    
    // Controles de pan
    isPanning = false;
    isPanMode = false;
    lastMouseX = 0;
    lastMouseY = 0;
    
    selectedNode: PositionedNode | null = null;

    constructor() { }
    
    ngOnInit(): void {
        this.loadSampleData();
        this.calculateLayout();
    }
    
    ngOnDestroy(): void {
        // Cleanup logic here
    }
    
    private loadSampleData(): void {
        // Dados de exemplo para demonstração
        this.topologyData = [
            // Nível 0 - Roteador Principal
            { id: 'router-1', description: 'Roteador Principal\n192.168.0.1' },
            
            // Nível 1 - Dispositivos conectados ao roteador
            // Switches
            { id: 'switch-1', description: 'Switch Andar 1\n192.168.1.1', parentId: 'router-1' },
            { id: 'switch-2', description: 'Switch Andar 2\n192.168.2.1', parentId: 'router-1' },
            { id: 'switch-3', description: 'Switch Andar 3\n192.168.3.1', parentId: 'router-1' },
            // APs conectados diretamente ao roteador
            { id: 'ap-direct-1', description: 'AP Recepção\n192.168.0.10', parentId: 'router-1' },
            { id: 'ap-direct-2', description: 'AP Área Externa\n192.168.0.11', parentId: 'router-1' },
            // { id: 'ap-direct-3', description: 'AP Área Externa\n192.168.0.12', parentId: 'router-1' },
            // { id: 'ap-direct-4', description: 'AP Área Externa\n192.168.0.13', parentId: 'router-1' },
            // { id: 'ap-direct-5', description: 'AP Área Externa\n192.168.0.14', parentId: 'router-1' },
            // { id: 'ap-direct-6', description: 'AP Área Externa\n192.168.0.15', parentId: 'router-1' },
            
            // Nível 2 - Access Points conectados aos switches
            { id: 'ap-1', description: 'AP Sala 101\n192.168.1.10', parentId: 'switch-1' },
            { id: 'ap-2', description: 'AP Sala 102\n192.168.1.11', parentId: 'switch-1' },
            { id: 'ap-3', description: 'AP Sala 201\n192.168.2.10', parentId: 'switch-2' },
            { id: 'ap-4', description: 'AP Sala 202\n192.168.2.11', parentId: 'switch-2' },
            { id: 'ap-5', description: 'AP Sala 301\n192.168.3.10', parentId: 'switch-3' },
            { id: 'ap-6', description: 'AP Sala 302\n192.168.3.11', parentId: 'switch-3' },
        ];
    }
    
    private calculateLayout(): void {
        if (this.topologyData.length === 0) {
            return;
        }
        
        // Organizar nós por nível hierárquico
        const nodesByLevel = this.organizeByLevel();
        
        // Calcular largura necessária considerando o maior nível
        let maxRequiredWidth = this.svgWidth;
        nodesByLevel.forEach((nodes) => {
            const nodesCount = nodes.length;
            const requiredWidth = (nodesCount * this.nodeWidth) + ((nodesCount + 1) * this.nodeGap);
            maxRequiredWidth = Math.max(maxRequiredWidth, requiredWidth);
        });
        
        // Ajustar largura do SVG se necessário
        this.svgWidth = Math.max(this.svgWidth, maxRequiredWidth);
        
        // Calcular posições
        this.positionedNodes = [];
        nodesByLevel.forEach((nodes, level) => {
            const nodesCount = nodes.length;
            const totalNodesWidth = nodesCount * this.nodeWidth;
            const totalGapsWidth = (nodesCount + 1) * this.nodeGap;
            const rowWidth = totalNodesWidth + totalGapsWidth;
            
            // Centralizar a linha se for menor que a largura total
            const startX = (this.svgWidth - rowWidth) / 2 + this.nodeGap;
            
            nodes.forEach((node, index) => {
                const x = startX + (index * (this.nodeWidth + this.nodeGap)) + (this.nodeWidth / 2);
                const y = 100 + (level * this.levelHeight);
                
                this.positionedNodes.push({
                    ...node,
                    x,
                    y,
                    level
                });
            });
        });
        
        // Calcular conexões
        this.calculateConnections();
    }
    
    private organizeByLevel(): Map<number, NetworkNode[]> {
        const nodesByLevel = new Map<number, NetworkNode[]>();
        const nodeMap = new Map<string, NetworkNode>();
        const nodeLevels = new Map<string, number>();
        
        // Criar mapa de nós
        this.topologyData.forEach(node => {
            nodeMap.set(node.id, node);
        });
        
        // Calcular níveis recursivamente
        const calculateLevel = (nodeId: string): number => {
            if (nodeLevels.has(nodeId)) {
                return nodeLevels.get(nodeId)!;
            }
            
            const node = nodeMap.get(nodeId);
            if (!node || !node.parentId) {
                nodeLevels.set(nodeId, 0);
                return 0;
            }
            
            const level = calculateLevel(node.parentId) + 1;
            nodeLevels.set(nodeId, level);
            return level;
        };
        
        // Calcular nível de cada nó
        this.topologyData.forEach(node => {
            const level = calculateLevel(node.id);
            
            if (!nodesByLevel.has(level)) {
                nodesByLevel.set(level, []);
            }
            nodesByLevel.get(level)!.push(node);
        });
        
        return nodesByLevel;
    }
    
    private calculateConnections(): void {
        this.connections = [];
        
        this.positionedNodes.forEach(node => {
            if (node.parentId) {
                const parent = this.positionedNodes.find(n => n.id === node.parentId);
                if (parent) {
                    this.connections.push({ from: parent, to: node });
                }
            }
        });
    }
    
    getNodeIcon(node: PositionedNode): string {
        if (node.id.startsWith('router')) {
            return 'Roteador';
        } else if (node.id.startsWith('switch')) {
            return 'Switch';
        } else if (node.id.startsWith('ap')) {
            return 'AP';
        }
        return 'pi-circle';
    }
    
    getNodeColor(node: PositionedNode): string {
        if (node.id.startsWith('router')) {
            return '#3B82F6'; // blue-500
        } else if (node.id.startsWith('switch')) {
            return '#10B981'; // green-500
        } else if (node.id.startsWith('ap')) {
            return '#F59E0B'; // amber-500
        }
        return '#6B7280'; // gray-500
    }
    
    getTransform(): string {
        return `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`;
    }
    
    zoomIn(): void {
        this.scale = Math.min(this.scale * 1.2, 3);
    }
    
    zoomOut(): void {
        this.scale = Math.max(this.scale / 1.2, 0.5);
    }
    
    resetZoom(): void {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
    }
    
    togglePanMode(): void {
        this.isPanMode = !this.isPanMode;
    }
    
    onSvgMouseDown(event: MouseEvent): void {
        // Botão do meio do mouse (wheel) ou modo pan ativado com botão esquerdo
        if (event.button === 1 || (this.isPanMode && event.button === 0)) {
            event.preventDefault();
            this.isPanning = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }
    
    onSvgMouseMove(event: MouseEvent): void {
        if (this.isPanning) {
            event.preventDefault();
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;
            
            this.translateX += deltaX;
            this.translateY += deltaY;
            
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }
    
    onSvgMouseUp(event: MouseEvent): void {
        if (this.isPanning) {
            event.preventDefault();
            this.isPanning = false;
        }
    }
    
    onSvgMouseLeave(event: MouseEvent): void {
        if (this.isPanning) {
            this.isPanning = false;
        }
    }
    
    onNodeClick(node: PositionedNode, event: MouseEvent): void {
        // Não selecionar nó se estiver em modo pan ou arrastando
        if (!this.isPanning && !this.isPanMode) {
            event.stopPropagation();
            this.selectedNode = this.selectedNode?.id === node.id ? null : node;
        }
    }
    
    exportToPdf(): void {
        if (!this.svgElement) {
            console.error('SVG element not found');
            return;
        }
        
        const svgEl = this.svgElement.nativeElement.cloneNode(true) as SVGElement;
        
        // Garantir que o SVG tenha atributos de dimensão explícitos
        svgEl.setAttribute('width', this.svgWidth.toString());
        svgEl.setAttribute('height', this.svgHeight.toString());
        
        // Serializar SVG
        let svgData = new XMLSerializer().serializeToString(svgEl);
        
        // Adicionar namespace XML se não existir
        if (!svgData.includes('xmlns="http://www.w3.org/2000/svg"')) {
            svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        // Criar canvas temporário
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
        
        // Configurar dimensões do canvas (alta qualidade)
        const scaleFactor = 2;
        canvas.width = this.svgWidth * scaleFactor;
        canvas.height = this.svgHeight * scaleFactor;
        
        // Criar imagem do SVG usando data URL
        const img = new Image();
        
        img.onload = () => {
            // Fundo branco
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Desenhar SVG no canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Converter canvas para imagem
            const imgData = canvas.toDataURL('image/png');
            
            // Calcular dimensões do PDF (converter pixels para mm)
            // 96 DPI = 1 pixel = 0.264583 mm
            const pdfWidth = this.svgWidth * 0.264583;
            const pdfHeight = this.svgHeight * 0.264583;
            
            // Criar PDF com dimensões personalizadas
            const pdf = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });
            
            // Adicionar imagem ao PDF
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // Salvar PDF
            pdf.save(`topologia-rede-${new Date().getTime()}.pdf`);
        };
        
        img.onerror = (error) => {
            console.error('Error loading SVG image:', error);
        };
        
        // Usar data URL em vez de blob URL para evitar problemas de CORS
        const encodedData = encodeURIComponent(svgData);
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodedData;
    }
}