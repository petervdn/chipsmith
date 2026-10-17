// What Claude is doing now is read from its streamed log: thinking, then a file as it is written,
// then, once the call is complete, the note that says it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LOG_START, getLaterStep, readLogNews, readRunTokens } from './claude-log.ts';

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
  assert.equal(thinking.nowTokens, 2400);

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
  assert.equal(writing.now, 'writing the script (3 KB so far)');
  assert.deepEqual(writing.notes, []);

  addLines(logFile, [
    {
      type: 'assistant',
      message: {
        content: [
          { type: 'tool_use', name: 'Write', input: { file_path: SCRIPT, content: 'a\nb\nc' } },
        ],
      },
    },
  ]);
  const written = readLogNews(logFile, writing, PROJECT);
  assert.equal(written.notes.length, 1);
  assert.equal(written.notes[0]?.text, 'writing the script (3 lines)');
  assert.equal(written.notes[0]?.stage, 'writing', 'a write of the script shows the job writing');
  assert.ok((written.notes[0]?.tokens ?? 0) > 750, 'the tool call has the tokens of its input');
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

test('a stretch of thinking becomes a note once it ends, its tokens beside its text', () => {
  const logFile = join(mkdtempSync(join(tmpdir(), 'chiptune-log-')), 'claude.log');
  addLines(logFile, [
    { type: 'system', subtype: 'thinking_tokens', estimated_tokens: 3550 },
    { type: 'assistant', message: { content: [{ type: 'thinking', thinking: '' }] } },
  ]);
  const news = readLogNews(logFile, LOG_START, PROJECT);
  assert.deepEqual(news.notes, [{ text: 'thinking it over', tokens: 3550, stage: null }]);
  assert.equal(news.now, null);
});

test('thinking whose text the log has is its first sentence', () => {
  const logFile = join(mkdtempSync(join(tmpdir(), 'chiptune-log-')), 'claude.log');
  const thinking = 'The bass should walk in fifths. Then the lead answers it.';
  addLines(logFile, [
    { type: 'system', subtype: 'thinking_tokens', estimated_tokens: 120 },
    { type: 'assistant', message: { content: [{ type: 'thinking', thinking }] } },
  ]);
  const news = readLogNews(logFile, LOG_START, PROJECT);
  assert.deepEqual(news.notes, [
    { text: 'The bass should walk in fifths.', tokens: 120, stage: null },
  ]);
});

test("a run's tokens add up from its messages, and its result gives the exact total", () => {
  const logFile = join(mkdtempSync(join(tmpdir(), 'chiptune-log-')), 'claude.log');
  addLines(logFile, [
    streamed({ type: 'message_delta', usage: { output_tokens: 300 } }),
    streamed({ type: 'message_delta', usage: { output_tokens: 1200 } }),
  ]);
  assert.equal(readLogNews(logFile, LOG_START, PROJECT).tokens, 1500);
  addLines(logFile, [
    { type: 'result', result: 'done', is_error: false, usage: { output_tokens: 1520 } },
  ]);
  assert.equal(readLogNews(logFile, LOG_START, PROJECT).result?.tokens, 1520);
  assert.equal(readRunTokens(logFile), 1520);
});

test('the furthest compose step the tool calls read show', () => {
  const logFile = join(mkdtempSync(join(tmpdir(), 'chiptune-log-')), 'claude.log');
  function toolCall(name: string, input: object): object {
    return { type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } };
  }
  addLines(logFile, [toolCall('Skill', { skill: 'write-song' })]);
  const preparing = readLogNews(logFile, LOG_START, PROJECT);
  assert.equal(preparing.composeStep, null);
  addLines(logFile, [
    toolCall('Write', { file_path: SCRIPT, content: 'x' }),
    toolCall('Bash', { command: `node make/check-script.ts ${SCRIPT}` }),
    toolCall('Edit', { file_path: SCRIPT, new_string: 'y' }),
  ]);
  assert.equal(readLogNews(logFile, preparing, PROJECT).composeStep, 'checking');
  assert.equal(getLaterStep('checking', 'writing'), 'checking');
  assert.equal(getLaterStep(null, 'writing'), 'writing');
});
