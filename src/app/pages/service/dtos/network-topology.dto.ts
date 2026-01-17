export enum DeviceType {
    ROUTER = 'ROUTER',
    SWITCH = 'SWITCH',
    ACCESS_POINT = 'ACCESS_POINT',
    STATION = 'STATION'
}

export interface PortConnection {
    portName: string;
    connectedToDeviceId: string;
    connectedToPort: string;
}

export interface TopologyNode {
    id: string;
    name: string;
    model: string;
    type: DeviceType;
    ports: PortConnection[];

    sn?: string;
    mac?: string;
    isOnline?: boolean;
    manageIp?: string;
    portInfo?: {
        [propName: string]: {
            ifName: string;
            ifIndex: number;
            actualSpeed: string;
            actualDuplex: string;
            linkType: string;
            description: string;
            vlan: string;
            operStatus: number;
            inetAddressIPV4: any;
            groupMembers: any;
        };
    }

    // Propriedades que pertencem à visualização
    image?: string;
    position?: { x: number; y: number };
}
