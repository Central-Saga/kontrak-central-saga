<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentProofController extends Controller
{
    public function __invoke(Request $request, Payment $payment): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $media = $payment
            ->addMedia($validated['file'])
            ->withCustomProperties([
                'notes' => $validated['notes'] ?? null,
                'uploaded_by' => $request->user()?->email,
            ])
            ->toMediaCollection('payment_proofs', config('media-library.disk_name'));

        if ($payment->status !== 'verified') {
            $payment->update(['status' => 'pending_review']);
        }

        return response()->json([
            'message' => 'Payment proof uploaded successfully.',
            'data' => [
                'payment' => new PaymentResource($payment->fresh()->load('paymentTerm:id,contract_id,term_number,term_title,status')),
                'proof' => [
                    'id' => $media->id,
                    'name' => $media->name,
                    'file_name' => $media->file_name,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'url' => $media->getUrl(),
                    'notes' => $media->getCustomProperty('notes'),
                ],
            ],
        ], 201);
    }
}
