// Este arquivo será substituído durante o build
// O CLI do Angular substituirá environment.ts pelo arquivo específico do ambiente
import { version } from '../../package.json';

export const environment = {
    production: false,
    name: 'development',
    apiUrl: 'http://localhost:3000/api',
    enableDebug: true,
    logLevel: 'debug',
    viewGlobalCacheTtlMinutes: 5,
    refreshIntervalMinutes: 5,
    viewGlobalExportFileName: 'view-global_',
    offlineDevicesExportFileName: 'offline-devices_',
    connectedDevicesExportFileName: 'online-devices_',
    version,
};
