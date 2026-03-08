import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalizarDatosClienteComponent } from './personalizar-datos-cliente.component';

describe('PersonalizarDatosClienteComponent', () => {
  let component: PersonalizarDatosClienteComponent;
  let fixture: ComponentFixture<PersonalizarDatosClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalizarDatosClienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PersonalizarDatosClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
