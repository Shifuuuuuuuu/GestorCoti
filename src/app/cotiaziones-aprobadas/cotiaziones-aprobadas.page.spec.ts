import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CotiazionesAprobadasPage } from './cotiaziones-aprobadas.page';

describe('CotiazionesAprobadasPage', () => {
  let component: CotiazionesAprobadasPage;
  let fixture: ComponentFixture<CotiazionesAprobadasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CotiazionesAprobadasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
