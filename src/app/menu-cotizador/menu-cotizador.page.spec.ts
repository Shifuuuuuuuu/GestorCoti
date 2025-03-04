import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuCotizadorPage } from './menu-cotizador.page';

describe('MenuCotizadorPage', () => {
  let component: MenuCotizadorPage;
  let fixture: ComponentFixture<MenuCotizadorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuCotizadorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
