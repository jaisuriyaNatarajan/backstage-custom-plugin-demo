import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Content, Header, Page } from '@backstage/core-components';
import {
  Button,
  Checkbox,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

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

type Todo = { id: string; title: string; done: boolean };

const seed: Todo[] = [
  { id: 't1', title: 'Try Backstage', done: false },
  { id: 't2', title: 'Open the Docs tab', done: false },
  { id: 't3', title: 'Add a new task', done: true },
];

export default function TodoPage() {
  // purely frontend (static) — no backend calls at all
  const [todos, setTodos] = useState<Todo[]>(() => seed);
  const [title, setTitle] = useState('');

  const remaining = useMemo(() => todos.filter(t => !t.done).length, [todos]);

  const add = () => {
    const v = title.trim();
    if (!v) return;
    setTodos(prev => [
      { id: crypto.randomUUID(), title: v, done: false },
      ...prev,
    ]);
    setTitle('');
  };

  const toggle = (id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const del = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // Optional: keep state in localStorage so it persists on refresh
  useEffect(() => {
    try {
      const saved = localStorage.getItem('todo-static');
      if (saved) setTodos(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('todo-static', JSON.stringify(todos));
    } catch {}
  }, [todos]);

  return (
    <Page themeId="tool">
      <Header
        title="Todo"
        subtitle="Simple CRUD (frontend only, static data)"
      />
      <Content>
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
            {todos.map(t => (
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
