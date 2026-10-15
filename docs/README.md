> Purpose: help contributors find the current development, testing and operations documentation.

# Documentation

Start with the [project overview](../README.md) or its [Vietnamese version](../README.vi.md).

| I want to… | Read |
| --- | --- |
| Run LingoPro locally | [Development setup](development.md) |
| Make a contribution | [Contribution guide](../CONTRIBUTING.md) |
| Understand the production system | [Production architecture](architecture/production.md) |
| Understand what tests actually cover | [Test classification and baseline](testing/test-classification.md) |
| Prepare an approved production release | [Deployment runbook](operations/production-deploy.md) |
| Work with database migrations | [Database migrations](operations/database-migrations.md) |
| Plan recovery from a release issue | [Rollback](operations/rollback.md) |
| Understand database backups | [Database backup](operations/database-backup.md) |

## Reading the repository

Current workflows and deploy scripts are the source of truth for operations. The linked guides explain that flow; [AGENTS.md](../AGENTS.md) records the operating rules. [progress.md](../progress.md) is a historical checkpoint log.

Other documents include research, proposals, audits and earlier infrastructure plans. Their presence does not mean a feature is shipped or an old deployment method is supported. The canonical release path is documented in the deployment runbook.
