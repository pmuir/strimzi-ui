/*
 * Copyright Strimzi authors.
 * License: Apache License 2.0 (see the file LICENSE or http://apache.org/licenses/LICENSE-2.0.html).
 */
import express, { Request } from 'express';
import { createProxyServer } from 'http-proxy';
import { UIServerModule } from 'types';
import fetch from 'node-fetch';
import cors from 'cors';

import {
  proxyCompleteHandler,
  proxyErrorHandler,
  proxyStartHandler,
} from './controller';

const moduleName = 'api';

export const ApiModule: UIServerModule = {
  moduleName,
  addModule: (logger, authFn, serverConfig) => {
    const { proxy } = serverConfig;
    const { exit } = logger.entry('addModule', proxy);
    const { hostname, port, contextRoot, transport } = proxy;
    const { cert, minTLS } = transport;

    const proxyConfig = {
      target: `${cert ? 'https' : 'http'}://${hostname}:${port}${contextRoot}`,
      ca: cert,
      minVersion: minTLS,
      changeOrigin: true,
      secure: cert ? true : false,
    };

    logger.debug({ proxyConfig }, `api proxy configuration`);

    const routerForModule = express.Router();
    const backendProxy = createProxyServer();

    const findBootstrapServerHost = async (req: Request) => {
      const token = req.header('X-API-OpenShift-Com-Token');
      const id = req.header('X-Kafka-ID');
      const response = await fetch(
        `https://api.stage.openshift.com/api/managed-services-api/v1/kafkas/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        const host = data['bootstrapServerHost'];
        console.log(host);
        return host;
      } else {
        throw new Error(`Unable to load ${id} from API because ${data}`);
      }
    };

    // add proxy event handlers
    backendProxy.on('error', proxyErrorHandler);
    backendProxy.on('proxyReq', proxyStartHandler);
    backendProxy.on('proxyRes', proxyCompleteHandler);
    // proxy all requests post auth check
    routerForModule.all('*', authFn, cors(), async (req, res) => {
      const host = await findBootstrapServerHost(req);
      const target = `https://admin-server-${host}`;
      console.log(`target is ${target}`);
      const cfg = { ...proxyConfig, target };
      backendProxy.web(req, res, cfg);
    });

    return exit({ mountPoint: '/api', routerForModule });
  },
};
