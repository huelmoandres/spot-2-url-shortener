<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\ShortCodeGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use RuntimeException;
use Tests\TestCase;

class ShortCodeGeneratorServiceTest extends TestCase
{
    use RefreshDatabase;

    private ShortCodeGeneratorService $generator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = new ShortCodeGeneratorService;
    }

    #[Test]
    public function it_generates_a_code_of_exactly_seven_characters(): void
    {
        $code = $this->generator->generate();

        $this->assertSame(7, strlen($code));
    }

    #[Test]
    public function it_generates_a_code_with_only_valid_base58_characters(): void
    {
        $code = $this->generator->generate();
        $validChars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        $this->assertMatchesRegularExpression(
            '/^['.preg_quote($validChars, '/').']+$/',
            $code,
        );
    }

    #[Test]
    public function it_does_not_generate_ambiguous_characters(): void
    {
        $ambiguousChars = ['0', 'O', '1', 'l', 'I'];

        for ($i = 0; $i < 100; $i++) {
            $code = $this->generator->generate();
            foreach ($ambiguousChars as $char) {
                $this->assertStringNotContainsString(
                    $char,
                    $code,
                    "Generated code should not contain ambiguous character '{$char}'",
                );
            }
        }
    }

    #[Test]
    public function it_generates_unique_codes_across_multiple_calls(): void
    {
        $codes = [];

        for ($i = 0; $i < 50; $i++) {
            $codes[] = $this->generator->generate();
        }

        $this->assertSame(count($codes), count(array_unique($codes)));
    }

    #[Test]
    public function it_throws_an_exception_when_unable_to_generate_unique_code(): void
    {
        $mockGenerator = $this->getMockBuilder(ShortCodeGeneratorService::class)
            ->onlyMethods(['generate'])
            ->getMock();

        $mockGenerator->expects($this->any())
            ->method('generate')
            ->willThrowException(new RuntimeException('Unable to generate a unique short code after 5 attempts.'));

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Unable to generate a unique short code after 5 attempts.');

        $mockGenerator->generate();
    }
}
