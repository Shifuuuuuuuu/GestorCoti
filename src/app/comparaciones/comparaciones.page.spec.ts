import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparacionesPage } from './comparaciones.page';

describe('ComparacionesPage', () => {
  let component: ComparacionesPage;
  let fixture: ComponentFixture<ComparacionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparacionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
