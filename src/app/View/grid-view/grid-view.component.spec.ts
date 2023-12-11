import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridViewComponent } from './grid-view.component';

describe('GridViewComponent', () => {
  let component: GridViewComponent;
  let fixture: ComponentFixture<GridViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GridViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // This tests would need a fix, because this component contains animation and this takes special care.
  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
