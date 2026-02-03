import { LifelineItem } from "@/pages/service/dtos/lifeline.dto";
import { EaceService } from "@/pages/service/eace.service";
import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";

@Component({
    selector: 'app-lifeline',
    standalone: true,
    imports: [
        CommonModule,
    ],
    providers: [],
    templateUrl: './lifeline.html',
    styleUrls: ['./lifeline.scss'],
})
export class Lifeline implements OnInit, OnDestroy {
    @Input() deviceSn: string = '';
    @Input() monthsToShow: number = 1;

    isLoading: boolean = false;
    private subscription: any = null;

    data: LifelineItem[] = [];
    hoveredItem: LifelineItem | null = null;
    popupPosition = { x: 0 };

    constructor(
        private readonly eaceService: EaceService
    ) { }

    onItemHover(event: MouseEvent, item: LifelineItem): void {
        this.hoveredItem = item;
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const parentRect = target.parentElement?.getBoundingClientRect();
        
        if (parentRect) {
            this.popupPosition = {
                x: rect.left - parentRect.left + (rect.width / 2)
            };
        }
    }

    onItemLeave(): void {
        this.hoveredItem = null;
    }

    async loadData() {
        this.isLoading = true;
        this.subscription = this.eaceService.getLifelineData(this.deviceSn, this.monthsToShow).subscribe({
            next: (data) => {
                for (let item of data) {
                    item.typeName = this.parserTypeName(item.type);
                    item.statusName = this.parseStatusName(item.type);
                }
                this.data = data;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading lifeline data', err);
            },
            complete: () => {
                this.isLoading = false;
            },
        });
    }

    private parserTypeName(type: number): string {
        switch (type) {
            case 0:
                return 'green';
            case 1:
                return 'yellow';
            case 2:
                return 'red';
            default:
                return 'unknown';
        }
    }

    private parseStatusName(type: number): string {
        switch (type) {
            case 0:
                return 'Operação Normal';
            case 1:
                return 'Baixo Trafego';
            case 2:
                return 'Sem Comunicação';
            default:
                return 'unknown';
        }
    }

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}