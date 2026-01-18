export interface WayosGetDeviceInfo {
    login_at: string;
    logout_at: string;
    sn: string;
    name: string;
    online: boolean;
    model: string;
    sversion: string;
    plat: string;
    wan_ip: string;
    lan_ip: string;
    lan_mac: string;
    http_port: number;
    telnet_port: number;
    with_wifi: boolean;
    with_wifi_5g: boolean;
}