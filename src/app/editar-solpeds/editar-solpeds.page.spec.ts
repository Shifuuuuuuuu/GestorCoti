import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarSolpedsPage } from './editar-solpeds.page';

describe('EditarSolpedsPage', () => {
  let component: EditarSolpedsPage;
  let fixture: ComponentFixture<EditarSolpedsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditarSolpedsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
