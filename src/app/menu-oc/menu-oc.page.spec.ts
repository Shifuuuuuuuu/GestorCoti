import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuOcPage } from './menu-oc.page';

describe('MenuOcPage', () => {
  let component: MenuOcPage;
  let fixture: ComponentFixture<MenuOcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuOcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
