import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CotizacionComparativaPage } from './cotizacion-comparativa.page';

describe('CotizacionComparativaPage', () => {
  let component: CotizacionComparativaPage;
  let fixture: ComponentFixture<CotizacionComparativaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CotizacionComparativaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
