const LEAK_CHECK = new URL('../leak-check.sh', import.meta.url).pathname;

/** Whether text passes the repo's leak check, the same patterns every tracked file and commit is held to. */
export async function passesLeakCheck(text: string): Promise<boolean> {
  const file = await Deno.makeTempFile({ prefix: 'og-about-', suffix: '.txt' });
  try {
    await Deno.writeTextFile(file, text);
    const { success } = await new Deno.Command('bash', { args: [LEAK_CHECK, '--text', file], stdout: 'null' }).output();
    return success;
  } finally {
    await Deno.remove(file);
  }
}
