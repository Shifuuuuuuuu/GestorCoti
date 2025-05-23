import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialOcPage } from './historial-oc.page';

describe('HistorialOcPage', () => {
  let component: HistorialOcPage;
  let fixture: ComponentFixture<HistorialOcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialOcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
