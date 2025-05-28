import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdministrarCotizacionesPage } from './administrar-cotizaciones.page';

describe('AdministrarCotizacionesPage', () => {
  let component: AdministrarCotizacionesPage;
  let fixture: ComponentFixture<AdministrarCotizacionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministrarCotizacionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
