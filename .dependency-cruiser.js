/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-controllers-to-repositories',
      comment: 'Controllers must never import repositories directly. Access must flow through services.',
      severity: 'error',
      from: { path: '^src/controllers' },
      to: { path: '^src/repositories' }
    },
    {
      name: 'no-domain-to-outer-layers',
      comment: 'Domain entities and rules must be pure and never import from controllers, services, or repositories.',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/(controllers|services|repositories)' }
    },
    {
      name: 'no-repositories-to-controllers-or-services',
      comment: 'Repositories must never import controllers or services.',
      severity: 'error',
      from: { path: '^src/repositories' },
      to: { path: '^src/(controllers|services)' }
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies across modules are strictly forbidden.',
      severity: 'error',
      from: {},
      to: { circular: true }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
