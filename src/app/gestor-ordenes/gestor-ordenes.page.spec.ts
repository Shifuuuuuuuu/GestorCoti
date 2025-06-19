import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestorOrdenesPage } from './gestor-ordenes.page';

describe('GestorOrdenesPage', () => {
  let component: GestorOrdenesPage;
  let fixture: ComponentFixture<GestorOrdenesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestorOrdenesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
