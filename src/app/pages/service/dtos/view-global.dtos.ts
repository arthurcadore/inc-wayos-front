export interface WayosRouterInfo {
    inep: string;
    sceneId: number;
    sn: string;
    model: string | null;
    wanIp: string | null;
    lanIp: string | null;
    lanMac: string | null;
    online: boolean;
}

export interface IncCloudDevice {
    devType: string;
    sn: string;
    online: boolean;
    onlineTime: number;
    firstOnlineTime: number;
    aliasName: string;
    devIp: string;
}

export interface ViewGlobalItem {
    inep: string;
    city: string;
    router: WayosRouterInfo;
    switches: IncCloudDevice[]; // devType === 'SWITCH'
    aps: IncCloudDevice[]; // devType === 'CLOUDAP'
}

export interface ViewGlobalResponse {
    refreshedAtFormat: string; // Propriedade adicional para formato legível
    refreshedAt: string;

    totalRouters: number;
    onlineRouters: number;

    totalSwitches: number;
    onlineSwitches: number;

    totalAps: number;
    onlineAps: number;

    data: ViewGlobalItem[];
}
