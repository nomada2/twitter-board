import { TwitterBoardClientPage } from './app.po';

describe('twitter-board-client App', () => {
  let page: TwitterBoardClientPage;

  beforeEach(() => {
    page = new TwitterBoardClientPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
