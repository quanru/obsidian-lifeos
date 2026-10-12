/** Register an independent query name, keeping occupied compatibility aliases intact. */
export function registerQueryLanguages(register: (language: string) => void): void {
  register('LifeOSOpen');
  for (const language of ['PeriodicPARA', 'LifeOS']) {
    try {
      register(language);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.message !== `Code block postprocessor for language ${language} is already registered`
      )
        throw error;
    }
  }
}

export class GlobalHelperPublisher {
  private current?: object;

  constructor(private readonly globals: { LifeOSOpen?: unknown; PeriodicPARA?: unknown; LifeOS?: unknown }) {}

  publish(helpers: object): void {
    this.globals.LifeOSOpen = helpers;
    for (const name of ['PeriodicPARA', 'LifeOS'] as const) {
      if (this.globals[name] === undefined || this.globals[name] === this.current) this.globals[name] = helpers;
    }
    this.current = helpers;
  }

  clear(): void {
    for (const name of ['LifeOSOpen', 'PeriodicPARA', 'LifeOS'] as const) {
      if (this.globals[name] === this.current) delete this.globals[name];
    }
    this.current = undefined;
  }
}
