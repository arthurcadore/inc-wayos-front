import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface School {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    phone?: string;
    email?: string;
    createdAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SchoolService {
    constructor(private httpService: HttpService) {}

    /**
     * Busca todas as escolas
     */
    getSchools(): Observable<School[]> {
        return this.httpService.get<School[]>('/schools');
    }

    /**
     * Busca uma escola por ID
     */
    getSchoolById(id: number): Observable<School> {
        return this.httpService.get<School>(`/schools/${id}`);
    }

    /**
     * Busca escolas com filtros
     */
    getSchoolsWithFilters(filters: { city?: string; state?: string; name?: string }): Observable<School[]> {
        let params = new HttpParams();
        
        if (filters.city) {
            params = params.set('city', filters.city);
        }
        if (filters.state) {
            params = params.set('state', filters.state);
        }
        if (filters.name) {
            params = params.set('name', filters.name);
        }

        return this.httpService.get<School[]>('/schools', params);
    }

    /**
     * Cria uma nova escola
     */
    createSchool(school: Omit<School, 'id'>): Observable<School> {
        return this.httpService.post<School>('/schools', school);
    }

    /**
     * Atualiza uma escola
     */
    updateSchool(id: number, school: Partial<School>): Observable<School> {
        return this.httpService.put<School>(`/schools/${id}`, school);
    }

    /**
     * Deleta uma escola
     */
    deleteSchool(id: number): Observable<void> {
        return this.httpService.delete<void>(`/schools/${id}`);
    }
}
