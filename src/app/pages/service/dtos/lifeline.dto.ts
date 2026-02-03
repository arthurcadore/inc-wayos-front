export enum LifelineItemType {
    Green = 0,
    Yellow = 1,
    Red = 2,
}

export interface LifelineItem {
    type: LifelineItemType;
    startAt: string;
    cpu: string;    // porcentagem de uso da CPU em porcentagem
    mem: string;    // porcentagem de uso da memoria em porcentagem
    up: string;     // velocidade de upload em bytes por segundo
    down: string;   // velocidade de download em bytes por segundo

    // Campos adicionais de uso apenas no front-end
    typeName: string;
    statusName: string;
}