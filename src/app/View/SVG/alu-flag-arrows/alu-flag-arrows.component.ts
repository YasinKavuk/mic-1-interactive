import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DirectorService } from 'src/app/Presenter/director.service';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';


@Component({
  selector: '[app-alu-flag-arrows]',
  templateUrl: './alu-flag-arrows.component.html',
  styleUrls: ['./alu-flag-arrows.component.scss']
})
export class AluFlagArrowsComponent implements AfterViewInit {
  @ViewChild("nArrow") nArrow: ElementRef;

  public zFlag = false;
  public nFlag = false;

  public presentationMode = false;

  constructor(
    private director: DirectorService,
    private presentationController: PresentationControllerService,
  ) { }

  ngAfterViewInit(): void {
    this.director.aluFlags$.subscribe(flags => {
      this.zFlag = flags.Z;
      this.nFlag = flags.N;

      const zRegister = document.querySelector(".Z_Value");
      zRegister.innerHTML = this.zFlag ? "1" : "0";

      const nRegister = document.querySelector(".N_Value");
      nRegister.innerHTML = this.nFlag ? "1" : "0";

    });


    this.presentationController.presentationMode$.subscribe( mode => {
      this.presentationMode = mode.presentationMode;
    })
  }

}
