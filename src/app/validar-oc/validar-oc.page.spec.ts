import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidarOcPage } from './validar-oc.page';

describe('ValidarOcPage', () => {
  let component: ValidarOcPage;
  let fixture: ComponentFixture<ValidarOcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidarOcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
