import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AceptarDevolucionComponent } from './aceptar-devolucion.component';

describe('AceptarDevolucionComponent', () => {
  let component: AceptarDevolucionComponent;
  let fixture: ComponentFixture<AceptarDevolucionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AceptarDevolucionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AceptarDevolucionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
