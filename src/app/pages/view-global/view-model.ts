import { IncCloudDevice, ViewGlobalItem, WayosRouterInfo } from "../service/dtos/view-global.dtos";

export enum DeviceType {
    ROUTER = 'Router',
    SWITCH = 'Switch',
    ACCESS_POINT = 'Access Point',
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
    router: WayosRouterInfo;
    switches: IncCloudDevice[]; // devType === 'SWITCH'
    aps: IncCloudDevice[]; // devType === 'CLOUDAP'

    constructor(value: ViewGlobalItem, refreshedAt: string) {
        this.refreshedAt = refreshedAt ? new Date(refreshedAt) : null;
        this.inep = value.inep;
        this.router = value.router;
        this.switches = value.switches;
        this.aps = value.aps;
    }

    get city(): string {
        // Extraia a cidade do INEP ou retorne 'n/d' se não disponível
        return 'n/d';
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

    public hasOfflineDevices(): boolean {
        return !this.router.online ||
            this.switches.some(sw => !sw.online) ||
            this.aps.some(ap => !ap.online);
    }

    public hasOfflineDevicesByType(deviceType: DeviceType): boolean {
        if (deviceType === DeviceType.ROUTER) {
            return !this.router.online;
        } else if (deviceType === DeviceType.SWITCH) {
            return this.switches.some(sw => !sw.online);
        } else if (deviceType === DeviceType.ACCESS_POINT) {
            return this.aps.some(ap => !ap.online);
        } else {
            return false;
        }
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
}
