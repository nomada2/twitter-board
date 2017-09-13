import { Subject } from 'rxjs/Subject';
import { BackendService } from './backend.service';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';

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
    this.options = {
        chart: { type: 'pie' },
        title: { text : 'Tweets Sentiment'},
        series: [{ 
          data: []
        }]
    };
  }

  chart : any;
  options: any;

  ngOnInit() {
    this.socket = this.backend.connect();
    this.socket.subscribe((message: MessageEvent) =>  {
      this.messages.push(JSON.parse(message.data));
      this.chart.series[0].update(this.getSeriesData());
    });
  }

  saveInstance(chartInstance) {
    this.chart = chartInstance;
  }

  getSeriesData() {
    const scores = _.countBy(this.messages, m => m.sentimentScore);
    const total = this.messages.length > 0 ? this.messages.length : 1;
    const series = {
      name: 'Tweets',
      data: []
    };

    if (scores['4']) {
      series.data.push({ name: 'Positive', y: scores['4'] / total * 100 });
    }
    if (scores['2']) {
      series.data.push({ name: 'Neutral', y: scores['2'] / total * 100 });
    }
    if (scores['0']) {
      series.data.push({ name: 'Negative', y: scores['0'] / total * 100 });
    }

    return series;
  }

  onInputChange(value: string) {
     this.socket.next(value);
     this.messages = new Array<any>();
     this.chart.series[0].update(this.getSeriesData());
  }
}
