/*
 * Copyright Strimzi authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

import {
  ApolloClient,
  ApolloLink,
  concat,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  split,
} from '@apollo/client';

declare const __PUBLIC_PATH__: string;

const getApolloClient = (
  middlewares?: ApolloLink[]
): ApolloClient<NormalizedCacheObject> => {
  let apiLink: ApolloLink = new HttpLink({
    uri: `${__PUBLIC_PATH__}/api`,
    fetch,
  });

  if (middlewares !== undefined) {
    middlewares.forEach(
      (middleware) => (apiLink = concat(middleware, apiLink))
    );
  }

  console.log(apiLink);

  const configLink = new HttpLink({ uri: `${__PUBLIC_PATH__}/config`, fetch });

  const splitLink = split(
    (operation) => operation.getContext().purpose === 'config',
    configLink,
    apiLink
  );

  const apolloClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
  });

  return apolloClient;
};

const apolloClient = getApolloClient();

export { getApolloClient, apolloClient };
