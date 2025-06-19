import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialOrdenesPage } from './historial-ordenes.page';

describe('HistorialOrdenesPage', () => {
  let component: HistorialOrdenesPage;
  let fixture: ComponentFixture<HistorialOrdenesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialOrdenesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
