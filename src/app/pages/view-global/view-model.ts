import { IncCloudDevice, ViewGlobalItem, WayosRouterInfo } from "../service/dtos/view-global.dtos";

export enum DeviceType {
    ROUTER = 'Router',
    SWITCH = 'Switch',
    ACCESS_POINT = 'Access Point',
    ALL = 'All',
}

export enum DeviceStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    ALL = 'all',
}

export interface OfflineDevice {
    devType: DeviceType;
    name: string;
    inep: string;
    data: WayosRouterInfo | IncCloudDevice;
}

export class SiteModelView {
    refreshedAt: Date | null;
    inep: string;
    shopId: number;
    installedDevices: boolean;
    city: string;
    router: WayosRouterInfo;
    switches: IncCloudDevice[]; // devType === 'SWITCH'
    aps: IncCloudDevice[]; // devType === 'CLOUDAP'

    constructor(value: ViewGlobalItem, refreshedAt: string) {
        this.refreshedAt = refreshedAt ? new Date(refreshedAt) : null;
        this.inep = value.inep;
        this.shopId = value.shopId;
        this.installedDevices = value.installedDevices;
        this.city = value.city;
        this.router = value.router;
        this.switches = value.switches;
        this.aps = value.aps;
    }

    get onlineSwitches(): number {
        return this.switches.filter(sw => sw.online).length;
    }

    get totalSwitches(): number {
        return this.switches.length;
    }

    get onlineAccessPoints(): number {
        return this.aps.filter(ap => ap.online).length;
    }

    get totalAccessPoints(): number {
        return this.aps.length;
    }

    get routerIsOnline(): boolean {
        return this.router.online;
    }

    public isInstalled(): boolean {
        return this.installedDevices;
    }

    public isPhysicalDelivery(): boolean {
        return !this.installedDevices;
    }

    public hasOfflineDevices(): boolean {
        return !this.router.online ||
            this.switches.some(sw => !sw.online) ||
            this.aps.some(ap => !ap.online);
    }

    public getOfflineDevicesByType(deviceType: DeviceType): OfflineDevice[] {
        if (deviceType === DeviceType.ROUTER) {
            const route: OfflineDevice = {
                devType: DeviceType.ROUTER,
                name: this.router.model || 'Roteador',
                inep: this.inep,
                data: this.router,
            }
            return this.router.online ? [] : [route];
        } else if (deviceType === DeviceType.SWITCH) {
            return this.switches.filter(sw => !sw.online).map(sw => ({
                devType: DeviceType.SWITCH,
                name: sw.aliasName || 'Switch',
                inep: this.inep,
                data: sw,
            } as OfflineDevice));
        } else if (deviceType === DeviceType.ACCESS_POINT) {
            return this.aps.filter(ap => !ap.online).map(ap => ({
                devType: DeviceType.ACCESS_POINT,
                name: ap.aliasName || 'Access Point',
                inep: this.inep,
                data: ap,
            } as OfflineDevice));
        } else {
            return [];
        }
    }

    /**
     * @description Converte os dados do site em um array de objetos para exportação CSV
     * @returns Array de objetos representando as linhas de dados para exportação CSV 
     */
    public toFlatTableData(deviceType: DeviceType = DeviceType.ALL, status: DeviceStatus = DeviceStatus.ALL): FlatDataRow[] {
        const rows: FlatDataRow[] = [];

        // Adicionar o roteador
        if (deviceType === DeviceType.ROUTER || deviceType === DeviceType.ALL) {
            if (status === DeviceStatus.ALL || (status === DeviceStatus.ONLINE && this.router.online) || (status === DeviceStatus.OFFLINE && !this.router.online)) {
                rows.push({
                    'INEP': this.inep,
                    'Online Status': this.router.online ? 'Online' : 'Offline',
                    'Device Type': DeviceType.ROUTER,
                    'Device SN': this.router.sn || 'N/A',
                    'LAN Port MAC': this.router.lanMac || 'N/A',
                });
            }
        }

        // Adicionar os switches
        if (deviceType === DeviceType.SWITCH || deviceType === DeviceType.ALL) {
            this.switches.forEach(switche => {
                if (status === DeviceStatus.ALL || (status === DeviceStatus.ONLINE && switche.online) || (status === DeviceStatus.OFFLINE && !switche.online)) {
                    rows.push({
                        'INEP': this.inep,
                        'Online Status': switche.online ? 'Online' : 'Offline',
                        'Device Type': DeviceType.SWITCH,
                        'Device SN': switche.sn || 'N/A',
                        'LAN Port MAC': 'N/A', // Switches não possuem LAN Port MAC no IncCloudDevice
                    });
                }
            });
        }

        // Adicionar os access points
        if (deviceType === DeviceType.ACCESS_POINT || deviceType === DeviceType.ALL) {
            this.aps.forEach(ap => {
                if (status === DeviceStatus.ALL || (status === DeviceStatus.ONLINE && ap.online) || (status === DeviceStatus.OFFLINE && !ap.online)) {
                    rows.push({
                        'INEP': this.inep,
                        'Online Status': ap.online ? 'Online' : 'Offline',
                        'Device Type': DeviceType.ACCESS_POINT,
                        'Device SN': ap.sn || 'N/A',
                        'LAN Port MAC': 'N/A', // Access Points não possuem LAN Port MAC no IncCloudDevice
                    });
                }
            });
        }

        return rows;
    }
}

export interface FlatDataRow {
    'INEP': string;
    'Online Status': string;
    'Device Type': string;
    'Device SN': string;
    'LAN Port MAC': string;
}
