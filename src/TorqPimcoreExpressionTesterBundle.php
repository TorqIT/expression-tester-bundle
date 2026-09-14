<?php declare(strict_types=1);

namespace Torq\PimcoreExpressionTesterBundle;

use Pimcore\Extension\Bundle\AbstractPimcoreBundle;

class TorqPimcoreExpressionTesterBundle extends AbstractPimcoreBundle
{
    public function getPath(): string
    {
        return \dirname(__DIR__);
    }
}
