import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Content, Page, Progress } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { useNavigate } from 'react-router-dom';
import { scaffolderApiRef } from '@backstage/plugin-scaffolder-react';
import Form, { IChangeEvent } from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';

/* ────────────────────────────────────────────── */
/* Global skin just for this page (scoped)       */
/* ────────────────────────────────────────────── */

const FormSkin = createGlobalStyle`
  /* scope to our wrapper so we don't affect the whole app */
  .vm-order-scope {
    /* Labels */
    .rjsf .MuiFormLabel-root,
    .rjsf legend {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280; /* gray-500 */
      margin-bottom: 6px;
    }

    /* Inputs / Selects */
    .rjsf .MuiOutlinedInput-root,
    .rjsf .MuiSelect-outlined,
    .rjsf .MuiInputBase-root {
      background: #f9fafb; /* gray-50 */
      border-radius: 10px;
    }

    /* Outlined border color + focus ring */
    .rjsf .MuiOutlinedInput-notchedOutline {
      border-color: #e5e7eb !important; /* gray-200 */
    }
    .rjsf .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: #4f46e5 !important; /* indigo-600 */
      box-shadow: 0 0 0 3px rgba(79,70,229,0.15);
    }

    /* Input padding/height */
    .rjsf .MuiOutlinedInput-input {
      padding: 12px 14px;
    }

    /* Helper / description text */
    .rjsf .MuiFormHelperText-root {
      color: #6b7280;
      margin: 4px 0 0;
    }

    /* Checkbox */
    .rjsf .MuiCheckbox-root {
      padding: 4px;
    }

    /* Select icon color */
    .rjsf .MuiSvgIcon-root {
      color: #6b7280;
    }

    /* Field blocks spacing */
    .rjsf .field {
      margin-bottom: 16px;
    }
  }
`;

/* ────────────────────────────────────────────── */
/* Layout pieces                                  */
/* ────────────────────────────────────────────── */

const Shell = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px; /* left form, right panel */
  gap: 24px;
`;

const Panel = styled.aside`
  position: sticky;
  top: 16px;
  align-self: start;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
`;

const PanelTitle = styled.div`
  font-weight: 700;
  margin-bottom: 12px;
`;

const MeterRow = styled.div`
  margin: 16px 0 8px;
  font-size: 14px;
  color: #374151; /* gray-700 */
`;

const MeterBar = styled.div<{ value: number }>`
  height: 10px;
  border-radius: 6px;
  background: #eef2f7;
  overflow: hidden;
  &:after {
    content: '';
    display: block;
    width: ${p => Math.min(100, Math.round(p.value * 100))}%;
    height: 100%;
    background: #4f46e5;
    transition: width 0.2s ease;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px dashed #e5e7eb;
  margin-top: 16px;
`;

const Btn = styled.button<{ kind?: 'primary' | 'ghost' }>`
  appearance: none;
  border: 0;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
  background: ${p => (p.kind === 'primary' ? '#4f46e5' : '#f3f4f6')};
  color: ${p => (p.kind === 'primary' ? '#fff' : '#111827')};
  box-shadow: ${p =>
    p.kind === 'primary' ? '0 1px 2px rgba(16,24,40,.12)' : 'none'};
`;

/* Custom header bar to match your mock */
const Hero = styled.div`
  margin: -24px -24px 16px; /* pull full-bleed over Page padding */
  padding: 28px 28px 24px;
  background: linear-gradient(135deg, #0f766e 0%, #0ea5a4 60%, #0b7a6f 100%);
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.2px;
`;

/* ────────────────────────────────────────────── */
/* Right Panel                                    */
/* ────────────────────────────────────────────── */

type RightPanelProps = { formData: any };

const RightPanel: React.FC<RightPanelProps> = ({ formData }) => {
  const qty = Number(formData?.quantity ?? 1);
  const nodeSize = String(formData?.nodeSize ?? 'QSC');

  const baseCpu = nodeSize === 'L' ? 0.12 : nodeSize === 'M' ? 0.08 : 0.04;
  const baseMem = nodeSize === 'L' ? 0.09 : nodeSize === 'M' ? 0.06 : 0.03;

  const cpu = baseCpu * qty;
  const mem = baseMem * qty;
  const rate = (cpu + mem).toFixed(2);

  return (
    <Panel>
      <div style={{ textAlign: 'right', fontSize: 14, marginBottom: 8 }}>
        Rate : <b>${rate} / hour</b>
      </div>

      <PanelTitle>CPU</PanelTitle>
      <MeterBar value={cpu} />
      <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
        {cpu.toFixed(2)}
      </div>

      <MeterRow>Memory Size</MeterRow>
      <MeterBar value={mem} />
      <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
        {mem.toFixed(2)}
      </div>
    </Panel>
  );
};

/* ────────────────────────────────────────────── */
/* RJSF Templates (2-column blocks)               */
/* ────────────────────────────────────────────── */

const FieldTemplate = (props: any) => {
  const { classNames, label, required, description, errors, help, children } =
    props;
  return (
    <div className={`${classNames} field`} style={{ marginBottom: 16 }}>
      {label ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#6b7280',
            marginBottom: 6,
          }}
        >
          {label}
          {required ? ' *' : ''}
        </div>
      ) : null}
      {description}
      {children}
      {errors}
      {help}
    </div>
  );
};

const ObjectFieldTemplate = (props: any) => {
  const { properties } = props;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}
    >
      {properties.map((p: any) => (
        <div key={p.name} style={{ gridColumn: 'auto' }}>
          {p.content}
        </div>
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────── */
/* Merge step schemas from Scaffolder             */
/* ────────────────────────────────────────────── */

type StepChunk = { schema?: any; uiSchema?: any; formData?: any };

function deepMerge<T extends object>(a: T, b: Partial<T>): T {
  const out: any = Array.isArray(a) ? [...(a as any)] : { ...(a as any) };
  for (const [k, v] of Object.entries(b || {})) {
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      out[k] &&
      typeof out[k] === 'object'
    ) {
      out[k] = deepMerge(out[k], v as any);
    } else if (Array.isArray(v) && Array.isArray(out[k])) {
      out[k] = [...out[k], ...v];
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function mergeSteps(steps: StepChunk[]) {
  let schema = {
    type: 'object',
    properties: {} as any,
    required: [] as string[],
  };
  let uiSchema: any = {};
  let formData: any = {};

  for (const s of steps) {
    if (s?.schema?.properties) {
      schema.properties = { ...schema.properties, ...s.schema.properties };
      if (Array.isArray(s.schema.required)) {
        schema.required = Array.from(
          new Set([...(schema.required || []), ...s.schema.required]),
        );
      }
    }
    if (s?.uiSchema) uiSchema = deepMerge(uiSchema, s.uiSchema);
    if (s?.formData) formData = deepMerge(formData, s.formData);
  }
  return { schema, uiSchema, formData };
}

/* ────────────────────────────────────────────── */
/* Main Component                                 */
/* ────────────────────────────────────────────── */

export const VmOrderCreatePage = () => {
  const scaffolderApi = useApi(scaffolderApiRef);
  const navigate = useNavigate();
  const templateRef = 'template:default/vm-order';

  const [loading, setLoading] = React.useState(true);
  const [schema, setSchema] = React.useState<any>(null);
  const [uiSchema, setUiSchema] = React.useState<any>({});
  const [formData, setFormData] = React.useState<any>({});
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res: any = await scaffolderApi.getTemplateParameterSchema(
          templateRef,
        );
        console.log('Got schema response', { res });
        if (res?.steps && Array.isArray(res.steps)) {
          const merged = mergeSteps(res.steps);
          setSchema(merged.schema);
          setUiSchema(merged.uiSchema);
          setFormData(merged.formData);
        } else {
          setSchema(res?.schema ?? {});
          setUiSchema(res?.uiSchema ?? {});
          setFormData(res?.formData ?? {});
        }
      } catch (e: any) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [scaffolderApi]);

  const handleSubmit = async ({ formData: values }: IChangeEvent<any>) => {
    const { taskId } = await scaffolderApi.scaffold({
      templateRef,
      values,
      secrets: {},
    });
    navigate(`/create/tasks/${taskId}`);
  };

  const handleCancel = () => navigate(-1);

  if (loading) {
    return (
      <Page>
        <Content>
          <Progress />
        </Content>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Content>Error: {error}</Content>
      </Page>
    );
  }

  return (
    <Page themeId="home">
      <FormSkin />
      <Content className="vm-order-scope">
        <Hero>
          <HeroTitle>Order Reserve VM QA</HeroTitle>
        </Hero>

        <Shell>
          {/* LEFT: the form */}
          <div>
            <Form
              schema={schema}
              uiSchema={uiSchema}
              validator={validator}
              formData={formData}
              FieldTemplate={FieldTemplate}
              ObjectFieldTemplate={ObjectFieldTemplate}
              onChange={(e: IChangeEvent<any>) => setFormData(e.formData)}
              onSubmit={handleSubmit}
              liveValidate={false}
              showErrorList={false}
              noHtml5Validate
            >
              {/* hide default submit; use custom buttons */}
              <div />
            </Form>

            <ButtonRow>
              <Btn onClick={handleCancel}>Cancel</Btn>
              <Btn> Add to Cart </Btn>
              <Btn
                kind="primary"
                onClick={() => handleSubmit({ formData } as any)}
              >
                Submit
              </Btn>
            </ButtonRow>
          </div>

          {/* RIGHT: live summary panel */}
          <RightPanel formData={formData} />
        </Shell>
      </Content>
    </Page>
  );
};

export default VmOrderCreatePage;
