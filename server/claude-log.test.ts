// What Claude is doing now is read from its streamed log: thinking, then a file as it is written,
// then, once the call is complete, the note that says it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LOG_START, readLogNews } from './claude-log.ts';

const PROJECT = '/project';
const SCRIPT = '/project/data/jobs/j0001/script.ts';

function addLines(logFile: string, events: object[]): void {
  appendFileSync(logFile, events.map((event) => `${JSON.stringify(event)}\n`).join(''));
}

function streamed(event: object): object {
  return { type: 'stream_event', event, parent_tool_use_id: null };
}

test('thinking, a file being written, then the note of the write', () => {
  const logFile = join(mkdtempSync(join(tmpdir(), 'chiptune-log-')), 'claude.log');
  addLines(logFile, [{ type: 'system', subtype: 'thinking_tokens', estimated_tokens: 2400 }]);
  const thinking = readLogNews(logFile, LOG_START, PROJECT);
  assert.equal(thinking.now, 'thinking (2,400 tokens)');

  addLines(logFile, [
    streamed({ type: 'content_block_start', content_block: { type: 'tool_use', name: 'Write' } }),
    streamed({
      type: 'content_block_delta',
      delta: { type: 'input_json_delta', partial_json: `{"file_path": "${SCRIPT}", "content": "` },
    }),
    streamed({
      type: 'content_block_delta',
      delta: { type: 'input_json_delta', partial_json: 'x'.repeat(3000) },
    }),
  ]);
  const writing = readLogNews(logFile, thinking, PROJECT);
  assert.equal(writing.now, 'writing data/jobs/j0001/script.ts (3 KB so far)');
  assert.deepEqual(writing.notes, []);

  addLines(logFile, [
    {
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: SCRIPT } }] },
    },
  ]);
  const written = readLogNews(logFile, writing, PROJECT);
  assert.deepEqual(written.notes, ['writing data/jobs/j0001/script.ts']);
  assert.equal(written.now, null);
});

test('a line of Claude shows as it is written', () => {
  const logFile = join(mkdtempSync(join(tmpdir(), 'chiptune-log-')), 'claude.log');
  addLines(logFile, [
    streamed({ type: 'content_block_start', content_block: { type: 'text', text: '' } }),
    streamed({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Planning the ' } }),
    streamed({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'three songs.' } }),
  ]);
  assert.equal(readLogNews(logFile, LOG_START, PROJECT).now, 'Planning the three songs.');
});

test('a stretch of thinking becomes a note with its tokens once it ends', () => {
  const logFile = join(mkdtempSync(join(tmpdir(), 'chiptune-log-')), 'claude.log');
  addLines(logFile, [
    { type: 'system', subtype: 'thinking_tokens', estimated_tokens: 3550 },
    { type: 'assistant', message: { content: [{ type: 'thinking', thinking: '' }] } },
  ]);
  const news = readLogNews(logFile, LOG_START, PROJECT);
  assert.deepEqual(news.notes, ['thought (3,550 tokens)']);
  assert.equal(news.now, null);
});
