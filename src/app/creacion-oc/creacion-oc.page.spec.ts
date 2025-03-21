import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreacionOcPage } from './creacion-oc.page';

describe('CreacionOcPage', () => {
  let component: CreacionOcPage;
  let fixture: ComponentFixture<CreacionOcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreacionOcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
