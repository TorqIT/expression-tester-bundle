# Pimcore Expression Tester Bundle [PREVIEW]

A Pimcore Studio tool for testing Symfony expressions against DataObjects. Pick an object, browse its fields, build expressions via point-and-click, and see live evaluation results — all without leaving the admin panel.

**Status:** Preview — not intended for production use.

## Features

- Browse any DataObject's field definitions with a type-tagged tree view
- Click fields to build getter-chained expressions (`object.getFirstName() ~ " " ~ object.getLastName()`)
- Expand relational fields to navigate into related classes
- Localized field and Objectbrick support
- Live expression evaluation against real DataObject instances
- Automatically includes any custom expression functions registered via `pimcore.calculated_value.expression_language_provider` (e.g. `toLower()`, `regexReplace()`)
- Common snippet dropdown for concatenation, ternary, regex, and more
- Admin-only access (`ROLE_PIMCORE_ADMIN`)

## Requirements

- Pimcore 12
- Pimcore Studio UI Bundle (`pimcore/studio-ui-bundle`)
- Pimcore Studio Backend Bundle (`pimcore/studio-backend-bundle`)

## Installation

Register the bundle (e.g. in `src/Kernel.php`'s `registerBundlesToCollection()`):

```php
use Torq\PimcoreExpressionTesterBundle\TorqPimcoreExpressionTesterBundle;

$collection->addBundle(new TorqPimcoreExpressionTesterBundle());
```

Then install assets and clear the cache:

```bash
bin/console assets:install --symlink
bin/console cache:clear
```

Open Studio and navigate to **Tools > Expression Tester**.

## Usage

1. Open Pimcore Studio
2. Navigate to **Tools > Expression Tester** in the main navigation
3. Click **Select DataObject** to pick any concrete DataObject
4. Browse the field tree on the left — click the **+** button to insert a field's getter into the expression
5. Edit the expression manually or use the **Common Snippets** dropdown
6. Click **Evaluate** (or press `Ctrl+Enter`) to see the result

## API Endpoints

All endpoints require `ROLE_PIMCORE_ADMIN` and are prefixed with the Studio backend URL prefix (typically `/pimcore-studio/api`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/expression-tester/fields/{id}` | Get field tree for a DataObject |
| POST | `/expression-tester/evaluate` | Evaluate an expression against a DataObject |
| GET | `/expression-tester/related-fields/{className}` | Get fields for a related class |


# License

This bundle is licensed under the Pimcore Open Core License (POCL)
and is intended for use with Pimcore Platform 2025.1 and newer.

See LICENSE.md for full license text.
