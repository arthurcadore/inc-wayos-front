import { version } from '../../package.json';

export const environment = {
    production: false,
    name: 'homologation',
    apiUrl: 'https://hml-api.eace.com.br/api',
    enableDebug: true,
    logLevel: 'info',
    viewGlobalCacheTtlMinutes: 5,
    refreshIntervalMinutes: 5,
    viewGlobalExportFileName: 'view-global_',
    offlineDevicesExportFileName: 'offline-devices_',
    connectedDevicesExportFileName: 'online-devices_',
    alarmLogsExportFileName: 'alarm-logs_',
    version,
};
