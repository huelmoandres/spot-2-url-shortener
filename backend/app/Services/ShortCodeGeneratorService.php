<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Url;
use RuntimeException;

class ShortCodeGeneratorService
{
    private const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    private const CODE_LENGTH = 7;
    private const MAX_ATTEMPTS = 5;

    /**
     * Generate a unique short code that doesn't exist in the database.
     *
     * @throws RuntimeException When unable to generate a unique code after max attempts.
     */
    public function generate(): string
    {
        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $code = $this->generateRandom();

            if (!Url::where('short_code', $code)->exists()) {
                return $code;
            }
        }

        throw new RuntimeException('Unable to generate a unique short code after ' . self::MAX_ATTEMPTS . ' attempts.');
    }

    /**
     * Generate a random Base58 string (no ambiguous chars: 0, O, I, l, 1).
     */
    private function generateRandom(): string
    {
        $alphabetLength = strlen(self::ALPHABET);
        $code = '';

        for ($i = 0; $i < self::CODE_LENGTH; $i++) {
            $code .= self::ALPHABET[random_int(0, $alphabetLength - 1)];
        }

        return $code;
    }
}
