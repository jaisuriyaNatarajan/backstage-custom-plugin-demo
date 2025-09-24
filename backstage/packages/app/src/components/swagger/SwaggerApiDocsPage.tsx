import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

import { Content, Header, Page, Progress } from '@backstage/core-components';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

export const SwaggerApiDocsPage = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [specs, setSpecs] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pluginIds = ['catalog', 'scaffolder', 'identity'];

  const loadSpecs = async () => {
    setLoading(true);
    setError(null);

    const loadedSpecs: Record<string, any> = {};

    for (const pluginId of pluginIds) {
      try {
        const baseUrl = await discoveryApi.getBaseUrl(pluginId);
        const resp = await fetchApi.fetch(`${baseUrl}/openapi.json`);

        if (!resp.ok) {
          console.warn(
            `Skipping ${pluginId}: ${resp.status} ${resp.statusText}`,
          );
          continue;
        }

        const spec = await resp.json();
        loadedSpecs[pluginId] = spec;
      } catch (e) {
        console.warn(`Error loading ${pluginId}:`, e);
        continue;
      }
    }

    setSpecs(loadedSpecs);
    setLoading(false);
  };

  React.useEffect(() => {
    loadSpecs();
  }, []);

  return (
    <Page themeId="home">
      <Header title="Backend API Explorer" />
      <Content>
        {loading && <Progress />}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {Object.keys(specs).length > 0
          ? Object.entries(specs).map(([pluginId, spec]) => (
              <div key={pluginId} style={{ marginBottom: '2rem' }}>
                <h2>{pluginId.toUpperCase()} API</h2>
                <SwaggerUI
                  spec={spec}
                  docExpansion="list"
                  defaultModelsExpandDepth={1}
                />
              </div>
            ))
          : !loading && <div>No API specs available.</div>}
      </Content>
    </Page>
  );
};

export default SwaggerApiDocsPage;
