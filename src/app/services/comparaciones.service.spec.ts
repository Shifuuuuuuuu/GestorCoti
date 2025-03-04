import { TestBed } from '@angular/core/testing';

import { ComparacionesService } from './comparaciones.service';

describe('ComparacionesService', () => {
  let service: ComparacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComparacionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
