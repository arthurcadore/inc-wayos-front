import { HttpService } from "@/services/http.service";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { ViewGlobalResponse } from "./dtos/view-global.dtos";
import { WayosAlarmLogItem } from "./dtos/alarm-log.dto";

@Injectable({
    providedIn: 'root'
})
export class EaceService {
    private readonly CACHE_KEY = 'view_global_cache';
    private readonly CACHE_TIMESTAMP_KEY = 'view_global_cache_timestamp';

    constructor(private httpService: HttpService) {}

    public getLastMomentOffline(sceneId: number): Observable<WayosAlarmLogItem[]> {
        return this.httpService.get<WayosAlarmLogItem[]>(`/v1/alarm-logs/last-moment-offline/${sceneId}`).pipe(
            tap(data => {
                if (environment.enableDebug) {
                    console.log('[EaceService] Fetched last moment offline data:', data);
                }
            })
        );
    }

    /**
     * Obtém dados globais da visualização com cache local
     * @returns 
     */
    public getViewGlobalData(): Observable<ViewGlobalResponse> {
        // Verifique se o cache está habilitado no ambiente
        if (!environment.enableCache) {
            if (environment.enableDebug) {
                console.log('[EaceService] Cache disabled in environment');
            }
            return this.httpService.get<ViewGlobalResponse>('/v1/view-global');
        }

        // Verifique se temos dados em cache válidos.
        const cachedData = this.getCachedData();
        if (cachedData) {
            if (environment.enableDebug) {
                console.log('[EaceService] Returning cached data');
            }
            cachedData.refreshedAtFormat = new Date(cachedData.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - (do cache)';
            return of(cachedData);
        }

        // Nenhum cache válido, buscar da API
        if (environment.enableDebug) {
            console.log('[EaceService] Cache miss or expired, fetching from API');
        }

        return this.httpService.get<ViewGlobalResponse>('/v1/view-global').pipe(
            tap(data => {
                data.refreshedAtFormat = new Date(data.refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                this.setCachedData(data);
            })
        );
    }

    /**
     * Obtenha dados em cache se existirem e ainda forem válidos
     */
    private getCachedData(): ViewGlobalResponse | null {
        try {
            const cachedDataStr = localStorage.getItem(this.CACHE_KEY);
            const cacheTimestampStr = localStorage.getItem(this.CACHE_TIMESTAMP_KEY);

            if (!cachedDataStr || !cacheTimestampStr) {
                return null;
            }

            // Verifique se o cache ainda é válido com base no TTL
            if (!this.isCacheValid(parseInt(cacheTimestampStr))) {
                if (environment.enableDebug) {
                    console.log('[EaceService] Cache expired, clearing...');
                }
                this.clearCache();
                return null;
            }

            return JSON.parse(cachedDataStr);
        } catch (error) {
            if (environment.enableDebug) {
                console.error('[EaceService] Error reading cache:', error);
            }
            this.clearCache();
            return null;
        }
    }

    /**
     * Salva dados no cache do localStorage
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
     * Verifique se os dados em cache ainda são válidos com base no TTL
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

    /**
     * Limpa o cache manualmente
     */
    public clearViewGlobalCache(): void {
        this.clearCache();
        if (environment.enableDebug) {
            console.log('[EaceService] Cache cleared manually');
        }
    }

    /**
     * Remove cache do localStorage
     */
    private clearCache(): void {
        localStorage.removeItem(this.CACHE_KEY);
        localStorage.removeItem(this.CACHE_TIMESTAMP_KEY);
    }
}

