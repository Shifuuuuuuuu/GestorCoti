import { Component, OnInit } from '@angular/core';
import { Equipos } from '../Interface/IEquipo';
import jsPDF from 'jspdf';

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

    doc.setFontSize(16);
    doc.text('Certificado de Mantenimiento', 10, 10);

    doc.setFontSize(12);
    doc.text(`Patente: ${this.equipo.patente}`, 10, 30);
    doc.text(`Código: ${this.equipo.codigo}`, 10, 40);
    doc.text(`Marca: ${this.equipo.marca}`, 10, 50);
    doc.text(`Modelo: ${this.equipo.modelo}`, 10, 60);
    doc.text(`Número de Motor: ${this.equipo.numero_motor}`, 10, 70);
    doc.text(`Número de Chasis: ${this.equipo.numero_chasis}`, 10, 80);
    doc.text(`Última OT: ${this.equipo.ultima_ot}`, 10, 90);
    doc.text(`Fecha Última OT: ${this.equipo.fecha_ultima_ot}`, 10, 100);
    doc.text(`Km/Hrs OT: ${this.equipo.km_hrs_ot}`, 10, 110);
    doc.text(`Certificado N°: ${this.equipo.certificado}`, 10, 120);

    doc.save(`Certificado_${this.equipo.patente}.pdf`);
  }
}
