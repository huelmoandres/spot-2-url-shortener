<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShortenUrlRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            // Laravel's url rule accepts multiple schemes; regex restricts input to http/https.
            'url' => ['required', 'string', 'url', 'max:2048', 'regex:/^https?:\/\//i'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'url.required' => 'A URL is required.',
            'url.url' => 'The provided value is not a valid URL.',
            'url.max' => 'The URL must not exceed 2048 characters.',
            'url.regex' => 'Only http and https URLs are accepted.',
        ];
    }
}
