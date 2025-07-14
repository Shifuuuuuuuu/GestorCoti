import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearUsuariosPage } from './crear-usuarios.page';

describe('CrearUsuariosPage', () => {
  let component: CrearUsuariosPage;
  let fixture: ComponentFixture<CrearUsuariosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearUsuariosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
