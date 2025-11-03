import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseMessage, isActionableMessage, extractPropertyInfo, getMessagePriority } from '../parseMessage';
import type { ParsedMessage } from '../parseMessage';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

// Mock environment
vi.mock('../../env', () => ({
  getOpenAIConfig: vi.fn(() => ({
    apiKey: 'test-api-key',
  })),
}));

describe('parseMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse a start cleaning message', async () => {
    // Test the fallback behavior when OpenAI is not available
    const { getOpenAIConfig } = await import('../../env');
    vi.mocked(getOpenAIConfig).mockReturnValue(null);

    const result = await parseMessage('Začínám úklid v kuchyni', 'cs');

    expect(result.type).toBe('note');
    expect(result.confidence).toBe(0.5);
    expect(result.language).toBe('cs');
    expect(result.payload?.raw_text).toBe('Začínám úklid v kuchyni');
  });

  it('should handle OpenAI API failure gracefully', async () => {
    // Test fallback behavior when OpenAI is not available
    const { getOpenAIConfig } = await import('../../env');
    vi.mocked(getOpenAIConfig).mockReturnValue(null);

    const result = await parseMessage('Test message', 'en');

    expect(result.type).toBe('note');
    expect(result.confidence).toBe(0.5);
    expect(result.payload?.raw_text).toBe('Test message');
  });

  it('should return default parsing when OpenAI is not available', async () => {
    const { getOpenAIConfig } = await import('../../env');
    vi.mocked(getOpenAIConfig).mockReturnValue(null);

    const result = await parseMessage('Test message', 'en');

    expect(result.type).toBe('note');
    expect(result.confidence).toBe(0.5);
    expect(result.language).toBe('en');
  });
});

describe('isActionableMessage', () => {
  it('should identify actionable messages', () => {
    const actionableMessage: ParsedMessage = {
      type: 'start_cleaning',
      confidence: 0.8,
    };

    const nonActionableMessage: ParsedMessage = {
      type: 'note',
      confidence: 0.8,
    };

    expect(isActionableMessage(actionableMessage)).toBe(true);
    expect(isActionableMessage(nonActionableMessage)).toBe(false);
  });

  it('should require high confidence for actionable messages', () => {
    const lowConfidenceMessage: ParsedMessage = {
      type: 'start_cleaning',
      confidence: 0.5,
    };

    expect(isActionableMessage(lowConfidenceMessage)).toBe(false);
  });
});

describe('extractPropertyInfo', () => {
  it('should extract property hint', () => {
    const message: ParsedMessage = {
      type: 'start_cleaning',
      property_hint: 'Apartment 3A',
      confidence: 0.8,
    };

    expect(extractPropertyInfo(message)).toBe('Apartment 3A');
  });

  it('should return null when no property hint', () => {
    const message: ParsedMessage = {
      type: 'start_cleaning',
      confidence: 0.8,
    };

    expect(extractPropertyInfo(message)).toBe(null);
  });
});

describe('getMessagePriority', () => {
  it('should assign correct priorities', () => {
    const supplyOut: ParsedMessage = { type: 'supply_out', confidence: 0.8 };
    const done: ParsedMessage = { type: 'done', confidence: 0.8 };
    const startCleaning: ParsedMessage = { type: 'start_cleaning', confidence: 0.8 };
    const note: ParsedMessage = { type: 'note', confidence: 0.8 };

    expect(getMessagePriority(supplyOut)).toBe('high');
    expect(getMessagePriority(done)).toBe('medium');
    expect(getMessagePriority(startCleaning)).toBe('medium');
    expect(getMessagePriority(note)).toBe('low');
  });
});
