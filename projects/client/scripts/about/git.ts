/** Runs git in the current directory and returns its output, or throws with git's error. */
export async function git(args: ReadonlyArray<string>): Promise<string> {
  const { success, stdout, stderr } = await new Deno.Command('git', { args: [...args] }).output();
  const decoder = new TextDecoder();
  if (!success) throw new Error(`git ${args.at(0)} failed: ${decoder.decode(stderr).trim()}`);
  return decoder.decode(stdout);
}
