import { version } from '../../package.json';

export const environment = {
    production: true,
    name: 'production',
    apiUrl: '/api', 
    enableDebug: false,
    logLevel: 'error',
    viewGlobalCacheTtlMinutes: 5,
    refreshIntervalMinutes: 5,
    viewGlobalExportFileName: 'view-global_',
    offlineDevicesExportFileName: 'offline-devices_',
    connectedDevicesExportFileName: 'online-devices_',
    version,
};
