export enum WayosAlarmType {
    DEV_ONLINE = 'dev_online',
    DEV_OFFLINE = 'dev_offline',
    DEV_ATTACKED = 'dev_attacked',
}

export interface WayosAlarmLogItem {
    id: string;
    create_at: string;
    update_at: string;
    happen_at: string;
    scene_id: number;
    sn: string;
    level: number;
    type: WayosAlarmType;
    msg: string;
    status: number;
    pushed: boolean;
}

export interface RegionDevice {
    regionId: number;
    regionName: string;
    shopId: number;
    shopName: string;
    deviceId: number;
    devAlias: string;
    customType: string;
    devModel: string;
    devType: number;
    devSn: string;
    url: string;
    status: number;
    devVer: string;
    softVer: string;
    versionNum: number;
    oldVer: string;
    verUpdateTime: number;
    verUpdateStatus: number;
    hardVer: string;
    powerOnTime: number;
    groupId: number;
    groupName: string;
    groupType: number;
    macAddr: string;
    addTime: number;
    firstOnlineTime: number;
    wifiStatus: string;
    rzxAuditStatus: string;
    xrAuditStatus: string;
    probeStatus: string;
    dpiStatus: string;
    versionList: any[];
    devIp: string;
    devBindStatus: any;
    devQR: any;
    devDesc: any;
    onlineTime: number;
    customTypeStr: string;
    verUpdateTimeStr: string;
    powerOnTimeStr: string;
    powerOnDurationStr: string;
    onlineTimeStr: string;
    onlineDurationStr: string;
    offlineTime: number;
    offlineTimeStr: string;
    offlineDurationStr: string;
    addTimeStr: string;
    firstOnlineTimeStr: string;
}

export interface AlarmCommentViewModel {
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
    editedAt: string | null;
}

export interface AlarmViewModel {
    id: string;
    title: string;
    isSolved: boolean;
    createdAt: string;
    updatedAt: string;
    comments: AlarmCommentViewModel[];

    // Campos adicionais para exibição
    collapsed?: boolean;
}
