<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Mail\PaymentTermReminderMail;
use App\Mail\ProjectProgressReminderMail;
use App\Models\PaymentTerm;
use App\Models\ProjectProgress;
use App\Models\User;
use App\Support\OperationalDataAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ReminderController extends Controller
{
    public function sendPaymentTermReminder(Request $request, PaymentTerm $paymentTerm): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless(OperationalDataAccess::canAccessPaymentTerm($paymentTerm, $user), 403);

        $paymentTerm->load('contract.client');
        $client = $paymentTerm->contract?->client;

        abort_unless($client && $client->email, 422, 'Email klien tidak tersedia.');

        Mail::to($client->email)->send(new PaymentTermReminderMail($paymentTerm));

        return response()->json([
            'message' => 'Pengingat pembayaran berhasil dikirim ke '.$client->email,
        ]);
    }

    public function sendProjectProgressReminder(Request $request, ProjectProgress $projectProgress): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless(OperationalDataAccess::canAccessProjectProgress($projectProgress, $user), 403);

        $projectProgress->load('contract.client');
        $client = $projectProgress->contract?->client;

        abort_unless($client && $client->email, 422, 'Email klien tidak tersedia.');

        Mail::to($client->email)->send(new ProjectProgressReminderMail($projectProgress));

        return response()->json([
            'message' => 'Pengingat progres proyek berhasil dikirim ke '.$client->email,
        ]);
    }
}
