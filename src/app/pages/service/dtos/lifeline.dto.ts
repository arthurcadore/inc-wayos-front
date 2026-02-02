export enum LifelineItemType {
    Green = 0,
    Yellow = 1,
    Red = 2,
}

export interface LifelineItem {
    type: LifelineItemType;    
    dtHappened: string;
    i: number; // Número de núcleos da cpu
    t: number; // Temperatura atual da cpu
    u: number; // Uso atual da cpu em %

    // Campos adicionais de uso apenas no front-end
    typeName: string;
}

export interface LifelineData {
    sn: string;
    items: LifelineItem[];
}