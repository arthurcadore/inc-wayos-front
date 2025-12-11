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
