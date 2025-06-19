import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneradorOrdenesPage } from './generador-ordenes.page';

describe('GeneradorOrdenesPage', () => {
  let component: GeneradorOrdenesPage;
  let fixture: ComponentFixture<GeneradorOrdenesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneradorOrdenesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
