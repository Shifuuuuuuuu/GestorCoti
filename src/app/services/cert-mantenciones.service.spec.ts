import { TestBed } from '@angular/core/testing';

import { CertMantencionesService } from './cert-mantenciones.service';

describe('CertMantencionesService', () => {
  let service: CertMantencionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CertMantencionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
