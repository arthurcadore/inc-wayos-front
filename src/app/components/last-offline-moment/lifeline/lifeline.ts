import { LifelineItem } from "@/pages/service/dtos/lifeline.dto";
import { EaceService } from "@/pages/service/eace.service";
import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";

@Component({
    selector: 'app-lifeline',
    standalone: true,
    imports: [
        CommonModule,
    ],
    providers: [],
    template: `
        <div class="bg-lifeline">
            @for (item of data; track item) {
                <div class=" lifeline-item event-{{item.typeName.toLowerCase()}}"></div>
            } @empty {
                <div>No data available</div>
            }
        </div>
    `,
    styles: `
        .bg-lifeline {
            padding: 6px;
            background-color: #f0f0f0;
            display: flex;
            border-radius: 4px;
        }
        .lifeline-item {
            text-align: center;
            width: 100%;
            min-height: 8px;
            cursor: pointer;
        }
        .event-red {
            color: white;
            background-color: red;
        }
        .event-yellow {
            color: black;
            background-color: yellow;
        }
        .event-green {
            color: white;
            background-color: green;
        }
        .event-unknown {
            color: gray;
            background-color: lightgray;
        }
    `,
})
export class Lifeline implements OnInit, OnDestroy {
    isLoading: boolean = false;
    private subscription: any = null;

    data: LifelineItem[] = [];

    constructor(
        private readonly eaceService: EaceService
    ) { }

    async loadData() {
        this.isLoading = true;
        this.subscription = this.eaceService.getLifelineData('sssss', 7).subscribe({
            next: (data) => {
                for (let item of data.items) {
                    item.typeName = this.parserTypeName(item.type);
                }
                this.data = data.items;
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

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}