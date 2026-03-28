<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #182127; }
        h1 { margin-bottom: 4px; }
        p { margin-top: 0; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f3f4f6; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <p>Generated at: {{ $generatedAt->format('Y-m-d H:i:s') }}</p>

    <table>
        <thead>
            <tr>
                <th>Contract</th>
                <th>Project</th>
                <th>Date</th>
                <th>Title</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Milestone</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($records as $progress)
                <tr>
                    <td>{{ $progress->contract?->contract_number }}</td>
                    <td>{{ $progress->contract?->project_name }}</td>
                    <td>{{ optional($progress->progress_date)->format('Y-m-d') }}</td>
                    <td>{{ $progress->progress_title }}</td>
                    <td>{{ $progress->percentage }}%</td>
                    <td>{{ $progress->status }}</td>
                    <td>{{ $progress->milestone_reference }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
