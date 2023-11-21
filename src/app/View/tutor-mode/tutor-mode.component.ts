import { Component, OnInit } from '@angular/core';
import { ControllerService } from 'src/app/Presenter/controller.service';
import { PresentationControllerService } from 'src/app/Presenter/presentation-controller.service';


interface TestFile {
  status: string;
  error?: string;
  file: File;
}

@Component({
  selector: 'app-tutor-mode',
  templateUrl: './tutor-mode.component.html',
  styleUrls: ['./tutor-mode.component.scss']
})
export class TutorModeComponent implements OnInit {
  files: TestFile[] = [];
  hideDropzone = false;

  constructor(
    private presentationController: PresentationControllerService,
    private controller: ControllerService,
  ) { }

  ngOnInit(): void {
    this.presentationController.loadFilesToTutMode$.subscribe(
      content => {
        if (content.files[0] !== undefined) {
          content.files.forEach((file: File) => this.files.push({ status: "", file: file }))
        }
      }
    )

    this.controller.testStatus.subscribe(
      content => {

        console.log(content)
        if (content.fileIndex === -1 || content.status === "") { return }

        this.files[content.fileIndex].status = content.status;
        if (content.status === "failed") {
          this.files[content.fileIndex].error = content.error;
        }
      }
    )
  }


  onSelect(event: any) {
    if (event.rejectedFiles.length > 0) {
      console.warn("rejected File: '" + event.rejectedFiles[0].name + "'\ntype '" + event.rejectedFiles[0].type + "' is not supported")
    }

    let files = event.addedFiles.filter((file: File) => file.type === "application/json")
    let zipFiles = event.addedFiles.filter((file: File) => file.type !== "application/json")

    // extract files from zip 
    if (zipFiles.length > 0) {
      const jsZip = require("jszip");

      jsZip.loadAsync(zipFiles[0]).then(
        (zip: any) => Object.keys(zip.files).forEach(
          (filename) => zip.files[filename].async("string").then(
            (fileData: string) => this.files.push({ file: new File([fileData], filename, { type: "application/json" }), status: "" })
          )
        )
      )
    }


    files.forEach((file: File) => {
      this.files.push({ file: file, status: "" })
    });

  }

  onRemove(event: any) {
    this.files.splice(this.files.indexOf(event), 1)
    console.log("onRemove")
  }

  onAddFiles() {
    console.log("onAddFiles")
    this.hideDropzone = true;
  }

  importToBothEditors(fileIndex: number) {
    this.controller.importFile(this.files[fileIndex])
    this.showComment(fileIndex)
  }

  importToMicroEditor(fileIndex: number) {
    this.controller.importFile(this.files[fileIndex], "micro")
  }

  importToMacroEditor(fileIndex: number) {
    this.controller.importFile(this.files[fileIndex], "macro")
    this.showComment(fileIndex)
  }

  removeFile(fileIndex: number) {
    this.files.splice(fileIndex, 1)
  }

  // just does a console log. Should show the comment to the user when it is decided where we want to show the comment
  showComment(fileIndex: number) {
    this.presentationController.showComment(this.files[fileIndex].file)
  }

  batchTest() {
    this.controller.batchTest(this.files.map((testFile) => testFile.file))
  }

}
