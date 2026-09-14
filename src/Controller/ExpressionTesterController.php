<?php declare(strict_types=1);

namespace Torq\PimcoreExpressionTesterBundle\Controller;

use Pimcore\Bundle\StudioBackendBundle\Controller\AbstractApiController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Torq\PimcoreExpressionTesterBundle\Service\ExpressionTesterService;

#[Route('/expression-tester', name: 'torq_expression_tester_')]
#[IsGranted('ROLE_PIMCORE_ADMIN')]
class ExpressionTesterController extends AbstractApiController
{
    public function __construct(
        private ExpressionTesterService $expressionTesterService,
    ) {}

    #[Route('/fields/{id}', name: 'fields', methods: ['GET'])]
    public function getFields(int $id): JsonResponse
    {
        try {
            return new JsonResponse($this->expressionTesterService->getFieldTree($id));
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 404);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/evaluate', name: 'evaluate', methods: ['POST'])]
    public function evaluate(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (!isset($data['objectId'], $data['expression'])) {
                return new JsonResponse(['error' => 'objectId and expression are required'], 400);
            }

            return new JsonResponse(
                $this->expressionTesterService->evaluateExpression((int) $data['objectId'], (string) $data['expression'])
            );
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 404);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/related-fields/{className}', name: 'related_fields', methods: ['GET'])]
    public function getRelatedFields(string $className, Request $request): JsonResponse
    {
        try {
            $accessorPrefix = $request->query->getString('accessorPrefix', 'object');

            return new JsonResponse(
                $this->expressionTesterService->getRelatedClassFields($className, $accessorPrefix)
            );
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 404);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
