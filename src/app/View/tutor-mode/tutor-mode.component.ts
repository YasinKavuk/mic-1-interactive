import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tutor-mode',
  templateUrl: './tutor-mode.component.html',
  styleUrls: ['./tutor-mode.component.scss']
})
export class TutorModeComponent implements OnInit {
  files:File[] = [];
  hideDropzone = false;

  constructor() { 
  }

  ngOnInit(): void {
  }

  
  onSelect(event: any){
    this.files.push(...event.addedFiles)
    console.log(this.files)
    console.log("onSelect")
  }

  onRemove(event: any){
    this.files.splice(this.files.indexOf(event),1)
    console.log("onRemove")
  }

  onAddFiles(){
    console.log("onAddFiles")
    this.hideDropzone = true;
    //this.controller.importFiles(this.files);
    //this.dialogRef.close();
  }





}
