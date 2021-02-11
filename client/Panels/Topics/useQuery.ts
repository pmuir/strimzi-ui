/*
 * Copyright Strimzi authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */
import { DefaultApi } from 'OpenApi';
import { useState, useEffect } from 'react';

export interface IResponse<T> {
  loading?: boolean;
  success?: boolean;
  data?: T | null;
}
export const useQuery = <T>(
  method: () => void,
  callbackOnError?: () => void,
  callbackOnCompleted?: (value?: T) => void
): {
  data: IResponse<T>;
  setState: (val: T) => void;
} => {
  const [dataObj, setDataObj] = useState<T>();
  const [loading, setLoading] = useState<boolean>();
  const [success, setSuccess] = useState<boolean>();
  const [data, setData] = useState<T>();
  const executeQuery = async () => {
    setLoading(true);

    let response;
    try {
      response = await new DefaultApi().getTopicsList();
      console.log(response);
      if (response) {
        const res = await response.json();
        setLoading(false);
        setSuccess(res.success);
        if (res.success) {
          callbackOnCompleted && callbackOnCompleted(res.data);
          setData(res);
        } else {
          callbackOnError && callbackOnError();
        }
      }
    } catch (e) {
      setLoading(false);
    }
  };
  useEffect(() => {
    function execute() {
      if (dataObj) {
        executeQuery();
      }
    }
    execute();
  });

  return {
    data: {
      loading: loading,
      data: data,
      success: success,
    },
    setState: setDataObj,
  };
};
