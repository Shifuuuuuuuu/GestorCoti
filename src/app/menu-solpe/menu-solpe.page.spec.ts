import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuSolpePage } from './menu-solpe.page';

describe('MenuSolpePage', () => {
  let component: MenuSolpePage;
  let fixture: ComponentFixture<MenuSolpePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuSolpePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
