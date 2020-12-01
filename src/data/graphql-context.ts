import { Feed } from './generated/graphql';
import * as faker from 'faker';

export interface IGraphQLContext {
  feeds: () => Promise<Feed[]>;
  feedsStream: () => AsyncIterable<Feed>;
}

const feedsCache: Feed[] = [];

function zzz(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function generateFeedData() {
  for (let i = 1; i <= 10; i++) {
    const feedItem: Feed = {
      id: i.toString(),
      title: faker.random.words(5),
      description: faker.random.words(25),
    };

    feedsCache.push(feedItem);
  }
}

function createGraphQLContext(): IGraphQLContext {
  return {
    async feeds() {
      if (feedsCache.length > 0) {
        return feedsCache;
      }

      generateFeedData();

      return feedsCache;
    },
    feedsStream: async function* () {
      console.log('iterator');

      if (feedsCache.length > 0) {
        console.log('yield from cache');
        yield* feedsCache;
      }

      generateFeedData();
      await zzz(3000);
      console.log('yield fresh');
      yield* feedsCache;
    },
  };
}

export default createGraphQLContext;
