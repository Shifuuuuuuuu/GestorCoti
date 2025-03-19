import { Component, OnInit } from '@angular/core';
import { Equipos } from '../Interface/IEquipo';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// ✅ Extiende el tipo de jsPDF para que TypeScript reconozca autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
@Component({
  selector: 'app-certificados-mantenciones',
  templateUrl: './certificados-mantenciones.page.html',
  styleUrls: ['./certificados-mantenciones.page.scss'],
})
export class CertificadosMantencionesPage  {
  equipo: Equipos = {
    equipo: '',
    codigo: '',
    tipo_equipo: '',
    anno: '',
    marca: '',
    numero_motor: '',
    numero_chasis: '',
    numero_interno: '',
    modelo: '',
    patente: '',
    ultima_ot: 0,
    fecha_ultima_ot: '',
    km_hrs_ot: 0,
    km_hrs_actual: 0,
    intervalo_motor: 0,
    certificado: 0,
  };

  constructor() {}

  generarPDF() {
    const doc = new jsPDF();

    // Título y encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Xtreme Mining Ltda.', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`CERTIFICADO N°: ${this.equipo.certificado}`, 160, 20);
    doc.text(`Santiago, ${new Date().toLocaleDateString()}`, 10, 30);

    doc.setFontSize(14);
    doc.text('CERTIFICADO DE MANTENCIÓN', 105, 45, { align: 'center' });

    // Cuerpo del certificado
    const texto = `
Xtreme Mining Ltda. certifica que el equipo identificado con la placa ${this.equipo.patente},
Código Interno ${this.equipo.codigo}, se encuentra con sus mantenciones y revisiones al día
según la pauta del fabricante, encontrándose en condiciones para operar con normalidad en minería.

Su última mantención se realizó el ${this.equipo.fecha_ultima_ot} a los ${this.equipo.km_hrs_ot} km/hrs,
registrada en la orden de trabajo N° ${this.equipo.ultima_ot}.

La unidad se encuentra en condiciones estándar tanto en su parte mecánica, hidráulica y estructural.
    `;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(texto, 15, 55, { maxWidth: 180 });

    // ✅ Tabla de datos técnicos con autoTable
    doc.autoTable({
      startY: 120,
      theme: 'grid',
      head: [['Marca', 'Modelo', 'Tipo', 'Chasis', 'Motor', 'Interno', 'Lectura Actual', 'Próxima Mantención']],
      body: [[
        this.equipo.marca,
        this.equipo.modelo,
        'CAMIONETA',
        this.equipo.numero_chasis,
        this.equipo.numero_motor,
        this.equipo.codigo,
        `${this.equipo.km_hrs_actual} km`,
        `${this.equipo.km_hrs_actual + this.equipo.intervalo_motor} km`
      ]],
    });

    // Firma
    doc.setFontSize(12);
    doc.text('_____________________________', 15, 180);
    doc.text('Juan Cubillos Polloni', 15, 185);
    doc.text('Jefe Mantención Flota', 15, 190);

    // Guardar PDF
    doc.save(`C.MANTENCIONES_${this.equipo.patente}.pdf`);
  }
}
