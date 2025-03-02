import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndiaWithStatesComponent } from './india-with-states.component';

describe('IndiaWithStatesComponent', () => {
  let component: IndiaWithStatesComponent;
  let fixture: ComponentFixture<IndiaWithStatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndiaWithStatesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IndiaWithStatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
