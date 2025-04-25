import { Component, OnInit } from '@angular/core';
import { DirectorService } from 'src/app/Presenter/director.service';

@Component({
  selector: 'app-interrupt-visualization',
  templateUrl: './interrupt-visualization.component.html',
  styleUrls: ['./interrupt-visualization.component.css']
})
export class InterruptVisualizationComponent implements OnInit {
  istrValue: number = 0
  imrValue: number = 0

  constructor(
    private director: DirectorService
  ) { }

  ngOnInit(): void {
    this.director.updateInterruptView$.subscribe(
      content => {
        this.istrValue = content.istr
        this.imrValue = content.imr
      }
    )
  }

}
