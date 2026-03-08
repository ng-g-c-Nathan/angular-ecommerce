import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarCuentaNuevaComponent } from './registrar-cuenta-nueva.component';

describe('RegistrarCuentaNuevaComponent', () => {
  let component: RegistrarCuentaNuevaComponent;
  let fixture: ComponentFixture<RegistrarCuentaNuevaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarCuentaNuevaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegistrarCuentaNuevaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
