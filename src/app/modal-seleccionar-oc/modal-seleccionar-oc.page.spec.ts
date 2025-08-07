import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalSeleccionarOcPage } from './modal-seleccionar-oc.page';

describe('ModalSeleccionarOcPage', () => {
  let component: ModalSeleccionarOcPage;
  let fixture: ComponentFixture<ModalSeleccionarOcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalSeleccionarOcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
