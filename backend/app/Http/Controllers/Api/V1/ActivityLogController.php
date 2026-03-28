<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $activities = Activity::query()
            ->when($request->string('log_name')->toString(), fn ($query, $logName) => $query->where('log_name', $logName))
            ->when($request->string('event')->toString(), fn ($query, $event) => $query->where('event', $event))
            ->latest('id')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return ActivityResource::collection($activities);
    }
}
