import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  Observable,
  ApolloLink,
} from '@apollo/client';
import * as lodash from 'lodash';
import { execute, ExecutionResult } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { feedResolver, feedStreamResolver } from './resolver/feed-resolvers';
import typeDefs from './generated/schema';
import createGraphQLContext, { IGraphQLContext } from './graphql-context';

function isAsyncIterable<T>(iterable: any): iterable is AsyncIterable<T> {
  return iterable && typeof iterable[Symbol.asyncIterator] === 'function';
}

function createPath(result: { path: Array<string | number> }): string {
  return result.path.reduce<string>((path, key) => {
    const sep = typeof key === 'string' && path.endsWith(']') ? '.' : '';
    const value = typeof key === 'string' ? key : `[${key}]`;
    return [path, sep, value].join('');
  }, '');
}

function hasPath<T>(
  result: any
): result is T & {
  path: any[];
} {
  return Array.isArray(result.path);
}

function set(obj: any, path: string, value: any) {
  console.log('set', path, value);
  return lodash.set(obj, path, value);
}

function SchemaLink() {
  const schema = makeExecutableSchema<IGraphQLContext>({
    typeDefs: typeDefs,
    resolvers: {
      Query: {
        feeds: feedResolver,
        feedStream: feedStreamResolver,
      },
    } as any,
  });

  return new ApolloLink((operation) => {
    console.log('Query', operation.operationName);
    return new Observable((observer) => {
      async function handleResult(
        result: ExecutionResult<any> | AsyncIterable<ExecutionResult<any>>
      ) {
        if (!isAsyncIterable(result)) {
          console.log('not async iterable', result);
          if (!observer.closed) {
            observer.next(result);
            observer.complete();
          }
        } else {
          console.log('async iterable');
          let initialResult: any = {};
          for await (const payload of result) {
            console.log('payload', payload);
            if (!observer.closed) {
              if (payload.data && !hasPath(payload)) {
                console.log('set initial result');
                initialResult = payload;
              }

              if (!payload.hasNext) {
                console.log('complete');
                observer.complete();
              } else {
                if (hasPath(payload)) {
                  console.log(
                    'update',
                    initialResult.data,
                    'at',
                    payload.path,
                    payload.data
                  );
                  initialResult.data = set(
                    initialResult.data,
                    createPath(payload),
                    payload.data
                  );
                  console.log('updated', initialResult.data);
                }
                console.log('emit', initialResult);
                observer.next(initialResult);
              }
            }
          }
        }
      }

      try {
        Promise.resolve(
          execute({
            schema,
            document: operation.query,
            variableValues: operation.variables,
            contextValue: createGraphQLContext(),
          })
        )
          .then(handleResult)
          .catch((error) => {
            if (!observer.closed) {
              observer.error(error);
            }
          });
      } catch (error) {
        if (!observer.closed) {
          observer.error(error);
        }
      }
    });
  });
}

export const buildClient: () => ApolloClient<NormalizedCacheObject> = () => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: SchemaLink(),
  });
};
