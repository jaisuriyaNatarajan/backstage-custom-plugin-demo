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

  const [spec, setSpec] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadSpec = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('catalog');
      const resp = await fetchApi.fetch(`${baseUrl}/openapi.json`);
      if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
      setSpec(await resp.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSpec();
  }, []);

  return (
    <Page themeId="home">
      <Header title="Backend API Explorer" />
      <Content>
        {loading && <Progress />}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {spec && (
          <SwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={1}
          />
        )}
      </Content>
    </Page>
  );
};

export default SwaggerApiDocsPage;
