import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportarPDFOptions {
    nombreReporte: string;
    encabezados: string[];
    filas: any[][]; // Asegúrate que sean arrays de strings o números
}

export const exportarPDF = ({ nombreReporte, encabezados, filas }: ExportarPDFOptions) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.text(nombreReporte, 14, 15);

    autoTable(doc, {
        startY: 25,
        head: [encabezados],
        body: filas,
    });

    doc.save(`${nombreReporte}.pdf`);
};
