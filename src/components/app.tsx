import { ApolloProvider } from '@apollo/client';

import FeedList from './feeds/feeds-list';
import { buildClient } from 'data/data-builder';

const client = buildClient();

const App = () => {
  return (
    <ApolloProvider client={client}>
      <FeedList />
    </ApolloProvider>
  );
};

export default App;
