import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialSolpePage } from './historial-solpe.page';

describe('HistorialSolpePage', () => {
  let component: HistorialSolpePage;
  let fixture: ComponentFixture<HistorialSolpePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialSolpePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
