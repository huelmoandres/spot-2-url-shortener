<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GetUrlsQueryRequest extends FormRequest
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
            // per_page capped at 100: prevents DoS via memory exhaustion
            // (e.g. ?per_page=1000000 would attempt to load millions of rows)
            'page' => ['integer', 'min:1'],
            'per_page' => ['integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'in:newest,oldest'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'per_page.max' => 'Maximum allowed per_page is 100.',
            'per_page.min' => 'per_page must be at least 1.',
            'page.min' => 'page must be at least 1.',
            'sort.in' => 'sort must be one of: newest, oldest.',
        ];
    }
}
