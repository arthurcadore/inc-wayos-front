import { HttpService } from "@/services/http.service";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface WayosRouterInfo {
    inep: string;
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
}

export interface ViewGlobalItem {
    inep: string;
    router: WayosRouterInfo;
    switches: IncCloudDevice[]; // devType === 'SWITCH'
    aps: IncCloudDevice[]; // devType === 'CLOUDAP'
}

export interface ViewGlobalResponse {
    refreshedAt: string;

    totalRouters: number;
    onlineRouters: number;

    totalSwitches: number;
    onlineSwitches: number;

    totalAps: number;
    onlineAps: number;

    data: ViewGlobalItem[];
}

@Injectable({
    providedIn: 'root'
})
export class EaceService {
    constructor(private httpService: HttpService) {}

    getViewGlobalData(): Observable<ViewGlobalResponse> {
        return this.httpService.get<ViewGlobalResponse>('/v1/view-global');
    }
}

