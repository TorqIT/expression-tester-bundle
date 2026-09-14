<?php declare(strict_types=1);

namespace Torq\PimcoreExpressionTesterBundle\Service;

use Pimcore\Helper\SymfonyExpression\CalculatedFieldExpressionLanguage;
use Pimcore\Model\DataObject;
use Pimcore\Model\DataObject\ClassDefinition;
use Pimcore\Model\DataObject\Concrete;
use Symfony\Component\ExpressionLanguage\SyntaxError;

class ExpressionTesterService
{
    public function __construct(
        private CalculatedFieldExpressionLanguage $expressionLanguage,
    ) {}

    public function getFieldTree(int $objectId): array
    {
        $object = DataObject::getById($objectId);

        if (!$object instanceof Concrete) {
            throw new \InvalidArgumentException("Object #{$objectId} not found or is not a concrete DataObject.");
        }

        return [
            'objectId' => $objectId,
            'className' => $object->getClass()->getName(),
            'fields' => $this->buildFieldNodes($object->getClass()->getFieldDefinitions(), 'object'),
        ];
    }

    public function getRelatedClassFields(string $className, string $accessorPrefix = 'object'): array
    {
        $classDefinition = ClassDefinition::getByName($className);

        if (!$classDefinition) {
            throw new \InvalidArgumentException("Class '{$className}' not found.");
        }

        return [
            'className' => $className,
            'fields' => $this->buildFieldNodes($classDefinition->getFieldDefinitions(), $accessorPrefix),
        ];
    }

    public function evaluateExpression(int $objectId, string $expression): array
    {
        $object = DataObject::getById($objectId);

        if (!$object instanceof Concrete) {
            throw new \InvalidArgumentException("Object #{$objectId} not found or is not a concrete DataObject.");
        }

        try {
            $result = $this->expressionLanguage->evaluate($expression, ['object' => $object]);

            return [
                'success' => true,
                'result' => $this->serializeResult($result),
                'resultType' => $this->getResultType($result),
                'error' => null,
            ];
        } catch (SyntaxError $e) {
            return [
                'success' => false,
                'result' => null,
                'resultType' => null,
                'error' => 'Syntax error: ' . $e->getMessage(),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'result' => null,
                'resultType' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function buildFieldNodes(array $fieldDefinitions, string $accessorPrefix, ?string $localeParam = null): array
    {
        $nodes = [];

        foreach ($fieldDefinitions as $field) {
            if ($field instanceof ClassDefinition\Layout) {
                continue;
            }

            if ($field instanceof ClassDefinition\Data\Localizedfields) {
                $nodes[] = [
                    'name' => 'localizedfields',
                    'title' => $field->getTitle() ?: 'Localized Fields',
                    'fieldType' => 'localizedfields',
                    'expressionSnippet' => null,
                    'isRelational' => false,
                    'isExpandable' => false,
                    'children' => $this->buildFieldNodes($field->getFieldDefinitions(), $accessorPrefix, '"en"'),
                ];
                continue;
            }

            if ($field instanceof ClassDefinition\Data\Objectbricks) {
                $nodes[] = [
                    'name' => $field->getName(),
                    'title' => $field->getTitle() ?: $field->getName(),
                    'fieldType' => 'objectbricks',
                    'expressionSnippet' => null,
                    'isRelational' => false,
                    'isExpandable' => false,
                    'children' => $this->buildObjectbrickNodes($field, $accessorPrefix),
                ];
                continue;
            }

            if ($field instanceof ClassDefinition\Data\Fieldcollections) {
                $nodes[] = [
                    'name' => $field->getName(),
                    'title' => $field->getTitle() ?: $field->getName(),
                    'fieldType' => 'fieldcollections',
                    'expressionSnippet' => $accessorPrefix . '.get' . ucfirst($field->getName()) . '()',
                    'isRelational' => false,
                    'isExpandable' => false,
                    'children' => $this->buildFieldcollectionNodes($field, $accessorPrefix),
                ];
                continue;
            }

            if ($field instanceof ClassDefinition\Data\Block) {
                $nodes[] = [
                    'name' => $field->getName(),
                    'title' => $field->getTitle() ?: $field->getName(),
                    'fieldType' => 'block',
                    'expressionSnippet' => $accessorPrefix . '.get' . ucfirst($field->getName()) . '()',
                    'isRelational' => false,
                    'isExpandable' => false,
                    'children' => $this->buildBlockNodes($field, $accessorPrefix),
                ];
                continue;
            }

            if ($field instanceof ClassDefinition\Data\Classificationstore) {
                $nodes[] = [
                    'name' => $field->getName(),
                    'title' => $field->getTitle() ?: $field->getName(),
                    'fieldType' => 'classificationstore',
                    'expressionSnippet' => $accessorPrefix . '.get' . ucfirst($field->getName()) . '()',
                    'isRelational' => false,
                    'isExpandable' => false,
                    'children' => $this->buildClassificationStoreNodes($field, $accessorPrefix),
                ];
                continue;
            }

            if ($this->isDataQualityField($field)) {
                $nodes[] = $this->buildDataQualityNode($field, $accessorPrefix, $localeParam);
                continue;
            }

            $getterSuffix = $localeParam !== null ? '(' . $localeParam . ')' : '()';
            $isRelational = $this->isRelationalField($field);
            $relatedClassName = $isRelational ? $this->getRelatedClassName($field) : null;

            $nodes[] = [
                'name' => $field->getName(),
                'title' => $field->getTitle() ?: $field->getName(),
                'fieldType' => $field->getFieldType(),
                'expressionSnippet' => $accessorPrefix . '.get' . ucfirst($field->getName()) . $getterSuffix,
                'isRelational' => $isRelational,
                'isExpandable' => $isRelational && $relatedClassName !== null,
                'relatedClassName' => $relatedClassName,
                'children' => [],
            ];
        }

        return $nodes;
    }

    private function buildObjectbrickNodes(ClassDefinition\Data\Objectbricks $field, string $accessorPrefix): array
    {
        $nodes = [];
        $getterName = $accessorPrefix . '.get' . ucfirst($field->getName()) . '()';

        foreach ($field->getAllowedTypes() as $brickType) {
            $brickDefinition = DataObject\Objectbrick\Definition::getByKey($brickType);
            if (!$brickDefinition) {
                continue;
            }

            $brickAccessor = $getterName . '.get' . ucfirst($brickType) . '()';

            $nodes[] = [
                'name' => $brickType,
                'title' => $brickType,
                'fieldType' => 'objectbrick',
                'expressionSnippet' => null,
                'isRelational' => false,
                'isExpandable' => false,
                'children' => $this->buildFieldNodes($brickDefinition->getFieldDefinitions(), $brickAccessor),
            ];
        }

        return $nodes;
    }

    private function buildFieldcollectionNodes(ClassDefinition\Data\Fieldcollections $field, string $accessorPrefix): array
    {
        $nodes = [];
        $getterName = $accessorPrefix . '.get' . ucfirst($field->getName()) . '()';

        foreach ($field->getAllowedTypes() as $collectionType) {
            $collectionDefinition = DataObject\Fieldcollection\Definition::getByKey($collectionType);
            if (!$collectionDefinition) {
                continue;
            }

            $nodes[] = [
                'name' => $collectionType,
                'title' => $collectionType,
                'fieldType' => 'fieldcollection',
                'expressionSnippet' => null,
                'isRelational' => false,
                'isExpandable' => false,
                'children' => $this->buildFieldNodes($collectionDefinition->getFieldDefinitions(), $getterName),
            ];
        }

        return $nodes;
    }

    private function buildBlockNodes(ClassDefinition\Data\Block $field, string $accessorPrefix): array
    {
        $getterName = $accessorPrefix . '.get' . ucfirst($field->getName()) . '()';

        return $this->buildFieldNodes($field->getFieldDefinitions(), $getterName);
    }

    private function buildClassificationStoreNodes(ClassDefinition\Data\Classificationstore $field, string $accessorPrefix): array
    {
        $nodes = [];
        $storeAccessor = $accessorPrefix . '.get' . ucfirst($field->getName()) . '()';
        $storeId = $field->getStoreId();

        if (!$storeId) {
            return $nodes;
        }

        $groups = new DataObject\Classificationstore\GroupConfig\Listing();
        $groups->setCondition('storeId = ?', [$storeId]);

        foreach ($groups->load() as $group) {
            $groupNodes = [];

            $keyRelations = new DataObject\Classificationstore\KeyGroupRelation\Listing();
            $keyRelations->setCondition('groupId = ?', [$group->getId()]);

            foreach ($keyRelations->load() as $relation) {
                $keyConfig = DataObject\Classificationstore\KeyConfig::getById($relation->getKeyId());
                if (!$keyConfig) {
                    continue;
                }

                $localeArg = $field->isLocalized() ? ', "en"' : '';

                $groupNodes[] = [
                    'name' => $keyConfig->getName(),
                    'title' => $keyConfig->getName(),
                    'fieldType' => $keyConfig->getType(),
                    'expressionSnippet' => $storeAccessor . '.getLocalizedKeyValue(' . $group->getId() . ', ' . $keyConfig->getId() . $localeArg . ')',
                    'isRelational' => false,
                    'isExpandable' => false,
                    'children' => [],
                ];
            }

            $nodes[] = [
                'name' => 'group_' . $group->getId(),
                'title' => $group->getName() ?: ('Group #' . $group->getId()),
                'fieldType' => 'classificationstore_group',
                'expressionSnippet' => null,
                'isRelational' => false,
                'isExpandable' => false,
                'children' => $groupNodes,
            ];
        }

        return $nodes;
    }

    private function isDataQualityField(ClassDefinition\Data $field): bool
    {
        return $field->getFieldType() === 'dataQuality';
    }

    private function buildDataQualityNode(ClassDefinition\Data $field, string $accessorPrefix, ?string $localeParam): array
    {
        $getterSuffix = $localeParam !== null ? '(' . $localeParam . ')' : '()';
        $fieldAccessor = $accessorPrefix . '.get' . ucfirst($field->getName()) . $getterSuffix;

        return [
            'name' => $field->getName(),
            'title' => $field->getTitle() ?: $field->getName(),
            'fieldType' => 'dataQuality',
            'expressionSnippet' => $fieldAccessor,
            'isRelational' => false,
            'isExpandable' => false,
            'children' => [
                [
                    'name' => 'mark',
                    'title' => 'Mark (Score)',
                    'fieldType' => 'dataQuality_mark',
                    'expressionSnippet' => $fieldAccessor . '.getMark()',
                    'isRelational' => false,
                    'isExpandable' => false,
                    'children' => [],
                ],
                [
                    'name' => 'details',
                    'title' => 'Details',
                    'fieldType' => 'dataQuality_details',
                    'expressionSnippet' => $fieldAccessor . '.getDetails()',
                    'isRelational' => false,
                    'isExpandable' => false,
                    'children' => [],
                ],
            ],
        ];
    }

    private function isRelationalField(ClassDefinition\Data $field): bool
    {
        return $field instanceof ClassDefinition\Data\ManyToOneRelation
            || $field instanceof ClassDefinition\Data\ManyToManyRelation
            || $field instanceof ClassDefinition\Data\ManyToManyObjectRelation
            || $field instanceof ClassDefinition\Data\AdvancedManyToManyRelation
            || $field instanceof ClassDefinition\Data\AdvancedManyToManyObjectRelation
            || $field instanceof ClassDefinition\Data\ReverseObjectRelation;
    }

    private function getRelatedClassName(ClassDefinition\Data $field): ?string
    {
        if (method_exists($field, 'getClasses') && !empty($field->getClasses())) {
            $classes = $field->getClasses();
            $first = reset($classes);
            return is_array($first) ? ($first['classes'] ?? null) : (string) $first;
        }

        return null;
    }

    private function serializeResult(mixed $result): string
    {
        if ($result === null) {
            return 'null';
        }

        if (is_scalar($result)) {
            return (string) $result;
        }

        if ($result instanceof Concrete) {
            return sprintf('%s #%d (%s)', $result->getClassName(), $result->getId(), $result->getFullPath());
        }

        if ($result instanceof DataObject) {
            return sprintf('DataObject #%d (%s)', $result->getId(), $result->getFullPath());
        }

        if (is_array($result)) {
            return json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) ?: '[]';
        }

        if (is_iterable($result)) {
            $items = [];
            foreach ($result as $item) {
                $items[] = $this->serializeResult($item);
            }
            return json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) ?: '[]';
        }

        if (is_object($result)) {
            return method_exists($result, '__toString') ? (string) $result : get_class($result);
        }

        return (string) $result;
    }

    private function getResultType(mixed $result): string
    {
        return match (true) {
            $result === null => 'null',
            is_bool($result) => 'boolean',
            is_int($result) => 'integer',
            is_float($result) => 'float',
            is_string($result) => 'string',
            is_array($result) => 'array',
            $result instanceof Concrete => 'DataObject (' . $result->getClassName() . ')',
            is_object($result) => get_class($result),
            default => gettype($result),
        };
    }
}
