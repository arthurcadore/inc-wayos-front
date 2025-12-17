import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ExportFileService {
    /**
     * @description Exporta um array de objetos para um arquivo CSV e inicia o download.
     * @param exportData Array de objetos a serem exportados.
     * @param fileName Nome base do arquivo (sem extensão ou data).
     */
    toCSV(exportData: any[], fileName: string): void {
        // Criar CSV manualmente
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
            headers.join(';'),
            ...exportData.map(row => headers.map(header => {
                const value = row[header as keyof typeof row];
                // Escapar valores que contêm vírgula ou aspas
                return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                    ? `"${value.replace(/"/g, '""')}`
                    : value;
            }).join(';'))
        ].join('\n');

        // Criar blob e fazer download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        // Formatar nome do arquivo: offline-device_dd-MM-yyyy_HH-mm
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const formattedDate = `${day}-${month}-${year}_${hours}-${minutes}`;

        link.setAttribute('download', `${fileName}${formattedDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
