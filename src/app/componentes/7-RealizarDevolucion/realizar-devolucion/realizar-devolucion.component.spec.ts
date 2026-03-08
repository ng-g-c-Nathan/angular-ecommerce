import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealizarDevolucionComponent } from './realizar-devolucion.component';

describe('RealizarDevolucionComponent', () => {
  let component: RealizarDevolucionComponent;
  let fixture: ComponentFixture<RealizarDevolucionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealizarDevolucionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RealizarDevolucionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
