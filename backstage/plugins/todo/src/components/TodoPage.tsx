import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  Content,
  Header,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import {
  Button,
  Checkbox,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useApi } from '@backstage/core-plugin-api';
import { todoApiRef, Todo } from '../api/TodoApi';

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
`;
const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;
const Row = styled.li`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
`;

export default function TodoPage() {
  const api = useApi(todoApiRef);

  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<Error | undefined>(undefined);

  const remaining = useMemo(
    () => (todos ?? [])?.filter(t => !t.done).length || [],
    [todos],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.list();
        if (mounted) setTodos(data);
      } catch (e: any) {
        setError(e);
        setTodos([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [api]);

  const add = async () => {
    const v = title.trim();
    if (!v) return;
    setTitle('');
    const temp: Todo = { id: `tmp-${Date.now()}`, title: v, done: false };
    setTodos(prev => [temp, ...(prev ?? [])]);
    try {
      const created = await api.add(v);
      setTodos(prev => (prev ?? []).map(t => (t.id === temp.id ? created : t)));
    } catch (e: any) {
      setError(e);
      setTodos(prev => (prev ?? []).filter(t => t.id !== temp.id));
    }
  };

  const toggle = async (id: string) => {
    setTodos(prev =>
      (prev ?? []).map(t => (t.id === id ? { ...t, done: !t.done } : t)),
    );
    try {
      const cur = (todos ?? []).find(x => x.id === id);
      await api.toggle(id, !(cur?.done ?? false));
    } catch (e: any) {
      setError(e);
      // revert
      setTodos(prev =>
        (prev ?? []).map(t => (t.id === id ? { ...t, done: !t.done } : t)),
      );
    }
  };

  const del = async (id: string) => {
    const prev = todos ?? [];
    setTodos(prev.filter(t => t.id !== id));
    try {
      await api.remove(id);
    } catch (e: any) {
      setError(e);
      setTodos(prev); // revert
    }
  };

  if (!todos && !error) {
    return (
      <Page themeId="tool">
        <Header title="Todo" subtitle="Simple CRUD (backend)" />
        <Content>
          <Progress />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header title="Todo" subtitle="Simple CRUD (backend)" />
      <Content>
        {error && <ResponseErrorPanel error={error} />}
        <Card>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <TextField
              fullWidth
              label="Add a task"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
            />
            <Button variant="contained" onClick={add}>
              Add
            </Button>
          </div>

          <div style={{ marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
            {remaining} remaining
          </div>

          <List>
            {(todos ?? []).map(t => (
              <Row key={t.id}>
                <Checkbox checked={t.done} onChange={() => toggle(t.id)} />
                <div
                  style={{
                    textDecoration: t.done ? 'line-through' : 'none',
                    opacity: t.done ? 0.6 : 1,
                  }}
                >
                  {t.title}
                </div>
                <Tooltip title="Delete">
                  <IconButton onClick={() => del(t.id)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Row>
            ))}
          </List>
        </Card>
      </Content>
    </Page>
  );
}
