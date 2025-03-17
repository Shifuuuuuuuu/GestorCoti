import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CertificadosMantencionesPage } from './certificados-mantenciones.page';

describe('CertificadosMantencionesPage', () => {
  let component: CertificadosMantencionesPage;
  let fixture: ComponentFixture<CertificadosMantencionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificadosMantencionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
