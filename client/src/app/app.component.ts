import { Subject } from 'rxjs/Subject';
import { BackendService } from './backend.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [BackendService]
})
export class AppComponent implements OnInit {

  socket: Subject<any>;
  messages: Array<any> = new Array<any>();

  constructor(private backend: BackendService) {
  }

  ngOnInit() {
    this.socket = this.backend.connect();
    this.socket.subscribe((message: MessageEvent) =>  {
      console.log(message);
      this.messages.push(JSON.parse(message.data));
    });
  }

  onInputChange(value: string) {
     this.socket.next(value);
  }
}
