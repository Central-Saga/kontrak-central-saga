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
                <th>Contract Number</th>
                <th>Client</th>
                <th>Title</th>
                <th>Project</th>
                <th>Period</th>
                <th>Value</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($records as $contract)
                <tr>
                    <td>{{ $contract->contract_number }}</td>
                    <td>{{ $contract->client?->company_name }}</td>
                    <td>{{ $contract->contract_title }}</td>
                    <td>{{ $contract->project_name }}</td>
                    <td>{{ optional($contract->start_date)->format('Y-m-d') }} - {{ optional($contract->end_date)->format('Y-m-d') }}</td>
                    <td>{{ number_format((float) $contract->contract_value, 2, '.', ',') }}</td>
                    <td>{{ $contract->contract_status }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
