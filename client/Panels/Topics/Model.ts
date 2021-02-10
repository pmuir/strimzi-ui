/*
 * Copyright Strimzi authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */

import { DefaultApi, TopicsList } from '../../OpenApi/api';

export const fetchTopics = async (): Promise<{ model: TopicsList }> => {
  const topicListObj = new DefaultApi();
  const model = (await topicListObj.getTopicsList()) as TopicsList;
  return {
    model,
  };
};
