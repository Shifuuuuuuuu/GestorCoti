import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarSolpedPage } from './editar-solped.page';

describe('EditarSolpedPage', () => {
  let component: EditarSolpedPage;
  let fixture: ComponentFixture<EditarSolpedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarSolpedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
