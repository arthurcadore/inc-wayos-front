import { HttpService } from "@/services/http.service";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { ViewGlobalResponse } from "./dtos/view-global.dtos";
import { AlarmViewModel, RegionDevice, WayosAlarmLogItem } from "./dtos/alarm-log.dto";
import { WayosGetDeviceOnlineUser } from "./dtos/connected-devices.dto";
import { TopologyNode } from "./dtos/network-topology.dto";
import { WayosGetDeviceInfo } from "./dtos/wayos.dto";
import { LifelineItem } from "./dtos/lifeline.dto";

@Injectable({
    providedIn: 'root'
})
export class EaceService {
    private readonly CACHE_KEY = 'view_global_cache';
    private readonly CACHE_TIMESTAMP_KEY = 'view_global_cache_timestamp';

    constructor(private httpService: HttpService) { }

    /**
     * @description Obtém os dados da linha do tempo (lifeline) para um dispositivo específico
     * @param sn Número de série do dispositivo
     * @param daysRange Intervalo de dias para os dados da linha do tempo
     * @returns Observable com os dados da linha do tempo
     */
    getLifelineData(sn: string, daysRange: number): Observable<LifelineItem[]> {
        return this.httpService.get<LifelineItem[]>(`/v1/lifeline-data/sn/${sn}/days-range/${daysRange}`).pipe(
            tap(data => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Fetched lifeline data:', data);
                }
            })
        );
    }

    /**
     * @description Obtém informações detalhadas de um dispositivo Wayos com base no número de série
     * @param sn Número de série do dispositivo
     * @returns Observable com as informações do dispositivo
     */
    public getWayosDeviceInfo(sn: string): Observable<WayosGetDeviceInfo> {
        return this.httpService.get<any>(`/v1/wayos-device-info/${sn}`).pipe(
            tap(data => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Fetched device info:', data);
                }
            })
        );
    }

    /**
     * @description Obtém os dados da topologia de rede para uma loja específica
     * @param shopId ID da loja
     * @returns Observable com os dados da topologia de rede
     */
    public getNetworkTopologyData(shopId: number): Observable<TopologyNode[]> {
        return this.httpService.get<TopologyNode[]>(`/v1/network-topology/${shopId}`).pipe(
            tap(data => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Fetched network topology data:', data);
                }
            })
        );
    }

    /**
     * @description Marca um alarme como resolvido
     * @param alarm Alarme a ser resolvido
     */
    public toogleAlarmSolved(alarm: AlarmViewModel): Observable<void> {
        return this.httpService.patch<void>(`/v1/alarm/toogle-alarm-solved`, { alarmId: alarm.id }).pipe(
            tap(() => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Alarm solved for alarmId:', alarm.id);
                }
            })
        );
    }

    /**
     * @description Deleta um comentário específico de um alarme
     * @param alarmId ID do alarme
     * @param alarmCommentId ID do comentário do alarme
     */
    public deleteComment({ alarmId, alarmCommentId }: { alarmId: string, alarmCommentId: string }): Observable<void> {
        return this.httpService.delete<void>(`/v1/alarm/alarm-comments/alarmId/${alarmId}/alarmCommentId/${alarmCommentId}`).pipe(
            tap(() => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Comment deleted');
                }
            })
        );
    }

    /**
     * @description Atualiza um comentário existente para um alarme específico
     * @param alarmId ID do alarme
     * @param alarmCommentId ID do comentário do alarme
     * @param text Texto do comentário
     */
    public updateComment({ alarmId, alarmCommentId, text }: { alarmId: string, alarmCommentId: string, text: string }): Observable<void> {
        return this.httpService.patch<void>(`/v1/alarm/alarm-comments`, { alarmId, alarmCommentId, text }).pipe(
            tap(() => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Comment updated');
                }
            })
        );
    }

    /**
     * @description Cria um novo comentário para um alarme específico
     * @param alarmId ID do alarme
     * @param text Texto do comentário
     */
    public createComment({ alarmId, text }: { alarmId: string, text: string }): Observable<void> {
        return this.httpService.post<void>(`/v1/alarm/alarm-comments`, { text, alarmId }).pipe(
            tap(() => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Comment created for alarmId:', alarmId);
                }
            })
        );
    }

    /**
     * @description Obtém a lista de alarmes com base no tipo de dispositivo, valor e intervalo de dias
     * @param deviceType Tipo do dispositivo
     * @param value Valor do dispositivo (pode ser string ou number)
     * @param dayRange Intervalo de dias para filtrar os alarmes
     * @returns Observable com a lista de alarmes
     */
    public getAlarms(deviceType: string, value: number | string, dayRange: number): Observable<AlarmViewModel[]> {
        return this.httpService.get<AlarmViewModel[]>(`/v1/alarms/device-type/${deviceType}/value/${value}/day-range/${dayRange}`).pipe(
            tap(data => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Fetched alarms data:', data);
                }
            })
        );
    }

    /**
     * @description Obtém a lista de últimos momentos offline para dispositivos Wayos
     * @param sceneId ID da cena do dispositivo
     * @returns Observable com a lista de momentos offline
     */
    public getWayosLastOfflineMomentList(sceneId: number): Observable<WayosAlarmLogItem[]> {
        return this.httpService.get<WayosAlarmLogItem[]>(`/v1/wayos-last-offline-moment-list/${sceneId}`).pipe(
            tap(data => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Fetched last moment offline data:', data);
                }
            })
        );
    }

    /**
     * @description Obtém a lista de últimos momentos offline para dispositivos IncCloud
     * @param sn Número de série do dispositivo
     * @returns Observable com a lista de momentos offline
     */
    public getIncCloudLastOfflineMomentList(sn: string): Observable<RegionDevice[]> {
        return this.httpService.get<RegionDevice[]>(`/v1/inccloud-last-offline-moment-list/${sn}`).pipe(
            tap(data => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Fetched IncCloud last moment offline data:', data);
                }
            })
        );
    }

    /**
     * @description Obtém a lista de dispositivos conectados para um determinado dispositivo
     * @param sn Número de série do dispositivo
     * @returns Observable com a lista de dispositivos conectados
     */
    public getConnectedDevices(sn: string): Observable<WayosGetDeviceOnlineUser[]> {
        return this.httpService.get<WayosGetDeviceOnlineUser[]>(`/v1/connected-devices/${sn}`).pipe(
            tap(data => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Fetched connected devices data:', data);
                }
            })
        );
    }

    /**
     * @description Obtém os dados da visão global, utilizando cache localStorage para otimizar desempenho
     * @param ignoreCacheTimestamp Se verdadeiro, ignora o timestamp do cache e retorna os dados em cache diretamente
     * @returns Observable com os dados da visão global
     */
    public getViewGlobalData(ignoreCacheTimestamp: boolean = false): Observable<ViewGlobalResponse> {
        const cachedDataStr = localStorage.getItem(this.CACHE_KEY);
        const cacheTimestampStr = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);

        // Se não houver dados em cache, buscar da API
        if (!cachedDataStr || !cacheTimestampStr) {
            if (environment.enableDebug) {
                console.log('[EaceService] No cached data found, fetching from API');
            }

            return this.httpService.get<ViewGlobalResponse>('/v1/view-global').pipe(
                tap(data => {
                    data.refreshedAtFormat = new Date(data.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    this.setCachedData(data);
                })
            );
        }

        // Se ignorar timestamp de cache, retornar dados em cache diretamente
        if (ignoreCacheTimestamp) {
            if (environment.enableDebug) {
                console.log('[EaceService] Ignoring cache timestamp, returning cached data directly');
            }

            const cachedData = JSON.parse(cachedDataStr);
            cachedData.refreshedAtFormat = new Date(cachedData.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - (do cache)';
            return of(cachedData);
        }

        // Verifique se o cache ainda é válido
        if (this.isCacheValid(parseInt(cacheTimestampStr))) {
            if (environment.enableDebug) {
                console.log('[EaceService] Returning valid cached data');
            }

            const cachedData = JSON.parse(cachedDataStr);
            cachedData.refreshedAtFormat = new Date(cachedData.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - (do cache)';
            return of(cachedData);
        }

        // Cache expirado, buscar da API
        if (environment.enableDebug) {
            console.log('[EaceService] Cache expired, fetching from API');
        }
        
        return this.httpService.get<ViewGlobalResponse>('/v1/view-global').pipe(
            tap(data => {
                data.refreshedAtFormat = new Date(data.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                this.setCachedData(data);
            })
        );
    }

    /**
     * @description Salva dados no cache do localStorage
     * @param data Dados a serem armazenados
     */
    private setCachedData(data: ViewGlobalResponse): void {
        try {
            const timestamp = Date.now();
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(this.CACHE_TIMESTAMP_KEY, timestamp.toString());

            if (environment.enableDebug) {
                console.log('[EaceService] Data cached successfully at', new Date(timestamp).toISOString());
            }
        } catch (error) {
            if (environment.enableDebug) {
                console.error('[EaceService] Error setting cache:', error);
            }
        }
    }

    /**
     * @description Verifica se o cache ainda é válido com base no timestamp armazenado
     * @param timestamp Timestamp em milissegundos
     * @returns Verdadeiro se o cache for válido, falso caso contrário
     */
    private isCacheValid(timestamp: number): boolean {
        const now = Date.now();
        const ttlMs = environment.viewGlobalCacheTtlMinutes * 60 * 1000;
        const age = now - timestamp;

        if (environment.enableDebug) {
            const ageMinutes = Math.floor(age / 1000 / 60);
            console.log(`[EaceService] Cache age: ${ageMinutes} minutes, TTL: ${environment.viewGlobalCacheTtlMinutes} minutes`);
        }

        return age < ttlMs;
    }
}

