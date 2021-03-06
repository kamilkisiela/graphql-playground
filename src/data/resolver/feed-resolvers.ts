import { Feed, ResolverFn } from 'data/generated/graphql';
import { IGraphQLContext } from 'data/graphql-context';

// TODO: is there simplified way to declare resolver type?
export const feedResolver: ResolverFn<
  Feed[],
  object,
  IGraphQLContext,
  object
> = async (_: object, __: object, context: IGraphQLContext) => {
  return await context.feeds();
};

export const feedStreamResolver = (_: {}, __: {}, context: IGraphQLContext) => {
  const stream = context.feedsStream();
  console.log('stream', stream);
  return stream;
};
