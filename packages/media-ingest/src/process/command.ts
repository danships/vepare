import { execa, type Options } from 'execa';

export type Command = { executable: string; args: string[]; label: string; timeout?: number; signal?: AbortSignal };
export type CommandResult = { stdout: string; stderr: string; exitCode: number };
const cap = (text: string) => text.slice(-8192);
export async function runCommand(command: Command): Promise<CommandResult> {
  try {
    const result = await execa(command.executable, command.args, {
      reject: false,
      timeout: command.timeout,
      cancelSignal: command.signal,
      all: false,
      maxBuffer: 8 * 1024 * 1024,
    } as Options);
    return {
      stdout: cap(String(result.stdout ?? '')),
      stderr: cap(String(result.stderr ?? '')),
      exitCode: result.exitCode ?? 1,
    };
  } catch (error) {
    const failure = error as { shortMessage?: string; stderr?: string; exitCode?: number };
    return {
      stdout: '',
      stderr: cap(failure.stderr || failure.shortMessage || String(error)),
      exitCode: failure.exitCode ?? 1,
    };
  }
}
