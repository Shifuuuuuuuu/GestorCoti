import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VistaCotizacionesPage } from './vista-cotizaciones.page';

describe('VistaCotizacionesPage', () => {
  let component: VistaCotizacionesPage;
  let fixture: ComponentFixture<VistaCotizacionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VistaCotizacionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
