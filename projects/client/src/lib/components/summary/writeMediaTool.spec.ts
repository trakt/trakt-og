import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { writeMediaTool } from './writeMediaTool.ts';
import { reportReasons } from './reportReasons.ts';
import { validateReport } from './validateReport.ts';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const target = { type: 'comment', id: 7, title: 'Comment by Tyler', href: '/comments/7' } as const;
const report = { kind: 'report', target, reason: 'duplicate', message: '  Original: /comments/3  ' } as const;

function respond(status: number, body?: unknown) {
  server.use(
    http.post('https://apiz.trakt.tv/*', () =>
      body === undefined ? new HttpResponse(null, { status }) : HttpResponse.json(body, { status }),
    ),
  );
}

describe('validateReport', () => {
  it('should require a supported reason and a nonblank message', () => {
    expect(validateReport({ type: 'comment', reason: '', message: '  ' })).toEqual({ reason: true, message: true });
    expect(validateReport({ type: 'user', reason: 'metadata', message: 'Wrong' }).reason).toBe(true);
    expect(validateReport({ type: 'user', reason: 'spam', message: 'Selling things' })).toEqual({
      reason: false,
      message: false,
    });
  });
  it('should allow a blank message for Not English', () => {
    expect(validateReport({ type: 'user', reason: 'language', message: '' })).toEqual({
      reason: false,
      message: false,
    });
  });
  it('should allow a blank message on a comment for Not English and Too Short only', () => {
    expect(validateReport({ type: 'comment', reason: 'too_short', message: '' }).message).toBe(false);
    expect(validateReport({ type: 'comment', reason: 'spoilers', message: ' ' }).message).toBe(true);
    expect(validateReport({ type: 'user', reason: 'too_short', message: 'Short' }).reason).toBe(true);
  });
  it('should offer only the reasons the API accepts for a user', () => {
    expect(reportReasons('user').map(({ value }) => value)).toEqual(['adult', 'language', 'spam', 'other']);
    expect(reportReasons('comment')).toHaveLength(11);
  });
});

describe('writeMediaTool', () => {
  it('should send only the API reason and trimmed message and accept an empty 201', async () => {
    let received: unknown;
    server.use(
      http.post('https://apiz.trakt.tv/comments/7/report', async ({ request }) => {
        received = await request.json();
        expect(request.headers.get('trakt-api-key')).toBeTruthy();
        return new HttpResponse(null, { status: 201 });
      }),
    );
    const result = await writeMediaTool({ fetch, action: report });
    expect(received).toEqual({ reason: 'duplicate', message: 'Original: /comments/3' });
    expect(result).toEqual({ ok: true, message: "Comment reported! Thanks for the info, we'll investigate soon." });
  });

  it('should send a blank Too Short comment report', async () => {
    let received: unknown;
    server.use(
      http.post('https://apiz.trakt.tv/comments/7/report', async ({ request }) => {
        received = await request.json();
        return new HttpResponse(null, { status: 201 });
      }),
    );
    const result = await writeMediaTool({ fetch, action: { ...report, reason: 'too_short', message: '' } });
    expect(received).toEqual({ reason: 'too_short', message: '' });
    expect(result.ok).toBe(true);
  });

  it('should report a user by their slug at the users route', async () => {
    server.use(
      http.post('https://apiz.trakt.tv/users/someone%20else/report', () => new HttpResponse(null, { status: 201 })),
    );
    expect(
      await writeMediaTool({
        fetch,
        action: {
          ...report,
          reason: 'other',
          target: { type: 'user', id: 'someone else', title: 'Someone Else', href: '/users/someone-else' },
        },
      }),
    ).toEqual({ ok: true, message: "User reported! Thanks for the info, we'll investigate soon." });
  });

  it('should reject invalid reports before sending a request', async () => {
    expect((await writeMediaTool({ fetch, action: { ...report, message: ' ' } })).ok).toBe(false);
  });

  it.each([
    [409, 'report_pending', 'You already have a pending report for this comment!'],
    [409, 'recently_reported', "You've recently reported this comment, please try again soon!"],
    [
      409,
      'reporting_banned',
      'Your reporting privileges have been temporarily suspended. Please contact support if you have any questions.',
    ],
    [404, 'comment_not_found', 'This comment no longer exists.'],
    [400, 'invalid_reason', 'Please choose a different reason.'],
  ])('should explain a %i %s refusal', async (status, error, message) => {
    respond(status, { error });
    expect(await writeMediaTool({ fetch, action: report })).toEqual({ ok: false, status, message });
  });

  it('should name the user when a reported user is gone', async () => {
    respond(404, { error: 'user_not_found' });
    const user = { type: 'user', id: 'gone', title: 'Gone', href: '/users/gone' } as const;
    expect((await writeMediaTool({ fetch, action: { ...report, reason: 'spam', target: user } })).message).toBe(
      'This user no longer exists.',
    );
  });

  it('should fall back to the generic failure for an unknown code', async () => {
    respond(400, { error: 'invalid_request_body' });
    expect((await writeMediaTool({ fetch, action: report })).message).toBe(
      'Doh! We ran into some sort of error. Please try again.',
    );
  });

  it.each([401, 403, 429, 500])('should fail without a success message on %i', async (status) => {
    respond(status);
    expect((await writeMediaTool({ fetch, action: report })).ok).toBe(false);
  });

  it('should reject a malformed proxied response', async () => {
    respond(201, { error: 42 });
    expect((await writeMediaTool({ fetch, action: report })).ok).toBe(false);
  });

  it('should handle network failure', async () => {
    server.use(http.post('https://apiz.trakt.tv/*', () => HttpResponse.error()));
    expect((await writeMediaTool({ fetch, action: report })).ok).toBe(false);
  });
});
