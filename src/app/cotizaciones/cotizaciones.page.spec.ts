import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CotizacionesPage } from './cotizaciones.page';

describe('CotizacionesPage', () => {
  let component: CotizacionesPage;
  let fixture: ComponentFixture<CotizacionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CotizacionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
