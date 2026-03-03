#!/usr/bin/env python3
"""
Historical Data Backfill Generator for CatchWeight Analytics

Generates 90 days of realistic SAP goods receipt transactions with:
- Material-specific weight variance patterns
- Seasonal volume adjustments
- Business-realistic transaction timing
- Sequential batch tracking

Usage:
    python generate_backfill.py --start-date 2025-12-03 --end-date 2026-02-19 --seed 42
"""

import random
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

# Material variance profiles based on existing MARM conversions
# Format: {material_id: {nominal_lb_per_cs, mean_drift_pct, std_dev_pct}}
MATERIAL_PROFILES = {
    # High variance materials (natural size/weight variability)
    'CHKWNG-002': {
        'nominal_lb_per_cs': 30.0,
        'mean_drift': 0.2,  # Slight over-delivery tendency
        'std_dev': 2.0,     # High variance ±2%
        'description': 'Chicken Wings'
    },
    'PRKRIB-004': {
        'nominal_lb_per_cs': 35.0,
        'mean_drift': 0.8,  # Consistent over-delivery
        'std_dev': 1.5,
        'description': 'Pork Ribs'
    },
    'CHKSKW-013': {
        'nominal_lb_per_cs': 12.0,  # CORRECTED: was 22, actual MARM is 12
        'mean_drift': 0.1,
        'std_dev': 1.8,     # Marinade absorption varies
        'description': 'Chicken Skewers'
    },
    'CHKWHL-007': {
        'nominal_lb_per_cs': 40.0,  # CORRECTED: was 38, actual MARM is 40
        'mean_drift': 0.3,
        'std_dev': 1.6,     # Whole birds vary
        'description': 'Whole Chicken'
    },

    # Medium variance materials
    'CHKBRST-001': {
        'nominal_lb_per_cs': 25.0,
        'mean_drift': 0.0,  # Balanced, no systematic bias
        'std_dev': 0.8,
        'description': 'Chicken Breast'
    },
    'CHKTHG-003': {
        'nominal_lb_per_cs': 28.0,
        'mean_drift': 0.1,
        'std_dev': 1.0,
        'description': 'Chicken Thighs'
    },
    'BFGRD-005': {
        'nominal_lb_per_cs': 20.0,
        'mean_drift': -1.0,  # Moisture loss during processing
        'std_dev': 0.8,
        'description': 'Ground Beef'
    },
    'PRKCHP-008': {
        'nominal_lb_per_cs': 30.0,  # CORRECTED: was 32, actual MARM is 30
        'mean_drift': -0.3,
        'std_dev': 1.2,
        'description': 'Pork Chops'
    },
    'PRKSSG-009': {
        'nominal_lb_per_cs': 18.0,  # CORRECTED: was 24, actual MARM is 18
        'mean_drift': 0.2,
        'std_dev': 1.1,
        'description': 'Pork Sausage'
    },
    'CHKTND-006': {
        'nominal_lb_per_cs': 22.0,  # CORRECTED: was 26, actual MARM is 22
        'mean_drift': 0.0,
        'std_dev': 0.7,
        'description': 'Chicken Tenders'
    },

    # Low variance materials (value-added, controlled processing)
    'CHKNGT-012': {
        'nominal_lb_per_cs': 15.0,
        'mean_drift': 0.1,
        'std_dev': 0.3,     # Pre-formed, very consistent
        'description': 'Chicken Nuggets'
    },
    'BFPTTY-011': {
        'nominal_lb_per_cs': 24.0,  # CORRECTED: was 16, actual MARM is 24
        'mean_drift': 0.0,
        'std_dev': 0.4,     # Pre-formed patties
        'description': 'Beef Patties'
    },
    'BFSTRP-010': {
        'nominal_lb_per_cs': 45.0,  # CORRECTED: was 40, actual MARM is 45
        'mean_drift': -0.2,
        'std_dev': 0.6,     # Premium cuts, less variance
        'description': 'Beef Strip Steaks'
    },
}

# Plants and storage locations
PLANTS = ['P100', 'P200']
STORAGE_LOCS = {
    'P100': ['S001', 'S002'],  # Arkansas: Main + Cold Storage
    'P200': ['S001', 'S002']   # Missouri: Main + Cold Storage
}

# User IDs for transaction posting
USERS = ['TYSUSER01', 'TYSUSER02', 'TYSUSER03']


def generate_date_range(start_date: datetime, end_date: datetime) -> List[Tuple[datetime, int]]:
    """
    Generate business days with volume weighting.

    Returns list of (date, num_documents) tuples accounting for:
    - Day of week patterns (Mon-Thu busy, Fri slower, Sat minimal, Sun closed)
    - Seasonal patterns (holiday surge, post-holiday slowdown)
    """
    dates_with_volumes = []
    current = start_date

    while current <= end_date:
        dow = current.weekday()  # 0=Monday, 6=Sunday

        # Skip Sundays (closed)
        if dow == 6:
            current += timedelta(days=1)
            continue

        # Base volume by day of week
        if dow < 4:  # Mon-Thu
            base_docs = random.randint(3, 5)
        elif dow == 4:  # Fri
            base_docs = random.randint(2, 3)
        else:  # Sat
            base_docs = random.randint(0, 1)

        # Seasonal multiplier
        if current.month == 12 and current.day >= 21:
            seasonal = 1.3  # Holiday surge (+30%)
        elif current.month == 1 and current.day <= 7:
            seasonal = 0.8  # Post-holiday slowdown (-20%)
        elif current.month >= 2:
            seasonal = 1.1  # Spring ramp-up (+10%)
        else:
            seasonal = 1.0

        num_docs = max(0, int(base_docs * seasonal))

        if num_docs > 0:
            dates_with_volumes.append((current, num_docs))

        current += timedelta(days=1)

    return dates_with_volumes


def calculate_weight_with_variance(material_id: str, quantity_cs: int) -> Tuple[float, float]:
    """
    Calculate actual weight with realistic variance.

    Args:
        material_id: Material identifier
        quantity_cs: Quantity in base UoM (cases)

    Returns:
        (actual_weight_lb, drift_pct)
    """
    profile = MATERIAL_PROFILES[material_id]
    nominal_lb_per_cs = profile['nominal_lb_per_cs']

    # Expected weight based on MARM conversion
    expected_lb = quantity_cs * nominal_lb_per_cs

    # Generate variance using normal distribution
    drift_pct = random.gauss(profile['mean_drift'], profile['std_dev'])

    # Cap at reasonable bounds (-3% to +3%)
    drift_pct = max(-3.0, min(3.0, drift_pct))

    # Calculate actual weight
    actual_lb = expected_lb * (1 + drift_pct / 100.0)

    return round(actual_lb, 2), round(drift_pct, 4)


def generate_batch_id(date: datetime) -> str:
    """Generate batch ID in SAP format: B{YYYYMMDD}"""
    return f"B{date.strftime('%Y%m%d')}"


def generate_posting_time(date: datetime) -> datetime:
    """
    Generate realistic posting time based on business hours.

    Time-of-day distribution:
    - 40% between 07:00-09:00 (morning deliveries)
    - 35% between 09:00-12:00
    - 20% between 12:00-15:00
    - 5% between 15:00-17:00
    """
    hour_weights = [
        (7, 9, 40),   # Morning peak
        (9, 12, 35),  # Mid-morning
        (12, 15, 20), # Afternoon
        (15, 17, 5),  # Late arrivals
    ]

    # Choose time slot
    rand_val = random.randint(1, 100)
    cumulative = 0
    for start_hour, end_hour, weight in hour_weights:
        cumulative += weight
        if rand_val <= cumulative:
            hour = random.randint(start_hour, end_hour - 1)
            minute = random.randint(0, 59)
            return date + timedelta(hours=hour, minutes=minute)

    # Fallback (shouldn't reach here)
    return date + timedelta(hours=8)


def generate_document(doc_number: str, date: datetime, year: str) -> Dict:
    """
    Generate a single document header and line items.

    Returns dict with header info and list of line items.
    """
    timestamp = generate_posting_time(date)
    user = random.choice(USERS)

    # Line count distribution: 70% single, 20% double, 10% triple+
    line_count = random.choices([1, 2, 3], weights=[70, 20, 10])[0]

    # Select materials (no duplicates in same document)
    materials = random.sample(list(MATERIAL_PROFILES.keys()), min(line_count, len(MATERIAL_PROFILES)))

    lines = []
    for line_num, material_id in enumerate(materials, start=1):
        # Assign plant and storage location
        plant = random.choice(PLANTS)
        storage_loc = random.choice(STORAGE_LOCS[plant])

        # Generate batch ID
        batch_id = generate_batch_id(date)

        # Quantity: typically 20-150 cases per line
        qty_cs = random.randint(20, 150)

        # Calculate weight with variance
        actual_lb, drift_pct = calculate_weight_with_variance(material_id, qty_cs)

        lines.append({
            'doc_number': doc_number,
            'year': year,
            'line_item': str(line_num).zfill(4),  # SAP format: 0001, 0002, etc.
            'material_id': material_id,
            'plant': plant,
            'storage_loc': storage_loc,
            'batch_id': batch_id,
            'movement_type': '101',  # Goods Receipt
            'qty_cs': qty_cs,
            'qty_lb': actual_lb,
        })

    return {
        'doc_number': doc_number,
        'year': year,
        'posting_date': date.strftime('%Y-%m-%d'),
        'document_date': date.strftime('%Y-%m-%d'),
        'entry_timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        'user_id': user,
        'lines': lines
    }


def generate_sql(documents: List[Dict]) -> str:
    """Generate SQL INSERT statements for MKPF and MSEG tables."""

    sql_lines = [
        "-- Historical Backfill Data (90 days)",
        "-- Generated by generate_backfill.py",
        f"-- Date range: {documents[0]['posting_date']} to {documents[-1]['posting_date']}",
        f"-- Document count: {len(documents)}",
        "",
        "SET search_path TO sap_poc;",
        "",
        "-- Document Headers (MKPF)",
        "INSERT INTO mkpf (document_number, document_year, posting_date, document_date, entry_timestamp, user_id)",
        "VALUES"
    ]

    # Generate MKPF INSERT values
    header_values = []
    for doc in documents:
        header_values.append(
            f"  ('{doc['doc_number']}', '{doc['year']}', '{doc['posting_date']}', "
            f"'{doc['document_date']}', '{doc['entry_timestamp']}', '{doc['user_id']}')"
        )

    sql_lines.append(",\n".join(header_values) + ";")
    sql_lines.append("")

    # Generate MSEG INSERT values
    sql_lines.extend([
        "-- Line Items (MSEG)",
        "INSERT INTO mseg (document_number, document_year, line_item, material_id, plant_id, storage_location, "
        "batch_id, movement_type, quantity_base_uom, quantity_parallel_uom, uom_base, uom_parallel)",
        "VALUES"
    ])

    line_values = []
    for doc in documents:
        for line in doc['lines']:
            line_values.append(
                f"  ('{line['doc_number']}', '{line['year']}', '{line['line_item']}', "
                f"'{line['material_id']}', '{line['plant']}', '{line['storage_loc']}', "
                f"'{line['batch_id']}', '{line['movement_type']}', {line['qty_cs']}, "
                f"{line['qty_lb']}, 'CS', 'LB')"
            )

    sql_lines.append(",\n".join(line_values) + ";")

    return "\n".join(sql_lines)


def main():
    parser = argparse.ArgumentParser(
        description='Generate historical backfill data for CatchWeight analytics'
    )
    parser.add_argument(
        '--start-date',
        default='2025-12-03',
        help='Start date (YYYY-MM-DD)'
    )
    parser.add_argument(
        '--end-date',
        default='2026-02-19',
        help='End date (YYYY-MM-DD)'
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility'
    )
    parser.add_argument(
        '--output',
        default='backend/sql/006_backfill_historical.sql',
        help='Output SQL file path'
    )
    parser.add_argument(
        '--start-doc-number',
        type=int,
        default=5000000022,
        help='Starting document number (default: 5000000022)'
    )

    args = parser.parse_args()

    # Set random seed for reproducibility
    random.seed(args.seed)

    # Parse dates
    start = datetime.strptime(args.start_date, '%Y-%m-%d')
    end = datetime.strptime(args.end_date, '%Y-%m-%d')

    print(f"Generating backfill data...")
    print(f"  Date range: {args.start_date} to {args.end_date}")
    print(f"  Random seed: {args.seed}")
    print(f"  Start doc number: {args.start_doc_number}")

    # Generate documents
    documents = []
    doc_number = args.start_doc_number
    year = '2026'  # Fiscal year

    date_range = generate_date_range(start, end)

    for date, num_docs in date_range:
        for _ in range(num_docs):
            doc = generate_document(str(doc_number).zfill(10), date, year)
            documents.append(doc)
            doc_number += 1

    # Calculate line item count
    total_lines = sum(len(doc['lines']) for doc in documents)

    print(f"\nGenerated:")
    print(f"  {len(documents)} document headers (MKPF)")
    print(f"  {total_lines} line items (MSEG)")
    print(f"  Date span: {(end - start).days + 1} days")

    # Generate SQL
    sql_output = generate_sql(documents)

    # Write to file
    with open(args.output, 'w') as f:
        f.write(sql_output)

    print(f"\nOutput written to: {args.output}")
    print(f"Execute with: psql $DATABASE_URL -f {args.output}")


if __name__ == '__main__':
    main()
