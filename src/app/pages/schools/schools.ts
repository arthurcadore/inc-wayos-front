import { Component, OnInit } from '@angular/core';
import { SchoolService, School } from '../../services/school.service';

@Component({
    selector: 'app-schools',
    standalone: true,
    template: `
        <div class="card">
            <h1>Escolas</h1>
            <p>Conteúdo da página de escolas.</p>
        </div>
    `,
})
export class Schools implements OnInit {
    schools: School[] = [];
    loading = false;

    constructor(private schoolService: SchoolService) {}

    ngOnInit() {
        this.loadSchools();
    }

    // Exemplo de método para carregar escolas
    loadSchools() {
        this.loading = true;
        this.schoolService.getSchools().subscribe({
            next: (data) => {
                this.schools = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erro ao carregar escolas:', error);
                this.loading = false;
            }
        });
    }

    // Exemplo de método para visualizar detalhes de uma escola
    viewSchool(id: number) {
        this.loading = true;
        this.schoolService.getSchoolById(id).subscribe({
            next: (school) => {
                console.log('Escola:', school);
                alert(`Escola: ${school.name}\nCidade: ${school.city}\nEstado: ${school.state}`);
                this.loading = false;
            },
            error: (error) => {
                console.error('Erro ao carregar escola:', error);
                alert('Erro ao carregar detalhes da escola');
                this.loading = false;
            }
        });
    }
}