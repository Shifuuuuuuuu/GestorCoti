import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrarUsuarioPage } from './registrar-usuario.page';

describe('RegistrarUsuarioPage', () => {
  let component: RegistrarUsuarioPage;
  let fixture: ComponentFixture<RegistrarUsuarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrarUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
