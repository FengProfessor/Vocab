import { TestRunner } from './test-harness';

const runner = new TestRunner('Deliberate Failure Fixture');
runner.it('passing test', () => {});
runner.it('deliberately failing test', () => {
  throw new Error('Injected failure to verify exit code 1');
});

const stats = runner.getStats();
process.exit(stats.failed > 0 ? 1 : 0);
